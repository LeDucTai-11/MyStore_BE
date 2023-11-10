import { Module } from '@nestjs/common';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { CategoryService } from '../category/category.service';
import { StoreService } from '../store/store.service';
import { ExportFileService } from '../export-file/export-file.service';

@Module({
  controllers: [ProductController],
  providers: [ProductService, CategoryService, StoreService, ExportFileService],
})
export class ProductModule {}
