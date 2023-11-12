import { Module } from '@nestjs/common';
import { ImportOrderService } from './import-order.service';
import { StoreService } from '../store/store.service';

@Module({
  providers: [ImportOrderService, StoreService],
})
export class ImportOrderModule {}
