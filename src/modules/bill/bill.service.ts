import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { FilterBillDto } from './dto/filter-bill.dto';
import { Pagination, getOrderBy } from 'src/core/utils';
import { VoucherType } from 'src/core/enum/voucher.enum';
import { Role } from 'src/core/enum/roles.enum';

@Injectable()
export class BillService {
  constructor(private readonly prismaService: PrismaService) {}

  async findAll(queryData: FilterBillDto) {
    const { search, take, skip, order, createdBy } = queryData;
    const query: any = {
      where: {
        createdBy: createdBy ?? undefined,
        order: {
          user: {
            userRoles: {
              some: {
                roleId: {
                  in: [Role.Admin, Role.Staff],
                },
              },
            },
          },
        },
      },
      take,
      skip,
      orderBy: queryData.order ? getOrderBy(order) : undefined,
      select: {
        id: true,
        createdBy: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        order: {
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
        },
        createdAt: true,
      },
    };
    if (search) {
      query.where.order = {
        user: {
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
        },
      };
    }
    const [total, bills] = await Promise.all([
      this.prismaService.bill.count({
        where: query.where,
      }),
      this.prismaService.bill.findMany(query),
    ]);
    const billPromises = bills.map(async (bill) => {
      const order = bill['order'];
      let discountValue = 0;
      if (order['voucher']) {
        discountValue =
          order['voucher'].type === VoucherType.FIXED
            ? order['voucher'].discountValue
            : (order.total * order['voucher'].discountValue) / 100;
      }
      const orderDetails = order['orderDetails'].map(async (od) => {
        const foundProductStore =
          await this.prismaService.productStore.findFirst({
            where: {
              id: od.productStoreId,
            },
            select: {
              product: true,
              store: true,
            },
          });
        return {
          ...od,
          product: foundProductStore.product,
          store: foundProductStore.store,
        };
      });
      return {
        ...bill,
        order: {
          ...order,
          subTotal: order.total,
          discountValue,
          total: order.total + order.shipping - discountValue,
          orderDetails: await Promise.all(orderDetails),
        },
      };
    });
    return Pagination.of(take, skip, total, await Promise.all(billPromises));
  }

  async findByID(id: string) {
    const foundBill = await this.prismaService.bill.findFirst({
      where: {
        id: id,
      },
      select: {
        id: true,
        createdBy: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        order: {
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
        },
        createdAt: true,
      },
    });
    if (!foundBill) {
      throw new NotFoundException('The bill was not found');
    }
    const order = foundBill['order'];
    let discountValue = 0;
    if (order['voucher']) {
      discountValue =
        order['voucher'].type === VoucherType.FIXED
          ? order['voucher'].discountValue
          : (order.total * order['voucher'].discountValue) / 100;
    }
    const orderDetails = order['orderDetails'].map(async (od) => {
      const foundProductStore = await this.prismaService.productStore.findFirst(
        {
          where: {
            id: od.productStoreId,
          },
          select: {
            product: true,
            store: true,
          },
        },
      );
      return {
        ...od,
        product: foundProductStore.product,
        store: foundProductStore.store,
      };
    });
    return {
      ...foundBill,
      order: {
        ...order,
        subTotal: order.total,
        discountValue,
        total: order.total + order.shipping - discountValue,
        orderDetails: await Promise.all(orderDetails),
      },
    };
    return foundBill;
  }
}
