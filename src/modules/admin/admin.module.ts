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
    ImportOrderService
  ],
})
export class AdminModule {}
