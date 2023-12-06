import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { FilterBillDto } from './dto/filter-bill.dto';
import { Pagination, getOrderBy } from 'src/core/utils';

@Injectable()
export class BillService {
  constructor(private readonly prismaService: PrismaService) {}

  async findAll(queryData: FilterBillDto) {
    const { search, take, skip, order, createdBy } = queryData;
    const query: any = {
      where: {
        createdBy: createdBy ?? undefined,
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
    return Pagination.of(take, skip, total, await Promise.all(bills));
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
    if(!foundBill) {
        throw new NotFoundException('The bill was not found');
    }
    return foundBill;
  }
}
