import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateStoreDTO } from './dto/create-store.dto';
import { UpdateStoreDTO } from './dto/update-store.dto';
import { isEmpty } from 'lodash';

@Injectable()
export class StoreService {
  constructor(private readonly prismaService: PrismaService) {}

  async createStore(body: CreateStoreDTO) {
    const foundedStore = await this.prismaService.store.findFirst({
      where: {
        address: body.address,
      },
    });
    console.log(foundedStore);

    if (foundedStore) {
      throw new BadRequestException('The name of Store has already existed');
    }
    const listProducts = await this.prismaService.product.findMany({
      where: {
        deletedAt: null,
      },
    });
    if (isEmpty(listProducts))
      return await this.prismaService.store.create({
        data: body,
      });
    return this.prismaService.$transaction(async (tx) => {
      const newStore = await tx.store.create({
        data: body,
      });
      await Promise.all(
        listProducts.map(async (product) => {
          await tx.productStore.create({
            data: {
              productId: product.id,
              storeId: newStore.id,
            },
          });
        }),
      );
    });
  }

  async updateStore(id: string, body: UpdateStoreDTO) {
    if (await this.findByID(id)) {
      return await this.prismaService.store.update({
        where: {
          id,
          deletedAt: null,
        },
        data: {
          ...body,
          updatedAt: new Date(),
        },
      });
    }
  }

  async findAll() {
    return await this.prismaService.store.findMany({
      where: {
        deletedAt: null,
      },
    });
  }

  async findByID(id: string) {
    const foundedStore = await this.prismaService.store.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });
    if (!foundedStore) {
      throw new NotFoundException(`Store with ID: ${id} not found`);
    }
    return foundedStore;
  }

  async deleteStore(id: string) {
    if (await this.findByID(id)) {
      return await this.prismaService.$transaction(async (tx) => {
        await tx.store.update({
          where: {
            id: id,
          },
          data: {
            deletedAt: new Date(),
          },
        });
        await tx.productStore.updateMany({
          where: {
            storeId: id,
          },
          data: {
            deletedAt: new Date(),
          },
        });
      });
    }
  }
}
