import { Module } from '@nestjs/common';
import { ShippingService } from './shipping.service';
import { ShippingController } from './shipping.controller';
import { FirebaseService } from 'src/firebase/firebase.service';

@Module({
  providers: [ShippingService, FirebaseService],
  controllers: [ShippingController],
})
export class ShippingModule {}
