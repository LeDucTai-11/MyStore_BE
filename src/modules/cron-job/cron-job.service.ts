import { Injectable } from '@nestjs/common';
import { OrderStatus, PaymentMethod } from 'src/core/enum/orderRequest.enum';
import { logger } from 'src/logger';
import { PrismaService } from 'src/prisma/prisma.service';
import { isEmpty } from 'lodash';
import * as cron from 'node-cron';

@Injectable()
export class CronJobService {
  constructor(private readonly prismaService: PrismaService) {
    this.scheduleJob();
  }

  scheduleJob() {
    cron.schedule('*/5 * * * *', async () => {
      logger.info('CronJob scheduleQueueCancelOrder start running');
      const needCancelOrders = await this.getOrderNeedCancel();
      if (!Array.isArray(needCancelOrders) || isEmpty(needCancelOrders)) return;
      for (let i = 0; i < needCancelOrders.length; i++) {
        try {
          await this.flowCancelOrder(needCancelOrders[i]);
          logger.info('CronJob scheduleQueueCancelOrder success');
        } catch (error) {
          logger.error('CronJob Error processing cancel order', {
            detail: error,
          });
        }
      }
    });
  }

  async getOrderNeedCancel() {
    const deadline = Number(process.env.ORDER_PAYMENT_CONFIRMATION_DEADLINE);
    const currentTime = new Date();
    currentTime.setMinutes(currentTime.getMinutes() - deadline);
    return this.prismaService.order.findMany({
      where: {
        orderStatusId: OrderStatus.PENDING_PAYMENT,
        paymentMethod: PaymentMethod.BANKING,
        createdAt: {
          lt: currentTime,
        },
        deletedAt: null,
      },
      select: {
        id: true,
        total: true,
        shipping: true,
        paymentMethod: true,
        voucherId: true,
        voucher: true,
        metadata: true,
        createdBy: true,
        orderDetails: {
          select: {
            id: true,
            quantity: true,
            productStore: {
              select: {
                id: true,
                amount: true,
                productId: true,
                product: true,
              },
            },
          },
        },
      },
    });
  }

  async flowCancelOrder(order: any) {
    return await this.prismaService.$transaction(async (tx) => {
      await tx.orderDetail.updateMany({
        where: {
          orderId: order.id,
        },
        data: {
          deletedAt: new Date(),
        },
      });
      const updatedOrder = await tx.order.update({
        where: {
          id: order.id,
        },
        data: {
          orderStatusId: OrderStatus.CANCELED,
          deletedAt: new Date(),
        },
      });

      // Step: Update amount of Product,ProductStores
      await Promise.all(
        order.orderDetails.map(async (od) => {
          const foundProductStore = await tx.productStore.findFirst({
            where: {
              id: od.productStore.id,
            },
            include: {
              product: true,
            },
          });
          await tx.productStore.update({
            where: {
              id: foundProductStore.id,
            },
            data: {
              amount: foundProductStore.amount + od.quantity,
              updatedAt: new Date(),
            },
          });
          await tx.product.update({
            where: {
              id: foundProductStore.productId,
            },
            data: {
              amount: foundProductStore.product.amount + od.quantity,
              updatedAt: new Date(),
            },
          });
        }),
      );

      return updatedOrder;
    });
  }
}
