import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { OrderService } from './order.service';
import { JwtAuthGuard } from 'src/core/guards/jwt/jwt.guard';
import { ConfirmOrderDto } from './dto/create-order.dto';
import { Request } from 'express';
import { FilterOrderDto } from './dto/filter-order.dto';
import { PaymentConfirmDto } from '../payment/dto/payment-confirm.dto';
import { PaymentService } from '../payment/payment.service';

@ApiTags('order')
@Controller('order')
@ApiBearerAuth()
export class OrderController {
  constructor(
    private readonly orderService: OrderService,
    private readonly paymentService: PaymentService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  createOrder(@Req() req: Request, @Body() body: ConfirmOrderDto) {
    return this.orderService.createOrder(req, body);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@Req() req: Request, @Query() queryData: FilterOrderDto) {
    return this.orderService.findAll(queryData, req);
  }

  @Post('/:id/payment-confirm')
  @UseGuards(JwtAuthGuard)
  confirmPayment(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: PaymentConfirmDto,
  ) {
    return this.orderService.paymentConfirm(req, id, body);
  }

  @Get('/:id')
  @UseGuards(JwtAuthGuard)
  findByID(@Param('id') id: string) {
    return this.orderService.findById(id);
  }
}
