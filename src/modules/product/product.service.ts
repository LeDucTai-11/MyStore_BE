import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProducDTO, FilterProductDto, UpdateProductDTO } from './dto';
import { CategoryService } from '../category/category.service';
import { Pagination, forceDataToArray, getOrderBy } from 'src/core/utils';
import { isEmpty } from 'lodash';

@Injectable()
export class ProductService {
  constructor(
    private prismaService: PrismaService,
    private categoryService: CategoryService,
  ) {}

  async createProduct(createProductDTO: CreateProducDTO) {
    const foundCategory = await this.categoryService.findByID(
      createProductDTO.categoryId,
    );
    if (!foundCategory || (await this.findByName(createProductDTO.name))) {
      throw new BadRequestException('The ProductName has already exist !');
    }
    const listStores:any[] = await this.prismaService.store.findMany({
      where: {
        deletedAt: null,
      },
    });

    if(isEmpty(listStores)) {
      throw new BadRequestException('Please create a new Store !');
    }
    return this.prismaService.$transaction(async (tx) => {
      const newProduct = await tx.product.create({
        data: {
          ...createProductDTO,
          amount: 0,
        },
      });
      await Promise.all(
        listStores.map(async (store) => {
          await tx.productStore.create({
            data: {
              productId: newProduct.id,
              storeId: store.id,
            },
          });
        }),
      );
    });
  }

  async findByName(name: string) {
    return await this.prismaService.product.findFirst({
      where: {
        name: name,
        deletedAt: null,
      },
    });
  }

  async findAll(queryData: FilterProductDto) {
    const { search, take, skip, order, categories } = queryData;
    const query: any = {
      where: {
        name: {
          contains: search ?? '',
        },
        deletedAt: null,
      },
      take,
      skip,
      orderBy: order ? getOrderBy(order) : undefined,
      select: {
        id: true,
        name: true,
        image: true,
        description: true,
        amount: true,
        price: true,
        category: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    };
    if (categories) {
      query.where.categoryId = {
        in: forceDataToArray(categories),
      };
    }
    const [total, products] = await Promise.all([
      this.prismaService.product.count({
        where: query.where,
      }),
      this.prismaService.product.findMany(query),
    ]);
    return Pagination.of(take, skip, total, products);
  }

  async findByID(id: string) {
    const product = await this.prismaService.product.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        image: true,
        description: true,
        amount: true,
        price: true,
        category: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!product) {
      throw new NotFoundException(`Product not found with ID : ${id}`);
    }
    return product;
  }

  async updateProduct(id: string, updateProductDTO: UpdateProductDTO) {
    const foundProduct = await this.findByID(id);
    if (foundProduct) {
      return await this.prismaService.product.update({
        where: {
          id,
        },
        data: {
          ...updateProductDTO,
          updatedAt: new Date(),
        },
        select: {
          id: true,
          name: true,
          image: true,
          description: true,
          amount: true,
          price: true,
          category: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
          createdAt: true,
          updatedAt: true,
        },
      });
    }
  }

  async deleteProduct(id: string) {
    if (await this.findByID(id)) {
      return await this.prismaService.$transaction(async (tx) => {
        await tx.product.update({
          where: {
            id: id,
          },
          data: {
            deletedAt: new Date(),
          },
        });
        await tx.productStore.updateMany({
          where: {
            productId: id,
          },
          data: {
            deletedAt: new Date(),
          },
        });
      });
    }
  }
}
