import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProducDTO, FilterProductDto, UpdateProductDTO } from './dto';
import { CategoryService } from '../category/category.service';
import { Pagination, forceDataToArray, getOrderBy } from 'src/core/utils';

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
      throw new BadRequestException('The name has already exist !');
    }
    return this.prismaService.product.create({
      data: {
        ...createProductDTO,
        amount: 0,
      },
      select: {
        id: true,
        name: true,
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
      },
    });
  }

  async findByName(name: string) {
    return await this.prismaService.product.findFirst({
      where: {
        name: name,
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
}
