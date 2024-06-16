import { Module } from '@nestjs/common';
import { ShippingService } from './shipping.service';
import { ShippingController } from './shipping.controller';
import { FirebaseService } from 'src/firebase/firebase.service';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';

@Module({
  providers: [ShippingService, FirebaseService, UsersService, MailService],
  controllers: [ShippingController],
})
export class ShippingModule {}
