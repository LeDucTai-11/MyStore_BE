import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateStoreDTO } from './dto/create-store.dto';
import { UpdateStoreDTO } from './dto/update-store.dto';
import { isEmpty } from 'lodash';
import { FilterStoreDto } from './dto/filter-store.dto';
import { Pagination, getOrderBy } from 'src/core/utils';

@Injectable()
export class StoreService {
  constructor(private readonly prismaService: PrismaService) {}

  async createStore(body: CreateStoreDTO) {
    const foundedStore = await this.prismaService.store.findFirst({
      where: {
        address: body.address
      },
    });

    if (foundedStore) {
      throw new BadRequestException(
        'The ADDRESS of Store has already existed',
      );
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
    let newStore = null;
    await this.prismaService.$transaction(async (tx) => {
      newStore = await tx.store.create({
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
    return {
      success: true,
      message: "Transaction completed successfully.",
      newStore,
    }
  }

  async updateStore(id: string, body: UpdateStoreDTO) {
    await this.findByID(id);
    if (body.address) {
      const foundedStore = await this.findByAddress(body.address);
      if (foundedStore && foundedStore.id !== id) {
        throw new BadRequestException('The ADDRESS has already exist !');
      }
    }
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

  async findAll(queryData: FilterStoreDto) {
    const { search, take, skip, order } = queryData;
    const query: any = {
      where: {
        address: {
          contains: search ?? '',
        },
        deletedAt: null,
      },
      take,
      skip,
      orderBy: order ? getOrderBy(order) : undefined,
      select: {
        id: true,
        address: true,
        hotline: true,
        createdAt: true,
        updatedAt: true,
      },
    };
    const [total, stores] = await Promise.all([
      this.prismaService.store.count({
        where: query.where,
      }),
      this.prismaService.store.findMany(query),
    ]);
    return Pagination.of(take, skip, total, stores);
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

  async findByAddress(address: string) {
    const foundedStore = await this.prismaService.store.findFirst({
      where: {
        address,
        deletedAt: null,
      },
    });
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
