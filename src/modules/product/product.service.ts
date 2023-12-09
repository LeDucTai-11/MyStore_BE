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
import { StoreService } from '../store/store.service';
import { ExportProductStoreDTO } from './dto/export-product-store.dto';
import { ExportFileService } from '../export-file/export-file.service';
import { ResponseProductStoreDTO } from './dto/response-product-store.dto';
import { Prisma } from '@prisma/client';
import { FilterTopSellProductDto } from './dto/filter-top-sell-product.dto';

@Injectable()
export class ProductService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly categoryService: CategoryService,
    private readonly storeService: StoreService,
    private readonly exportFileService: ExportFileService,
  ) {}

  async createProduct(createProductDTO: CreateProducDTO) {
    const foundCategory = await this.categoryService.findByID(
      createProductDTO.categoryId,
    );
    if (!foundCategory || (await this.findByName(createProductDTO.name))) {
      throw new BadRequestException('The ProductName has already exist !');
    }
    const listStores: any[] = await this.prismaService.store.findMany({
      where: {
        deletedAt: null,
      },
    });

    if (isEmpty(listStores)) {
      throw new BadRequestException('Please create a new Store !');
    }
    let newProduct = null;
    await this.prismaService.$transaction(async (tx) => {
      newProduct = await tx.product.create({
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
    return {
      success: true,
      message: 'Transaction completed successfully.',
      newProduct,
    };
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
    const { search, take, skip, order, categories, storeId } = queryData;

    if (storeId) {
      await this.storeService.findByID(storeId);
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
        productStores: true,
        createdAt: true,
        updatedAt: true,
      },
    };
    if (categories) {
      query.where.categoryId = {
        in: forceDataToArray(categories),
      };
    }
    let [total, products] = await Promise.all([
      this.prismaService.product.count({
        where: query.where,
      }),
      this.prismaService.product.findMany(query),
    ]);
    products = products.map((p) => {
      let productStore = null;
      if (storeId) {
        productStore = p['productStores']?.find(
          (x) => x.storeId === storeId && x.deletedAt === null,
        );
      }
      return {
        ...p,
        productStores: undefined,
        productStore: productStore ?? undefined,
        amount: productStore ? productStore.amount : p.amount,
      };
    });
    return Pagination.of(take, skip, total, products);
  }

  async findByID(id: string, queryData = undefined) {
    if (queryData && queryData.storeId) {
      await this.storeService.findByID(queryData.storeId);
    }

    let product = await this.prismaService.product.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        image: true,
        description: true,
        productStores: true,
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
    let foundProductStore = null;
    if (queryData && queryData.storeId) {
      foundProductStore = product.productStores.find(
        (x) => x.storeId === queryData.storeId && x.deletedAt === null,
      );
    }
    return {
      ...product,
      productStores: undefined,
      amount: foundProductStore ? foundProductStore.amount : product.amount,
      productStore: foundProductStore ?? undefined,
    };
  }

  async updateProduct(id: string, updateProductDTO: UpdateProductDTO) {
    await this.findByID(id);
    if (updateProductDTO.name) {
      const foundProduct = await this.findByName(updateProductDTO.name);
      if (foundProduct && foundProduct.id !== id) {
        throw new BadRequestException('The name of Product has already exist');
      }
    }
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

  async findByStoreID(storeID: string) {
    await this.storeService.findByID(storeID);
    const productStores = await this.prismaService.productStore.findMany({
      where: {
        storeId: storeID,
        deletedAt: null,
      },
      select: {
        id: true,
        product: {
          select: {
            name: true,
          },
        },
      },
    });
    const datas: ResponseProductStoreDTO[] = productStores.map((p) => {
      const res: ResponseProductStoreDTO = {
        id: p.id,
        productName: p.product.name,
      };
      return res;
    });
    return datas;
  }

  async exportProductStoresToCSV(data: ResponseProductStoreDTO[]) {
    const fields = [
      {
        label: 'ProductStoreID',
        value: 'id',
      },
      {
        label: 'ProductName',
        value: 'productName',
      },
      {
        label: 'QuantityImport',
        value: '',
      },
      {
        label: 'PricePerProduct',
        value: '',
      },
    ];
    return this.exportFileService.exportToCSV(data, fields);
  }

  async exportProductStoresToExcel(data: ResponseProductStoreDTO[]) {
    const fields = [
      {
        header: 'ProductStoreID',
        key: 'id',
        width: 30,
      },
      {
        header: 'ProductName',
        key: 'productName',
        width: 30,
      },
      {
        header: 'QuantityImport',
        key: '',
        width: 30,
      },
      {
        header: 'PricePerProduct',
        key: '',
        width: 30,
      },
    ];
    return await this.exportFileService.exportToExcel(
      data,
      fields,
      'ProductStores',
    );
  }

  async exportProductStoresToPDF(data: ResponseProductStoreDTO[]) {
    const fields = ['ProductStoreID', 'ProductName', 'QuantityImport'];
    const dataExport = data.map((row) => [row.id, row.productName, '']);
    return await this.exportFileService.exportToPDF(
      dataExport,
      fields,
      'ProductStores',
    );
  }

  async getTopSellProducts(queryData: FilterTopSellProductDto) {
    const { storeId } = queryData;
    await this.storeService.findByID(storeId);
    const storeQuery = storeId
      ? Prisma.sql`and ps.storeId = ${storeId}`
      : Prisma.sql``;
    const sql = Prisma.sql`
    SELECT od.product_store_id as productStoreId,p.id as productId,SUM(od.quantity) AS totalQuantitySold
      FROM order_detail od
      JOIN product_store ps ON od.product_store_id = ps.id
      JOIN product as p ON p.id = ps.productId
      WHERE ps.deleted_at is null ${storeQuery}
      GROUP BY od.product_store_id
      ORDER BY totalQuantitySold DESC;
  `;

    let result: any[] = await this.prismaService.$queryRaw(sql);
    const listProducts = [];
    result.forEach((x) => {
      const existingProduct = listProducts.find(
        (item) => item.productId === x.productId,
      );
      if (existingProduct) {
        existingProduct.totalQuantitySold += Number(x.totalQuantitySold);
      } else {
        listProducts.push({
          ...x,
          totalQuantitySold: Number(x.totalQuantitySold),
        });
      }
    });

    result = await Promise.all(
      listProducts.map(async (x) => {
        if (storeId) {
          const foundProductStore =
            await this.prismaService.productStore.findFirst({
              where: {
                id: x.productStoreId,
              },
              select: {
                amount: true,
                product: true,
              },
            });
          return {
            totalQuantitySold: x.totalQuantitySold,
            product: {
              ...foundProductStore.product,
              amountOfProductStore: foundProductStore.amount,
            },
          };
        } else {
          const foundProduct = await this.prismaService.product.findFirst({
            where: {
              id: x.productId,
            },
          });
          return {
            totalQuantitySold: x.totalQuantitySold,
            product: foundProduct,
          };
        }
      }),
    );
    return result.sort((a, b) => b.totalQuantitySold - a.totalQuantitySold);
  }
}
