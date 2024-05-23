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
import { OrderRequestService } from '../order-request/order-request.service';
import { MailService } from '../mail/mail.service';
import { ShippingService } from '../shipping/shipping.service';

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
    PaymentService,
    OrderRequestService,
    MailService,
    ShippingService
  ],
})
export class StaffModule {}
