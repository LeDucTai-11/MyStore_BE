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

@Injectable()
export class OrderRequestService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly mailService: MailService,
    private readonly userService: UsersService,
  ) {}

  async findAllByReq(req: any) {
    return this.prismaService.orderRequest.findMany({
      where: {
        createdBy: req.user.id,
      },
      select: {
        id: true,
        typeOfRequest: true,
        requestStatusId: true,
        order: true,
        createdAt: true,
      },
    });
  }

  async findAll(queryData: FilterOrderRequestDto) {
    const { search, take, skip, requestStatusId, paymentMethod, order } = queryData;
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
          }
        },
        requestStatusId: true,
        order: true,
        createdAt: true,
      }
    }
    if(search) {
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
      }
    }
    
    const [total, orderRequests] = await Promise.all([
      this.prismaService.orderRequest.count({
        where: query.where,
      }),
      this.prismaService.orderRequest.findMany(query),
    ]);
    return Pagination.of(take, skip, total, orderRequests);
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
          }
        },
        requestStatusId: true,
        order: true,
        createdAt: true,
      }
    })
    if(!foundOrderRequest) {
      throw new NotFoundException('Order Request not found');
    }
    return foundOrderRequest;
  }

  async updateModifyRequestStatusByAdmin(
    updateDto: UpdateOrderRequestStatusDto,
    req: any,
    id: string,
  ) {
    const orderRequest = await this.prismaService.orderRequest.findUnique({
      where: {
        id,
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
      const updatedOrder = await this.prismaService.order.update({
        where: {
          id: order.id,
        },
        data: {
          orderStatusId: OrderStatus.CANCELED,
          updatedAt: new Date(),
        },
      });
      return {
        status: true,
        data: updatedOrder,
      };
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
  ) {
    if (requestStatusId === RequestStatus.Approved) {
      return this.prismaService.$transaction(async (tx) => {
        // Step: Check amount of product Stores in db
        const isInStock = order.orderDetails.every((x) => {
          return x.productStore.amount >= x.quantity;
        });
        if (!isInStock) {
          throw new BadRequestException(
            'One or more productStores out of stock',
          );
        }

        // Step: Update Order
        await this.prismaService.order.update({
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

        // Step: Add user to voucher's metadata
        if (order.voucherId) {
          await this.prismaService.voucher.update({
            where: {
              id: order.voucherId,
            },
            data: {
              quantity: order.voucher.quantity - 1,
              metadata: {
                ...order.voucher.metadata,
                users: [
                  ...(order.voucher.metadata?.users || []),
                  order.createdBy,
                ],
              },
              updatedAt: new Date(),
            },
          });
        }

        // Step: Update amount of Product,ProductStores
        await Promise.all(
          order.orderDetails.map(async (od) => {
            const foundProduct = await this.prismaService.product.findFirst({
              where: {
                id: od.productStore.productId,
              },
            });
            await this.prismaService.productStore.update({
              where: {
                id: od.productStore.id,
              },
              data: {
                amount: od.productStore.amount - od.quantity,
                updatedAt: new Date(),
              },
            });
            await this.prismaService.product.update({
              where: {
                id: foundProduct.id,
              },
              data: {
                amount: foundProduct.amount - od.quantity,
                updatedAt: new Date(),
              },
            });
          }),
        );

        // Step: Create Bill
        const newBill = await this.prismaService.bill.create({
          data: {
            orderId: order.id,
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
      await this.prismaService.order.update({
        where: {
          id: order.id,
        },
        data: {
          orderStatusId: OrderStatus.CANCELED,
          updatedAt: new Date(),
        },
      });
      return {
        status: false,
        data: {
          msg: 'Order request has been rejected',
        },
      };
    }
  }

  async handleCreateModifyOrderRequest(
    createModifyBookingRequestDto: CreateModifyOrderRequestDto,
    req: any,
  ) {
    if (createModifyBookingRequestDto.requestType === OrderRequesType.CANCEL) {
      const foundOrder = await this.prismaService.order.findFirst({
        where: {
          id: createModifyBookingRequestDto.orderId,
          OR: [
            {
              orderStatusId: OrderStatus.PENDING_CONFIRM,
            },
            {
              orderStatusId: OrderStatus.CONFIRMED,
              cancelExpiredAt: {
                gte: new Date(),
              },
            },
          ],
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
