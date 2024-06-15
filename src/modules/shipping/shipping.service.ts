import { Injectable, NotFoundException } from '@nestjs/common';
import { Role } from 'src/core/enum/roles.enum';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateShippingrRequestStatusDto } from './dto/update-shipping-request.dto';
import { RequestStatus } from 'src/core/enum/requestStatus.enum';
import { OrderStatus } from 'src/core/enum/orderRequest.enum';
import { get } from 'lodash';
import { forceDataToArray } from 'src/core/utils';
import { FirebaseService } from 'src/firebase/firebase.service';

@Injectable()
export class ShippingService {
  constructor(
    private prismaService: PrismaService,
    private firebaseService: FirebaseService,
  ) {}

  generateShipper(excludedIds: string[],storeId: string) {
    return this.prismaService.user.findFirst({
      where: {
        id: {
          notIn: excludedIds,
        },
        storeId,
        userRoles: {
          some: {
            roleId: {
              in: [Role.Shipper],
            },
          },
        },
        deletedAt: null,
      },
    });
  }

  async updateModifyShippingRequestStatus(
    updateDto: UpdateShippingrRequestStatusDto,
    req: any,
    id: string,
  ) {
    const foundShipping = await this.prismaService.shipping.findUnique({
      where: {
        id,
        requestStatusId: RequestStatus.Pending,
        deletedAt: null,
      },
      include: {
        store: true,
        order: true,
      }
    });
    if (!foundShipping) {
      throw new NotFoundException('The Shipping request not found.');
    }

    const requestStatusId: RequestStatus = updateDto.requestStatusId;
    if (requestStatusId === RequestStatus.Approved) {
      return this.prismaService.$transaction(async (tx) => {
        await tx.shipping.update({
          where: {
            id: foundShipping.id,
          },
          data: {
            requestStatusId: RequestStatus.Approved,
            updatedAt: new Date(),
          },
        });

        await tx.order.update({
          where: {
            id: foundShipping.orderId,
          },
          data: {
            orderStatusId: OrderStatus.DELIVERING,
            updatedAt: new Date(),
          },
        });

        return {
          status: true,
          data: {
            msg: 'The shipping request has been approved',
          },
        };
      });
    } else if (requestStatusId === RequestStatus.Rejected) {
      return this.prismaService.$transaction(async (tx) => {
        // update shipping
        const excludedShipperIds = forceDataToArray(
          get(foundShipping, 'metadata.shippers'),
        );
        const generateShipper = await this.generateShipper(excludedShipperIds,foundShipping.storeId);
        await tx.shipping.update({
          where: {
            id: foundShipping.id,
          },
          data: {
            shipperId: generateShipper.id,
            metadata: {
              shippers: [...(excludedShipperIds || []), generateShipper.id],
            },
            updatedAt: new Date(),
          },
        });

        await this.firebaseService.sendDataToFirebase(
          `delivery/${generateShipper.id}`,
          {
            status: 0,
            storeAddress: foundShipping.store.address,
            userId: foundShipping.order.createdBy,
            shippingId: foundShipping.id,
          },
        );

        return {
          status: false,
          data: {
            msg: 'The shipping request has been rejected and will give to another shipper',
          },
        };
      });
    }
  }

  getListShippingRequest(req: any) {
    return this.prismaService.shipping.findMany({
      where: {
        shipperId: req.user.id,
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        order: true,
      },
    });
  }

  async modifyStatusCompleted(shippingId: string, req: any) {
    const foundShipping = await this.prismaService.shipping.findFirst({
      where: {
        id: shippingId,
        deletedAt: null,
        shipperId: req.user.id,
      },
    });
    if (!foundShipping) {
      throw new NotFoundException('The shipping request not found');
    }

    return this.prismaService.$transaction(async (tx) => {
      await tx.order.update({
        where: {
          id: foundShipping.orderId,
        },
        data: {
          orderStatusId: OrderStatus.COMPLETED,
          updatedAt: new Date(),
        },
      });

      return {
        status: true,
        data: {
          msg: 'The order has been shipped successfully',
        },
      };
    });
  }
}
