import { Module } from '@nestjs/common';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { ProductService } from '../product/product.service';
import { CategoryService } from '../category/category.service';
import { StoreService } from '../store/store.service';
import { ExportFileService } from '../export-file/export-file.service';

@Module({
  controllers: [CartController],
  providers: [CartService, ProductService, CategoryService, StoreService, ExportFileService],
})
export class CartModule {}
