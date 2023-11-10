import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCategoryDTO, FilterCategoryDto, UpdateCategoryDTO } from './dto';
import { Pagination, getOrderBy } from 'src/core/utils';
import { GetAllCategoryOrderByEnum } from 'src/core/enum/category.enum';

@Injectable()
export class CategoryService {
  constructor(private prismaService: PrismaService) {}

  async findAll(queryData: FilterCategoryDto) {
    const {search,take,skip,order} = queryData;
    let orderBy = undefined;
    if(order) {
      if(GetAllCategoryOrderByEnum.TOTAL_PRODUCTS === order.split(':')[0]) {
        orderBy = {
          products: getOrderBy(order)
        }
      }else {
        orderBy = getOrderBy(order);
      }
    }
    const query: any = {
      where: {
        name: {
          contains: search ?? '',
        },
        deletedAt: null,
      },
      take,
      skip,
      orderBy: orderBy,
      select: {
        id: true,
        name: true,
        image: true,
        description: true,
        createdAt: true,
        _count: {
          select: {
            products: true
          }
        }
      },
    };
    const [total, categories] = await Promise.all([
      this.prismaService.category.count({
        where: query.where,
      }),
      this.prismaService.category.findMany(query),
    ]);
    return Pagination.of(take, skip, total, categories);
  }

  async findByID(id: string) {
    const category = await this.prismaService.category.findFirst({
      where: {
        id: id,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        image: true,
        description: true,
        products: {
          select: {
            id: true,
            name: true,
            image: true,
            description: true,
            amount: true,
            price: true,
            createdAt: true,
          },
        },
        createdAt: true,
      },
    });
    if (!category) {
      throw new NotFoundException(`Category not found with ID : ${id}`);
    }
    return category;
  }

  async findByName(name: string) {
    const category = await this.prismaService.category.findFirst({
      where: {
        name: name,
        deletedAt: null,
      }
    });
    return category;
  }

  async createCategory(createCategoryDTO: CreateCategoryDTO) {
    const category = await this.findByName(createCategoryDTO.name);
    if (category) {
      throw new BadRequestException('The name Category has already exist !');
    }
    return await this.prismaService.category.create({
      data: {
        ...createCategoryDTO,
      },
      select: {
        id: true,
        name: true,
        image: true,
        description: true,
        products: {
          select: {
            id: true,
            name: true,
            description: true,
            amount: true,
            price: true,
            createdAt: true,
          },
        },
        createdAt: true,
      },
    });
  }

  async updateCategory(id: string, updateCategoryDTO: UpdateCategoryDTO) {
    const foundCategory = await this.findByID(id);
    if (updateCategoryDTO.name) {
      const category = await this.findByName(updateCategoryDTO.name);
      if (category && category.id !== foundCategory.id) {
        throw new BadRequestException('The name Category has already exist !');
      }
    }
    return await this.prismaService.category.update({
      where: {
        id: foundCategory.id,
      },
      data: {
        ...updateCategoryDTO,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        image: true,
        description: true,
        products: {
          select: {
            id: true,
            name: true,
            description: true,
            amount: true,
            price: true,
            createdAt: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });
  }
}
