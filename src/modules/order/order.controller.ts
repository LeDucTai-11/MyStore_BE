import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { OrderService } from './order.service';
import { JwtAuthGuard } from 'src/core/guards/jwt/jwt.guard';
import { ConfirmOrderDto } from './dto/create-order.dto';
import { Request } from 'express';

@ApiTags('order')
@Controller('order')
@ApiBearerAuth()
export class OrderController {
    constructor(private readonly orderService: OrderService){}

    @Post()
    @UseGuards(JwtAuthGuard)
    createOrder(@Req() req: Request,@Body() body: ConfirmOrderDto) {
        return this.orderService.createOrder(req,body);
    }
}
