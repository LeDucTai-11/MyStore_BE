import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { UsersService } from '../users/users.service';
import { CategoryService } from '../category/category.service';
import { ProductService } from '../product/product.service';
import { FilesService } from '../files/files.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { StoreService } from '../store/store.service';
import { ImportOrderService } from '../import-order/import-order.service';
import { VoucherService } from '../voucher/voucher.service';
import { ExportFileService } from '../export-file/export-file.service';
import { OrderRequestService } from '../order-request/order-request.service';
import { MailService } from '../mail/mail.service';
import { OrderService } from '../order/order.service';
import { CartService } from '../cart/cart.service';
import { BillService } from '../bill/bill.service';
import { PaymentService } from '../payment/payment.service';

@Module({
  controllers: [AdminController],
  providers: [
    AdminService,
    UsersService,
    CategoryService,
    ProductService,
    FilesService,
    CloudinaryService,
    StoreService,
    ImportOrderService,
    VoucherService,
    ExportFileService,
    OrderRequestService,
    MailService,
    OrderService,
    CartService,
    BillService,
    PaymentService
  ],
})
export class AdminModule {}
