import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateImportOrderDTO } from './dto/create-import-order.dto';
import { addDays } from 'date-fns';
import { FilterImportOderDto } from './dto/filter-import-order.dto';
import { Pagination, getOrderBy } from 'src/core/utils';
import { StoreService } from '../store/store.service';

@Injectable()
export class ImportOrderService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly storeService: StoreService,
  ) {}

  async createImportOrder(body: CreateImportOrderDTO) {
    const productStoreIds = body.importOrderDetails.map(
      (x) => x.productStoreId,
    );
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
      },
    });
    if (productStores.length !== productStoreIds.length) {
      throw new NotFoundException('One or more productStores not found');
    }
    
    await this.prismaService.$transaction(async (tx) => {
      const importPrices = body.importOrderDetails.map((x) => {
        return {
          ...x,
          productPrice: x.pricePerProduct * x.amount,
        };
      });
      const totalImportPrices = importPrices.reduce((acc, x) => {
        return acc + x.productPrice;
      }, 0);

      const importOrder = await tx.importOrder.create({
        data: {
          total: totalImportPrices,
        },
      });
      await Promise.all(
        importPrices.map(async (ip) => {
          await tx.importOrderDetail.create({
            data: {
              amount: ip.amount,
              importPrice: ip.productPrice,
              importOrderId: importOrder.id,
              productStoreId: ip.productStoreId,
            },
          });
          const productStore = await tx.productStore.findFirst({
            where: {
              id: ip.productStoreId,
            },
            select: {
              id: true,
              productId: true,
              product: true,
              amount: true,
            },
          });
          await tx.productStore.update({
            where: {
              id: ip.productStoreId,
            },
            data: {
              amount: ip.amount + productStore.amount,
              expirtyDate: new Date(addDays(new Date(), 60)),
              updatedAt: new Date(),
            },
          });
          await tx.product.update({
            where: {
              id: productStore.productId,
            },
            data: {
              amount: productStore.product.amount + ip.amount,
              updatedAt: new Date(),
            },
          });
        }),
      );
    });
    return {
      success: true,
      message: 'Transaction completed successfully.',
    };
  }

  async findAll(queryData: FilterImportOderDto) {
    const { take, skip, order, storeId } = queryData;
    if (storeId) {
      await this.storeService.findByID(storeId);
    }
    const query: any = {
      where: {
        deletedAt: null,
      },
      orderBy: getOrderBy(order),
      select: {
        id: true,
        total: true,
        importOderDetails: {
          select: {
            id: true,
            productStore: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    };
    let [importOrders] = await Promise.all([
      this.prismaService.importOrder.findMany(query),
    ]);
    const promisesImportOrders = importOrders.map(async (ip) => {
      const storeID = ip["importOderDetails"][0].productStore.storeId;
      if(storeId && storeId !== storeID) return null;
      const foundStore = await this.storeService.findByID(storeID); 
      return {
        ...ip,
        importOderDetails: undefined,
        storeName: foundStore.address
      };
    });
    importOrders = (await Promise.all(promisesImportOrders)).filter((x) => x !== null);
    return Pagination.of(take, skip, importOrders.length, importOrders.splice(skip, skip + take));
  }

  async findByID(importOrderID: string) {
    const foundImportOrder = await this.prismaService.importOrder.findFirst({
      where: {
        id: importOrderID,
        deletedAt: null,
      },
      select: {
        id: true,
        total: true,
        importOderDetails: {
          select: {
            id: true,
            productStoreId: true,
            amount: true,
            importPrice: true,
            createdAt: true,
          }
        },
        createdAt: true
      }
    });
    if(!foundImportOrder) {
      throw new NotFoundException('The Import Order not found');
    }

    const importOderDetails = foundImportOrder.importOderDetails.map(async (x) => {
      const productStore = await this.prismaService.productStore.findFirst({
        where: {
          id: x.productStoreId,
        },
        select: {
          product: true,
        }
      })
      return {
        ...x,
        productName: productStore.product.name,
      }
    });
    foundImportOrder.importOderDetails = await Promise.all(importOderDetails);
    return foundImportOrder;
  }
}
