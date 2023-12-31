import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { GetStatisticRevenueDto } from './dto/statistic-revenue.dto';
import { TimeStatisticType } from 'src/core/enum/statistic.enum';
import { OrderStatus } from 'src/core/enum/orderRequest.enum';
import { ProductService } from '../product/product.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly productService: ProductService,
  ) {}

  async getStatisticRevenue(queryData: GetStatisticRevenueDto) {
    const timeStatisticType = queryData.timeStatisticType;
    if (timeStatisticType === TimeStatisticType.WEEEKLY) {
      return this.getStatisticWeekly();
    } else if (timeStatisticType === TimeStatisticType.MONTHLY) {
      return this.getStatisticMonthly();
    }
  }

  async getStatisticMonthly() {
    const currentDate = new Date();
    const response = {};
    for (let i = 29; i >= 0; i = i - 6) {
      const startDate = new Date(currentDate);
      startDate.setDate(startDate.getDate() - i);

      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 5);

      const formatStartDate = this.formatDate(startDate);
      const formatEndDate = this.formatDate(endDate);

      response[`${formatStartDate}-${formatEndDate}`] = {
        revenue: await this.getPriceOfBills(startDate, endDate),
        expense: await this.getPriceOfImportOrders(startDate, endDate),
      };
    }
    return response;
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      day: '2-digit',
      month: '2-digit',
    });
  }

  async getStatisticWeekly() {
    const currentDate = new Date();
    const response = {};
    for (let i = 6; i >= 0; i--) {
      const date = new Date(currentDate);
      date.setDate(date.getDate() - i);
      const formattedDate = this.formatDate(date);
      response[formattedDate] = {
        revenue: await this.getPriceOfBills(date, date),
        expense: await this.getPriceOfImportOrders(date, date),
      };
    }
    return response;
  }

  async getPriceOfImportOrders(startDate: Date, endDate: Date, storeId = null) {
    const startDateTime = new Date(startDate);
    startDateTime.setHours(0, 0, 0, 0);

    const endDateTime = new Date(endDate);
    endDateTime.setHours(23, 59, 59, 999);
    const listImportOrders = await this.prismaService.importOrder.findMany({
      where: {
        createdAt: {
          gte: startDateTime,
          lt: endDateTime,
        },
        deletedAt: null,
      },
      select: {
        total: true,
        importOderDetails: {
          select: {
            importPrice: true,
            productStore: {
              select: {
                store: true,
              },
            },
          },
        },
      },
    });
    if (storeId) {
      let total = 0;
      listImportOrders.forEach((importOrder) => {
        importOrder.importOderDetails.forEach((detail) => {
          if (detail.productStore.store.id === storeId) {
            total += detail.importPrice;
          }
        });
      });
      return total;
    }
    return listImportOrders.reduce((acc, item) => {
      return acc + item.total;
    }, 0);
  }

  async getAllOrders(startDate: Date, endDate: Date) {
    const startDateTime = new Date(startDate);
    startDateTime.setHours(0, 0, 0, 0);

    const endDateTime = new Date(endDate);
    endDateTime.setHours(23, 59, 59, 999);
    return this.prismaService.order.findMany({
      where: {
        createdAt: {
          gte: startDateTime,
          lt: endDateTime,
        },
        deletedAt: null,
        orderStatusId: OrderStatus.CONFIRMED || OrderStatus.PAYMENT_CONFIRMED,
      },
      select: {
        total: true,
        orderDetails: {
          select: {
            quantity: true,
            orderPrice: true,
            productStore: {
              select: {
                store: true,
              },
            },
          },
        },
      },
    });
  }

  async getPriceOfBills(startDate: Date, endDate: Date, storeId = null) {
    const listOrders = await this.getAllOrders(startDate, endDate);
    if (storeId) {
      let total = 0;
      listOrders.forEach((order) => {
        order.orderDetails.forEach((orderDetails) => {
          if (orderDetails.productStore.store.id === storeId) {
            total += orderDetails.orderPrice;
          }
        });
      });
      return total;
    }
    return listOrders.reduce((acc, item) => {
      return acc + item.total;
    }, 0);
  }

  async getTotalOrders(startDate: Date, endDate: Date) {
    const listOrders = await this.getAllOrders(startDate, endDate);
    return listOrders.length;
  }

  async getTotalProductOrders(startDate: Date, endDate: Date) {
    const listOrders = await this.getAllOrders(startDate, endDate);
    let quantity = 0;
    listOrders.forEach((order) => {
      order.orderDetails.forEach((orderDetail) => {
        quantity += orderDetail.quantity;
      });
    });
    return quantity;
  }

  async getStatisticStore(startDate: Date, endDate: Date) {
    const listStores = await this.prismaService.store.findMany({
      where: {
        deletedAt: null,
      },
    });
    return Promise.all(
      listStores.map(async (store) => {
        return {
          address: store.address,
          revenue: await this.getPriceOfBills(startDate, endDate, store.id),
          expense: await this.getPriceOfImportOrders(
            startDate,
            endDate,
            store.id,
          ),
        };
      }),
    );
  }

  async getStatisticDetail(startDate: Date, endDate: Date) {
    return {
      totalProducts: await this.getTotalProductOrders(startDate, endDate),
      revenues: await this.getPriceOfBills(startDate, endDate),
      expenses: await this.getPriceOfImportOrders(startDate, endDate),
      totalOrders: await this.getTotalOrders(startDate, endDate),
      topSellProducts: await this.productService.getTopSellProducts({
        startDate: startDate,
        endDate: endDate,
      }),
      stores: await this.getStatisticStore(startDate, endDate),
    };
  }
}
