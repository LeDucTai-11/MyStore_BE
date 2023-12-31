import { Module } from '@nestjs/common';
import { StaffController } from './staff.controller';
import { StaffService } from './staff.service';
import { UsersService } from '../users/users.service';
import { OrderService } from '../order/order.service';
import { CartService } from '../cart/cart.service';
import { ProductService } from '../product/product.service';
import { StoreService } from '../store/store.service';
import { CategoryService } from '../category/category.service';
import { ExportFileService } from '../export-file/export-file.service';
import { BillService } from '../bill/bill.service';
import { PaymentService } from '../payment/payment.service';

@Module({
  controllers: [StaffController],
  providers: [
    StaffService,
    UsersService,
    OrderService,
    CartService,
    ProductService,
    StoreService,
    CategoryService,
    ExportFileService,
    BillService,
    PaymentService
  ],
})
export class StaffModule {}
