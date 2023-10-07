import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { UsersService } from '../users/users.service';
import { CategoryService } from '../category/category.service';
import { ProductService } from '../product/product.service';

@Module({
  controllers: [AdminController],
  providers: [AdminService, UsersService, CategoryService, ProductService],
})
export class AdminModule {}
