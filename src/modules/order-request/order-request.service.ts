import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  CreateModifyOrderRequestDto,
  UpdateOrderRequestStatusDto,
} from './dto/update-order-request.dto';
import {
  OrderRequesType,
  OrderStatus,
  PaymentMethod,
} from 'src/core/enum/orderRequest.enum';
import { RequestStatus } from 'src/core/enum/requestStatus.enum';
import { MailService } from '../mail/mail.service';
import { UsersService } from '../users/users.service';
import { FilterOrderRequestDto } from './dto/filter-order-request.dto';
import { Pagination, forceDataToArray, getOrderBy } from 'src/core/utils';
import { isEmpty } from 'lodash';
import { VoucherType } from 'src/core/enum/voucher.enum';

@Injectable()
export class OrderRequestService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly mailService: MailService,
    private readonly userService: UsersService,
  ) {}

  async findAll(queryData: FilterOrderRequestDto, req = null) {
    const { search, take, skip, requestStatusId, paymentMethod, order } =
      queryData;
    const query: any = {
      where: {
        requestStatusId: requestStatusId ?? undefined,
        order: {
          paymentMethod: paymentMethod ?? undefined,
        },
        deletedAt: null,
      },
      take,
      skip,
      orderBy: queryData.order ? getOrderBy(order) : undefined,
      select: {
        id: true,
        typeOfRequest: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        requestStatusId: true,
        order: true,
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

    let [total, orderRequests] = await Promise.all([
      this.prismaService.orderRequest.count({
        where: query.where,
      }),
      this.prismaService.orderRequest.findMany(query),
    ]);

    const orderRequestPromises = orderRequests.map(async (item) => {
      const orderDetails = (
        await this.prismaService.orderDetail.findMany({
          where: {
            orderId: item['order'].id,
          },
          select: {
            id: true,
            quantity: true,
            orderPrice: true,
            orderId: true,
            productStoreId: true,
            productStore: {
              select: {
                id: true,
                product: true,
              },
            },
          },
        })
      ).map((item) => {
        return {
          ...item,
          productStore: undefined,
          product: item.productStore.product,
        };
      });
      let discountValue = 0;
      let foundVoucher = null;
      if (item['order'].voucherId) {
        foundVoucher = await this.prismaService.voucher.findFirst({
          where: {
            id: item['order'].voucherId,
          },
          select: {
            id: true,
            code: true,
            description: true,
            minValueOrder: true,
            discountValue: true,
            type: true,
          },
        });
      }

      if (foundVoucher) {
        discountValue =
          foundVoucher.type === VoucherType.FIXED
            ? foundVoucher.discountValue
            : (item['order'].total * foundVoucher.discountValue) / 100;
      }

      return {
        ...item,
        order: {
          ...item['order'],
          subTotal: item['order'].total,
          discountValue,
          total: item['order'].total + item['order'].shipping - discountValue,
          voucher: foundVoucher,
          orderDetails,
        },
      };
    });
    return Pagination.of(
      take,
      skip,
      total,
      await Promise.all(orderRequestPromises),
    );
  }

  async findById(id: string) {
    const foundOrderRequest = await this.prismaService.orderRequest.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      select: {
        id: true,
        typeOfRequest: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        requestStatusId: true,
        order: true,
        createdAt: true,
      },
    });
    if (!foundOrderRequest) {
      throw new NotFoundException('Order Request not found');
    }
    const orderDetails = (
      await this.prismaService.orderDetail.findMany({
        where: {
          orderId: foundOrderRequest.order.id,
        },
        select: {
          id: true,
          quantity: true,
          orderPrice: true,
          orderId: true,
          productStoreId: true,
          productStore: {
            select: {
              id: true,
              product: true,
            },
          },
        },
      })
    ).map((item) => {
      return {
        ...item,
        productStore: undefined,
        product: item.productStore.product,
      };
    });
    let discountValue = 0;
    let foundVoucher = null;
    if (foundOrderRequest.order.voucherId) {
      foundVoucher = await this.prismaService.voucher.findFirst({
        where: {
          id: foundOrderRequest.order.voucherId,
        },
        select: {
          id: true,
          code: true,
          description: true,
          minValueOrder: true,
          discountValue: true,
          type: true,
        },
      });
    }

    if (foundVoucher) {
      discountValue =
        foundVoucher.type === VoucherType.FIXED
          ? foundVoucher.discountValue
          : (foundOrderRequest.order.total * foundVoucher.discountValue) / 100;
    }
    return {
      ...foundOrderRequest,
      order: {
        ...foundOrderRequest.order,
        voucher: foundVoucher,
        subTotal: foundOrderRequest.order.total,
        discountValue,
        total:
          foundOrderRequest.order.total +
          foundOrderRequest.order.shipping -
          discountValue,
        orderDetails,
      },
    };
  }

  async updateModifyRequestStatusByAdmin(
    updateDto: UpdateOrderRequestStatusDto,
    req: any,
    id: string,
  ) {
    const orderRequest = await this.prismaService.orderRequest.findUnique({
      where: {
        id,
        requestStatusId: RequestStatus.Pending,
        deletedAt: null,
      },
    });
    if (!orderRequest) {
      throw new NotFoundException('The OrderRequest not found.');
    }

    const order = await this.prismaService.order.findUnique({
      where: {
        id: orderRequest.orderId,
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
    let respData: any;
    const requestStatusId: RequestStatus = updateDto.requestStatusId;
    return this.prismaService.$transaction(async (tx) => {
      if (orderRequest.typeOfRequest === OrderRequesType.CREATE) {
        respData = await this.modifyOrderReqCreateOrder(
          orderRequest,
          order,
          requestStatusId,
          req,
        );
      } else if (orderRequest.typeOfRequest === OrderRequesType.CANCEL) {
        respData = await this.modifyOrderReqCancelOrder(
          orderRequest,
          order,
          requestStatusId,
        );
      }

      // Update booking request status
      await tx.orderRequest.update({
        where: {
          id: orderRequest.id,
        },
        data: {
          requestStatusId,
          updatedAt: new Date(),
          approvedAt:
            requestStatusId === RequestStatus.Approved ? new Date() : null,
          approvedBy:
            requestStatusId === RequestStatus.Approved ? req.user?.id : null,
          canceledAt:
            requestStatusId === RequestStatus.Rejected ? new Date() : null,
          canceledBy:
            requestStatusId === RequestStatus.Rejected ? req.user?.id : null,
        },
      });
      return respData;
    });
  }

  async modifyOrderReqCancelOrder(
    orderRequest: any,
    order: any,
    requestStatusId: RequestStatus,
  ) {
    if (requestStatusId === RequestStatus.Approved) {
      return this.prismaService.$transaction(async (tx) => {
        const updatedOrder = await tx.order.update({
          where: {
            id: order.id,
          },
          data: {
            orderStatusId: OrderStatus.CANCELED,
            deletedAt: new Date(),
          },
        });
        await tx.orderDetail.updateMany({
          where: {
            orderId: order.id,
          },
          data: {
            deletedAt: new Date(),
          },
        });

        // Step: Update amount of Product,ProductStores
        await Promise.all(
          order.orderDetails.map(async (od) => {
            const foundProduct = await tx.product.findFirst({
              where: {
                id: od.productStore.productId,
              },
            });
            await tx.productStore.update({
              where: {
                id: od.productStore.id,
              },
              data: {
                amount: od.productStore.amount + od.quantity,
                updatedAt: new Date(),
              },
            });
            await tx.product.update({
              where: {
                id: foundProduct.id,
              },
              data: {
                amount: foundProduct.amount + od.quantity,
                updatedAt: new Date(),
              },
            });
          }),
        );
        return {
          status: true,
          data: updatedOrder,
        };
      });
    } else if (requestStatusId === RequestStatus.Rejected) {
      return {
        status: false,
        data: {
          msg: 'Order request has been rejected',
        },
      };
    }
  }

  async modifyOrderReqCreateOrder(
    orderRequest: any,
    order: any,
    requestStatusId: RequestStatus,
    req: any,
  ) {
    if (requestStatusId === RequestStatus.Approved) {
      return this.prismaService.$transaction(async (tx) => {
        // Step: Update Order
        await tx.order.update({
          where: {
            id: order.id,
          },
          data: {
            orderStatusId:
              order.paymentMethod === PaymentMethod.CASH_ON_DELIVERY
                ? OrderStatus.CONFIRMED
                : OrderStatus.PAYMENT_CONFIRMED,
            cancelExpiredAt: new Date(Date.now() + 4 * 60 * 60000),
            updatedAt: new Date(),
          },
        });

        // Step: Create Bill
        const newBill = await tx.bill.create({
          data: {
            orderId: order.id,
            createdBy: req.user.id,
          },
        });

        // Send information of Order to mail
        const foundUser = await this.userService.findByID(order.createdBy);
        await this.mailService.sendOrderDetails(foundUser.email, order);
        return {
          status: true,
          data: newBill,
        };
      });
    } else if (requestStatusId === RequestStatus.Rejected) {
      return this.prismaService.$transaction(async (tx) => {
        await tx.order.update({
          where: {
            id: order.id,
          },
          data: {
            orderStatusId: OrderStatus.CANCELED,
            deletedAt: new Date(),
          },
        });
        await tx.orderDetail.updateMany({
          where: {
            orderId: order.id,
          },
          data: {
            deletedAt: new Date(),
          },
        });

        // Step: Update amount of Product,ProductStores
        await Promise.all(
          order.orderDetails.map(async (od) => {
            const foundProduct = await tx.product.findFirst({
              where: {
                id: od.productStore.productId,
              },
            });
            await tx.productStore.update({
              where: {
                id: od.productStore.id,
              },
              data: {
                amount: od.productStore.amount + od.quantity,
                updatedAt: new Date(),
              },
            });
            await tx.product.update({
              where: {
                id: foundProduct.id,
              },
              data: {
                amount: foundProduct.amount + od.quantity,
                updatedAt: new Date(),
              },
            });
          }),
        );

        // Step: Remove user in voucher's metadata
        if (order.voucherId) {
          await tx.voucher.update({
            where: {
              id: order.voucherId,
            },
            data: {
              quantity: order.voucher.quantity + 1,
              metadata: {
                ...order.voucher.metadata,
                users: (order.voucher.metadata?.users || []).filter(
                  (x) => x !== order.createdBy,
                ),
              },
              updatedAt: new Date(),
            },
          });
        }

        return {
          status: false,
          data: {
            msg: 'Order request has been rejected',
          },
        };
      });
    }
  }

  async handleCreateModifyOrderRequest(
    createModifyBookingRequestDto: CreateModifyOrderRequestDto,
    req: any,
  ) {
    if (createModifyBookingRequestDto.requestType === OrderRequesType.CANCEL) {
      // Check list order Request with Status Pending and type Create
      const foundOrderRequest = await this.prismaService.orderRequest.findFirst(
        {
          where: {
            orderId: createModifyBookingRequestDto.orderId,
            requestStatusId: RequestStatus.Pending,
            typeOfRequest: OrderRequesType.CREATE,
            createdBy: req.user.id,
            deletedAt: null,
          },
        },
      );

      if (foundOrderRequest) {
        return this.prismaService.$transaction(async (tx) => {
          const orderDetails = await tx.orderDetail.findMany({
            where: {
              orderId: foundOrderRequest.orderId,
            },
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
          });
          await tx.orderDetail.updateMany({
            where: {
              orderId: foundOrderRequest.orderId,
            },
            data: {
              deletedAt: new Date(),
            },
          });
          await tx.order.update({
            where: {
              id: foundOrderRequest.orderId,
            },
            data: {
              orderStatusId: OrderStatus.CANCELED,
              deletedAt: new Date(),
            },
          });

          // Step: Update amount of Product,ProductStores
          await Promise.all(
            orderDetails.map(async (od) => {
              const foundProduct = await tx.product.findFirst({
                where: {
                  id: od.productStore.productId,
                },
              });
              await tx.productStore.update({
                where: {
                  id: od.productStore.id,
                },
                data: {
                  amount: od.productStore.amount + od.quantity,
                  updatedAt: new Date(),
                },
              });
              await tx.product.update({
                where: {
                  id: foundProduct.id,
                },
                data: {
                  amount: foundProduct.amount + od.quantity,
                  updatedAt: new Date(),
                },
              });
            }),
          );
          return await this.prismaService.orderRequest.update({
            where: {
              id: foundOrderRequest.id,
            },
            data: {
              requestStatusId: RequestStatus.Rejected,
              deletedAt: new Date(),
            },
          });
        });
      }

      // Check request Cancel already exist in db
      const foundRequestCancel =
        await this.prismaService.orderRequest.findFirst({
          where: {
            orderId: createModifyBookingRequestDto.orderId,
            requestStatusId: RequestStatus.Pending,
            typeOfRequest: OrderRequesType.CANCEL,
            createdBy: req.user.id,
            deletedAt: null,
          },
        });
      if (foundRequestCancel) {
        throw new BadRequestException('You created Cancel Request in the past');
      }

      const foundOrder = await this.prismaService.order.findFirst({
        where: {
          id: createModifyBookingRequestDto.orderId,
          orderStatusId: OrderStatus.CONFIRMED,
          cancelExpiredAt: {
            gte: new Date(),
          },
        },
      });
      if (!foundOrder) {
        throw new BadRequestException(`You can't cancel this order`);
      }
      return this.prismaService.orderRequest.create({
        data: {
          typeOfRequest: OrderRequesType.CANCEL,
          createdBy: req.user.id,
          orderId: createModifyBookingRequestDto.orderId,
          requestStatusId: RequestStatus.Pending,
        },
      });
    }
    throw new BadRequestException('ACTION_NOT_FOUND');
  }
}
