import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateImportOrderDTO } from './dto/create-import-order.dto';
import { addDays } from 'date-fns';

@Injectable()
export class ImportOrderService {
  constructor(private readonly prismaService: PrismaService) {}

  async createImportOrder(body: CreateImportOrderDTO) {
    const productStoreIds = body.importOrderDetails.map((x) => x.id);
    const productStores = await this.prismaService.productStore.findMany({
      where: {
        id: {
          in: productStoreIds,
        },
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
        const productPrice = productStores.find((p) => p.id === x.id).product
          .price;
        return {
          ...x,
          productPrice: productPrice / 2 * x.amount,
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
              productStoreId: ip.id,
            },
          });
          await tx.productStore.update({
            where: {
              id: ip.id,
            },
            data: {
              expirtyDate: new Date(addDays(new Date(), 60)),
              updatedAt: new Date(),
            },
          });
        }),
      );
    });
  }
}
