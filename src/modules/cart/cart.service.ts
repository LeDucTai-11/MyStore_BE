import { Injectable, NotFoundException } from '@nestjs/common';
import { AddProductCartDTO } from './dto/add-product-cart.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { th } from 'date-fns/locale';

@Injectable()
export class CartService {
  constructor(private readonly prismaService: PrismaService) {}

  async addProduct(req: any, body: AddProductCartDTO) {
    const { productId, storeId, quantity } = body;
    const productStore = await this.prismaService.productStore.findFirst({
      where: {
        productId,
        storeId,
        deletedAt: null,
      },
      select: {
        id: true,
        productId: true,
        product: true,
      },
    });
    const foundCart = await this.prismaService.cart.findFirst({
      where: {
        createdBy: req.user.id,
        deletedAt: null,
      },
    });
    if (!productStore || !foundCart) {
      throw new NotFoundException(`ProductStore or Cart not found`);
    }
    return this.prismaService.cartProduct.create({
      data: {
        cartId: foundCart.id,
        productStoreId: productStore.id,
        quantity,
        price: productStore.product.price * quantity,
      },
    });
  }

  async findByReq(req: any) {
    return this.prismaService.cart.findFirst({
      where: {
        createdBy: req.user.id,
        deletedAt: null,
      },
      select: {
        id: true,
        cartProducts: {
          select: {
            id: true,
            productStoreId: true,
            price: true,
          },
        },
        createdAt: true,
      },
    });
  }
}
