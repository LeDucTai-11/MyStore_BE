import { Injectable, NotFoundException } from '@nestjs/common';
import { AddProductCartDTO } from './dto/add-product-cart.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { th } from 'date-fns/locale';
import { ProductService } from '../product/product.service';
import { CheckInOfStockStoreDto } from './dto/check-in-stock-store.dto';
import { StoreService } from '../store/store.service';

@Injectable()
export class CartService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly productService: ProductService,
    private readonly storeService: StoreService,
  ) {}

  async addProduct(req: any, body: AddProductCartDTO) {
    const { productId, quantity } = body;
    const product = await this.productService.findByID(productId);

    const foundCart = await this.prismaService.cart.findFirst({
      where: {
        createdBy: req.user.id,
        deletedAt: null,
      },
    });
    if (!foundCart) {
      throw new NotFoundException(`Cart not found`);
    }
    return this.prismaService.cartProduct.create({
      data: {
        cartId: foundCart.id,
        productId: productId,
        quantity,
        price: product.price * quantity,
      },
    });
  }

  async findByReq(req: any, queryData: CheckInOfStockStoreDto) {
    const {storeId} = queryData;
    await this.storeService.findByID(storeId);
    const foundCart = await this.prismaService.cart.findFirst({
      where: {
        createdBy: req.user.id,
        deletedAt: null,
      },
      select: {
        id: true,
        cartProducts: {
          select: {
            id: true,
            productId: true,
            quantity: true,
            price: true,
          },
        },
        createdAt: true,
      },
    });
    const result = foundCart.cartProducts.map(async (x) => {
      const productStore = await this.prismaService.productStore.findFirst({
        where: {
          productId: x.productId,
          storeId: storeId,
        },
      });
      return {
        ...x,
        inOfStock: productStore.amount >= x.quantity,
        productStore: productStore,
      };
    });
    return Promise.all(result);
  }
}
