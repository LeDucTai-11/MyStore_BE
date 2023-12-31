import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { CartService } from '../cart/cart.service';
import { ProductService } from '../product/product.service';
import { StoreService } from '../store/store.service';
import { CategoryService } from '../category/category.service';
import { ExportFileService } from '../export-file/export-file.service';
import { UsersService } from '../users/users.service';
import { PaymentService } from '../payment/payment.service';

@Module({
  controllers: [OrderController],
  providers: [
    OrderService,
    CartService,
    ProductService,
    StoreService,
    CategoryService,
    ExportFileService,
    UsersService,
    PaymentService
  ],
})
export class OrderModule {}
