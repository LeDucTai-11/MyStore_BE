import { Module } from '@nestjs/common';
import { ImportOrderService } from './import-order.service';

@Module({
  providers: [ImportOrderService]
})
export class ImportOrderModule {}
