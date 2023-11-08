import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateImportOrderDTO } from './dto/create-import-order.dto';
import { addDays } from 'date-fns';

@Injectable()
export class ImportOrderService {
  constructor(private readonly prismaService: PrismaService) {}

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

    return this.prismaService.$transaction(async (tx) => {
      const importPrices = body.importOrderDetails.map((x) => {
        const productPrice = productStores.find(
          (p) => p.id === x.productStoreId,
        ).product.price;
        return {
          ...x,
          productPrice: (productPrice / 2) * x.amount,
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
  }
}
