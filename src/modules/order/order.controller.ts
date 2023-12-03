import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { OrderService } from './order.service';
import { JwtAuthGuard } from 'src/core/guards/jwt/jwt.guard';
import { ConfirmOrderDto } from './dto/create-order.dto';
import { Request } from 'express';
import { FilterOrderDto } from './dto/filter-order.dto';

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

    @Get()
    @UseGuards(JwtAuthGuard)
    findAll(@Req() req: Request,@Query() queryData: FilterOrderDto) {
        return this.orderService.findAll(queryData, req);
    }

    @Get('/:id')
    @UseGuards(JwtAuthGuard)
    findByID(@Param('id') id: string) {
        return this.orderService.findById(id);
    }
}
