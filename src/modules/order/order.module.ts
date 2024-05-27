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
import { OrderRequestService } from '../order-request/order-request.service';
import { MailService } from '../mail/mail.service';
import { ShippingService } from '../shipping/shipping.service';
import { FirebaseService } from 'src/firebase/firebase.service';

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
    PaymentService,
    OrderRequestService,
    MailService,
    ShippingService,
    FirebaseService
  ],
})
export class OrderModule {}
