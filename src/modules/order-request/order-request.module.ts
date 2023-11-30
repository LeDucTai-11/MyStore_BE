import { Module } from '@nestjs/common';
import { OrderRequestController } from './order-request.controller';
import { OrderRequestService } from './order-request.service';
import { MailService } from '../mail/mail.service';
import { UsersService } from '../users/users.service';

@Module({
  controllers: [OrderRequestController],
  providers: [OrderRequestService, MailService, UsersService],
})
export class OrderRequestModule {}
