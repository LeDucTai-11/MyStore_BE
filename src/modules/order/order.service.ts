import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ConfirmOrderDto } from './dto/create-order.dto';
import {
  OrderRequesType,
  OrderStatus,
  PaymentMethod,
} from 'src/core/enum/orderRequest.enum';
import { Prisma } from '@prisma/client';
import { RequestStatus } from 'src/core/enum/requestStatus.enum';
import { CartService } from '../cart/cart.service';
import { FilterOrderDto } from './dto/filter-order.dto';
import { Pagination, getOrderBy } from 'src/core/utils';
import { VoucherType } from 'src/core/enum/voucher.enum';
import { UsersService } from '../users/users.service';
import { Role } from 'src/core/enum/roles.enum';
import { isEmpty } from 'lodash';
import { PaymentService } from '../payment/payment.service';
import { PaymentConfirmDto } from '../payment/dto/payment-confirm.dto';
import { Cron } from '@nestjs/schedule';
import { OrderRequestService } from '../order-request/order-request.service';
import { logger } from 'src/logger';
import { ConfigService } from '@nestjs/config';
import { MailService } from '../mail/mail.service';
import { ShippingService } from '../shipping/shipping.service';

@Injectable()
export class OrderService {
  constructor(
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService,
    private readonly cartService: CartService,
    private readonly userService: UsersService,
    private readonly paymentService: PaymentService,
    private readonly orderRequestService: OrderRequestService,
    private readonly mailService: MailService,
    private readonly shippingService: ShippingService,
  ) {}

  @Cron('0 */30 * * * *')
  async handleCron() {
    logger.info('CronJob scheduleQueueCancelOrder start running');
    const needCanceOrders = await this.getOrderNeedCancel();
    if (!Array.isArray(needCanceOrders) || isEmpty(needCanceOrders)) return;
    const cancelOrderTasks = needCanceOrders.map(async (x) => {
      try {
        await this.orderRequestService.flowCancelOrder(x);
      } catch (error) {
        logger.error('CronJob Error processing cancel order', {
          detail: error,
        });
      }
    });
    Promise.allSettled(cancelOrderTasks)
      .then(() => {
        logger.info('CronJob scheduleQueueCancelOrder success');
      })
      .catch((error) => {
        logger.error('CronJob scheduleQueueCancelOrder error', {
          detail: error,
        });
      });
  }

  async createOrder(req: any, body: ConfirmOrderDto) {
    if (isEmpty(body.productStores)) {
      throw new BadRequestException('List Product is not null');
    }
    const productStoreIds = body.productStores.map((x) => x.productStoreId);
    const productStores = await this.prismaService.productStore.findMany({
      where: {
        id: {
          in: productStoreIds,
        },
        deletedAt: null,
      },
      select: {
        id: true,
        product: true,
        amount: true,
      },
    });
    if (productStores.length !== productStoreIds.length) {
      throw new NotFoundException('One or more productStores not found');
    }

    // Step: Check amount of product Stores in db
    const isInStock = body.productStores.every((x) => {
      const foundProduct = productStores.find((p) => p.id === x.productStoreId);
      return foundProduct.amount >= x.quantity;
    });
    if (!isInStock) {
      throw new BadRequestException('One or more productStores out of stock');
    }

    // Step: Calc prices of Order, Order Details
    const orderPrices = body.productStores.map((x) => {
      const foundProduct = productStores.find((p) => p.id === x.productStoreId);
      return {
        ...x,
        productPrice: foundProduct.product.price * x.quantity,
      };
    });
    const totalOrderPrices = orderPrices.reduce((acc, x) => {
      return acc + x.productPrice;
    }, 0);

    let foundVoucher = null;
    if (body.voucherId) {
      foundVoucher = await this.prismaService.voucher.findFirst({
        where: {
          id: body.voucherId,
          minValueOrder: {
            lte: totalOrderPrices,
          },
        },
      });
      if (
        !foundVoucher ||
        foundVoucher.metadata['users'].includes(req.user.id)
      ) {
        throw new NotFoundException('Voucher not found or invalid');
      }
    }

    let newOrder = null;
    await this.prismaService.$transaction(async (tx) => {
      //   1. Create Order
      const jsonMetadata = {
        Information: body.contact as object,
      } as Prisma.JsonObject;
      newOrder = await tx.order.create({
        data: {
          total: totalOrderPrices,
          shipping: body.shippingFee || 0,
          address: body.contact.address,
          createdBy: req.user.id,
          orderStatusId:
            body.paymentMethod === PaymentMethod.CASH_ON_DELIVERY
              ? OrderStatus.PENDING_CONFIRM
              : OrderStatus.PENDING_PAYMENT,
          paymentMethod: body.paymentMethod,
          voucherId: body.voucherId || null,
          metadata: jsonMetadata,
        },
      });

      //   Create Order Details
      await Promise.all(
        orderPrices.map(async (op) => {
          await tx.orderDetail.create({
            data: {
              productStoreId: op.productStoreId,
              quantity: op.quantity,
              orderPrice: op.productPrice,
              orderId: newOrder.id,
            },
          });
          const foundProductStore = await tx.productStore.findFirst({
            where: {
              id: op.productStoreId,
            },
            select: {
              id: true,
              amount: true,
              product: true,
            },
          });
          await tx.productStore.update({
            where: {
              id: foundProductStore.id,
            },
            data: {
              amount: foundProductStore.amount - op.quantity,
              updatedAt: new Date(),
            },
          });
          await tx.product.update({
            where: {
              id: foundProductStore.product.id,
            },
            data: {
              amount: foundProductStore.product.amount - op.quantity,
              updatedAt: new Date(),
            },
          });
        }),
      );

      // Step: Add user to voucher's metadata
      if (foundVoucher) {
        await tx.voucher.update({
          where: {
            id: foundVoucher.id,
          },
          data: {
            quantity: foundVoucher.quantity - 1,
            metadata: {
              ...foundVoucher.metadata,
              users: [
                ...(foundVoucher.metadata?.users || []),
                newOrder.createdBy,
              ],
            },
            updatedAt: new Date(),
          },
        });
      }

      // Step: Check isUser
      const isUser = (await this.userService.getRolesByReq(req)).find(
        (x) => x.roleId === Role.User,
      );
      // Create Order Request with Order ID
      if (isUser) {
        if (body.paymentMethod === PaymentMethod.CASH_ON_DELIVERY) {
          await tx.orderRequest.create({
            data: {
              createdBy: req.user.id,
              typeOfRequest: OrderRequesType.CREATE,
              requestStatusId: RequestStatus.Pending,
              orderId: newOrder.id,
            },
          });
          // Clear Cart
          await this.cartService.clearCart(req);
        }
      } else {
        await tx.order.update({
          where: {
            id: newOrder.id,
          },
          data: {
            orderStatusId: OrderStatus.CONFIRMED,
            updatedAt: new Date(),
          },
        });

        // Step: Create Bill
        await tx.bill.create({
          data: {
            orderId: newOrder.id,
            createdBy: req.user.id,
          },
        });
      }
    });
    let paymentUrl = null;
    if (body.paymentMethod === PaymentMethod.BANKING) {
      let discountValue = 0;
      if (foundVoucher) {
        discountValue =
          foundVoucher.type === VoucherType.FIXED
            ? foundVoucher.discountValue
            : (totalOrderPrices * foundVoucher.discountValue) / 100;
      }
      paymentUrl = this.paymentService.createUrlPayment(
        req,
        newOrder.id,
        totalOrderPrices + (body.shippingFee || 0) - discountValue,
      );
      await this.prismaService.order.update({
        where: {
          id: newOrder.id,
        },
        data: {
          paymentUrl: paymentUrl,
        },
      });
    }
    return {
      ...newOrder,
      paymentUrl,
    };
  }

  async findAll(queryData: FilterOrderDto, req = null) {
    const { search, take, skip, paymentMethod, order, orderStatusId } =
      queryData;

    const query: any = {
      where: {
        paymentMethod: paymentMethod ?? undefined,
        createdBy: req ? req.user.id : undefined,
      },
      take,
      skip,
      orderBy: queryData.order ? getOrderBy(order) : undefined,
      select: {
        id: true,
        total: true,
        shipping: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        voucher: {
          select: {
            id: true,
            code: true,
            minValueOrder: true,
            discountValue: true,
            type: true,
            createdAt: true,
          },
        },
        orderStatusId: true,
        paymentUrl: true,
        paymentMethod: true,
        orderDetails: true,
        metadata: true,
        createdAt: true,
      },
    };
    if (orderStatusId) {
      if (Number(orderStatusId) === OrderStatus.CONFIRMED) {
        query.where.orderStatusId = {
          in: [OrderStatus.CONFIRMED, OrderStatus.PAYMENT_CONFIRMED],
        };
      } else if (Number(orderStatusId) === OrderStatus.PENDING_CONFIRM) {
        query.where.orderStatusId = {
          in: [OrderStatus.PENDING_CONFIRM, OrderStatus.PENDING_PAYMENT],
        };
      } else {
        query.where.orderStatusId = Number(orderStatusId);
      }
    }
    if (search) {
      query.where.user = {
        OR: [
          {
            firstName: {
              contains: queryData.search,
            },
          },
          {
            lastName: {
              contains: queryData.search,
            },
          },
        ],
      };
    }

    let [total, orders] = await Promise.all([
      this.prismaService.order.count({
        where: query.where,
      }),
      this.prismaService.order.findMany(query),
    ]);

    const orderPromises = orders.map(async (item) => {
      let discountValue = 0;
      if (item['voucher']) {
        discountValue =
          item['voucher'].type === VoucherType.FIXED
            ? item['voucher'].discountValue
            : (item.total * item['voucher'].discountValue) / 100;
      }
      const orderDetails = item['orderDetails'].map(async (od) => {
        const foundProductStore =
          await this.prismaService.productStore.findFirst({
            where: {
              id: od.productStoreId,
            },
            select: {
              product: true,
            },
          });
        return {
          ...od,
          product: foundProductStore.product,
        };
      });
      return {
        ...item,
        subTotal: item.total,
        discountValue,
        total: item.total + item.shipping - discountValue,
        orderDetails: await Promise.all(orderDetails),
      };
    });
    return Pagination.of(take, skip, total, await Promise.all(orderPromises));
  }

  async findById(id: string) {
    const foundOrder = await this.prismaService.order.findFirst({
      where: {
        id,
      },
      select: {
        id: true,
        total: true,
        shipping: true,
        createdBy: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        voucher: {
          select: {
            id: true,
            code: true,
            minValueOrder: true,
            discountValue: true,
            type: true,
            createdAt: true,
          },
        },
        orderStatusId: true,
        paymentMethod: true,
        paymentUrl: true,
        orderDetails: true,
        metadata: true,
        createdAt: true,
      },
    });
    if (!foundOrder) {
      throw new NotFoundException('Order not found');
    }
    let discountValue = 0;
    if (foundOrder['voucher']) {
      discountValue =
        foundOrder['voucher'].type === VoucherType.FIXED
          ? foundOrder['voucher'].discountValue
          : (foundOrder.total * foundOrder['voucher'].discountValue) / 100;
    }
    const orderDetails = foundOrder.orderDetails.map(async (od) => {
      const foundProductStore = await this.prismaService.productStore.findFirst(
        {
          where: {
            id: od.productStoreId,
          },
          select: {
            product: true,
          },
        },
      );
      return {
        ...od,
        product: foundProductStore.product,
      };
    });
    return {
      ...foundOrder,
      subTotal: foundOrder.total,
      discountValue,
      total: foundOrder.total + foundOrder.shipping - discountValue,
      orderDetails: await Promise.all(orderDetails),
    };
  }

  async paymentConfirm(req: any, orderId: string, body: PaymentConfirmDto) {
    if (orderId !== body.vnpParam['vnp_TxnRef']) {
      throw new BadRequestException('The VNPAY information is invalid.');
    }
    const respConfirmPayment = await this.paymentService.queryPayment(
      req,
      body.vnpParam,
    );
    
    if (
      orderId !== body.vnpParam['vnp_TxnRef'] ||
      respConfirmPayment['vnp_ResponseCode'] !== '00'
    ) {
      throw new BadRequestException('The VNPAY information is invalid.');
    }
    const foundOrder = await this.prismaService.order.findUnique({
      where: {
        id: orderId,
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
                storeId: true,
              },
            },
          },
        },
      },
    });
    if (!foundOrder) {
      throw new NotFoundException('Order not found');
    }
    let discountValue = 0;
    if (foundOrder['voucher']) {
      discountValue =
        foundOrder['voucher'].type === VoucherType.FIXED
          ? foundOrder['voucher'].discountValue
          : (foundOrder.total * foundOrder['voucher'].discountValue) / 100;
    }
    const totalPrice = foundOrder.total + foundOrder.shipping - discountValue;
    if (totalPrice !== body.amount) {
      throw new BadRequestException('The price is false !');
    }
    const { vnpParam, ...bodyUpdate } = body;
    return this.prismaService.$transaction(async (tx) => {
      // Save a record payment
      await tx.payment.create({
        data: {
          orderId,
          ...bodyUpdate,
        },
      });

      // Update status of Order
      await tx.order.update({
        where: {
          id: foundOrder.id,
        },
        data: {
          orderStatusId: OrderStatus.PAYMENT_CONFIRMED,
          updatedAt: new Date(),
        },
      });

      // Clear Cart
      await this.cartService.clearCart(req);

      // Send information of Order to mail
      const foundUser = await this.userService.findByID(foundOrder.createdBy);
      await this.mailService.sendOrderDetails(foundUser.email, foundOrder);

      // Create shipping 
      const generateShipper = await this.shippingService.generateShipper([]);
      await tx.shipping.create({
        data: {
          shipperId: generateShipper.id,
          storeId: foundOrder.orderDetails[0].productStore.storeId,
          requestStatusId: RequestStatus.Pending,
          orderId: foundOrder.id,
          metadata: {
            shippers: [generateShipper.id],
          }
        }
      });

      // Create bill
      return tx.bill.create({
        data: {
          orderId: foundOrder.id,
          createdBy: req.user.id,
        },
      });
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
}
