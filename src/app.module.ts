import { MiddlewareConsumer, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AdminModule } from './modules/admin/admin.module';
import { AuthModule } from './modules/auth/auth.module';
import { MailModule } from './modules/mail/mail.module';
import { UsersModule } from './modules/users/users.module';
import { RedisModule } from './redis/redis.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { CategoryModule } from './modules/category/category.module';
import { ProductModule } from './modules/product/product.module';
import { HelmetMiddleware, HttpLoggerMiddleware } from './app.middleware';
import { FilesModule } from './modules/files/files.module';
import { CloudinaryModule } from './modules/cloudinary/cloudinary.module';
import { StoreModule } from './modules/store/store.module';
import { ImportOrderModule } from './modules/import-order/import-order.module';
import { CartModule } from './modules/cart/cart.module';
import { VoucherModule } from './modules/voucher/voucher.module';
import { ExportFileModule } from './modules/export-file/export-file.module';
import { OrderModule } from './modules/order/order.module';
import { OrderRequestModule } from './modules/order-request/order-request.module';
import { BillModule } from './modules/bill/bill.module';
import { StaffModule } from './modules/staff/staff.module';
import { PaymentModule } from './modules/payment/payment.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ShippingModule } from './modules/shipping/shipping.module';
import { FirebaseModule } from './firebase/firebase.module';
import { CronJobModule } from './modules/cron-job/cron-job.module';
import { ShipperModule } from './modules/shipper/shipper.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AdminModule,
    AuthModule,
    MailModule,
    UsersModule,
    RedisModule,
    PrismaModule,
    CategoryModule,
    ProductModule,
    FilesModule,
    CloudinaryModule,
    StoreModule,
    ImportOrderModule,
    CartModule,
    VoucherModule,
    ExportFileModule,
    OrderModule,
    OrderRequestModule,
    BillModule,
    StaffModule,
    PaymentModule,
    ScheduleModule.forRoot(),
    ShippingModule,
    FirebaseModule,
    CronJobModule,
    ShipperModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(HttpLoggerMiddleware).forRoutes('*');
    consumer.apply(HelmetMiddleware).forRoutes('*');
  }
}
