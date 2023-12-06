import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ConfirmOrderDto } from './dto/create-order.dto';
import { OrderRequesType, OrderStatus } from 'src/core/enum/orderRequest.enum';
import { Prisma } from '@prisma/client';
import { RequestStatus } from 'src/core/enum/requestStatus.enum';
import { CartService } from '../cart/cart.service';
import { FilterOrderDto } from './dto/filter-order.dto';
import { Pagination, getOrderBy } from 'src/core/utils';
import { VoucherType } from 'src/core/enum/voucher.enum';

@Injectable()
export class OrderService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly cartService: CartService,
  ) {}

  async createOrder(req: any, body: ConfirmOrderDto) {
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
          orderStatusId: OrderStatus.PENDING_CONFIRM,
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
              id: op.productStoreId
            },
            select: {
              id: true,
              amount: true,
              product: true,
            }
          })
          await tx.productStore.update({
            where: {
              id: foundProductStore.id,
            },
            data: {
              amount: foundProductStore.amount - op.quantity,
              updatedAt: new Date()
            }
          });
          await tx.product.update({
            where: {
              id: foundProductStore.product.id,
            },
            data: {
              amount: foundProductStore.product.amount - op.quantity,
              updatedAt: new Date()
            }
          })
        }),
      );

      // Step: Add user to voucher's metadata
      if (foundVoucher.id) {
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

      // Create Order Request with Order ID
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
    });
    return newOrder;
  }

  async findAll(queryData: FilterOrderDto, req = null) {
    const { search, take, skip, paymentMethod, order, orderStatusId } = queryData;
    
    const query: any = {
      where: {
        paymentMethod: paymentMethod ?? undefined,
        orderStatusId: orderStatusId ? Number(orderStatusId) : undefined,
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
        paymentMethod: true,
        orderDetails: true,
        metadata: true,
        createdAt: true,
      },
    };
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
            : item.total * item['voucher'].discountValue / 100;
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
          : foundOrder.total * foundOrder['voucher'].discountValue / 100;
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
}
