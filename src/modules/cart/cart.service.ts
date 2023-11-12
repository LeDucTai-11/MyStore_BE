import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
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

    const foundCart = await this.findCart(req);
    const foundCartProduct = foundCart.cartProducts.find(
      (cp) => cp.productId === productId && cp.deletedAt === null,
    );
    if (foundCartProduct) {
      return this.prismaService.cartProduct.update({
        where: {
          id: foundCartProduct.id,
        },
        data: {
          quantity: foundCartProduct.quantity + quantity,
          price: foundCartProduct.price + product.price * quantity,
          updatedAt: new Date(),
        },
      });
    } else {
      return this.prismaService.cartProduct.create({
        data: {
          cartId: foundCart.id,
          productId: productId,
          quantity,
          price: product.price * quantity,
        },
      });
    }
  }

  async decreaseProduct(req: any, body: AddProductCartDTO) {
    const { productId, quantity } = body;
    const product = await this.productService.findByID(productId);

    const foundCart = await this.findCart(req);
    const foundCartProduct = foundCart.cartProducts.find(
      (cp) => cp.productId === productId && cp.deletedAt === null,
    );
    if(!foundCartProduct) {
      throw new NotFoundException(`Product not found in Cart`);
    }else {
      if(quantity > foundCartProduct.quantity) {
        throw new BadRequestException(`The number of products to be deleted is greater than in the shopping cart`);
      }
      return this.prismaService.cartProduct.update({
        where: {
          id: foundCartProduct.id,
        },
        data: {
          quantity: foundCartProduct.quantity - quantity,
          price: foundCartProduct.price - product.price * quantity,
          updatedAt: new Date(),
        },
      });
    }
  }

  async removeProduct(req: any,productId: string) {
    const foundCart = await this.findCart(req);
    const foundCartProduct = foundCart.cartProducts.find(
      (cp) => cp.productId === productId && cp.deletedAt === null,
    );
    if(!foundCartProduct) {
      throw new NotFoundException(`Product not found in Cart`);
    } 
    return this.prismaService.cartProduct.delete({
      where: {
        id: foundCartProduct.id,
      }
    })
  }

  async clearCart(req: any) {
    const foundCart = await this.findCart(req);
    return this.prismaService.cartProduct.deleteMany({
      where: {
        cartId: foundCart.id
      }
    })
  }

  async findByReq(req: any, queryData: CheckInOfStockStoreDto) {
    const { storeId } = queryData;
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
            product: true,
            productId: true,
            quantity: true,
            price: true,
          },
        },
        createdAt: true,
      },
    });
    if (!foundCart) {
      throw new NotFoundException(`Cart not found`);
    }
    const result = foundCart.cartProducts.map(async (x) => {
      const productStore = await this.prismaService.productStore.findFirst({
        where: {
          productId: x.productId,
          storeId: storeId,
        },
      });
      return {
        ...x,
        image: x.product.image,
        inOfStock: productStore.amount >= x.quantity,
        productStore: productStore,
      };
    });
    return Promise.all(result);
  }

  async findCart(req: any) {
    const foundCart = await this.prismaService.cart.findFirst({
      where: {
        createdBy: req.user.id,
        deletedAt: null,
      },
      select: {
        id: true,
        cartProducts: true,
      },
    });
    if (!foundCart) {
      throw new NotFoundException(`Cart not found`);
    }
    return foundCart;
  }
}
