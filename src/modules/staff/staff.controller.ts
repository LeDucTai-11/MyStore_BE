import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UsersService } from '../users/users.service';
import { FilterUserDto } from '../users/dto';
import { Role } from 'src/core/enum/roles.enum';
import RoleGuard from 'src/core/guards/roles/roles.guard';
import { ConfirmOrderDto } from '../order/dto/create-order.dto';
import { OrderService } from '../order/order.service';
import { Request } from 'express';

@ApiTags('staff')
@Controller('staff')
@ApiBearerAuth()
@Controller('staff')
export class StaffController {
  constructor(
    private readonly userService: UsersService,
    private readonly orderService: OrderService
    ) {}

  @Get('/users')
  @UseGuards(RoleGuard(Role.Staff))
  findAllUsers(@Query() queryData: FilterUserDto) {
    return this.userService.findAll(queryData);
  }

  @Post('/order')
  @UseGuards(RoleGuard(Role.Staff))
  createOrder(@Req() req: Request,@Body() body: ConfirmOrderDto) {
    return this.orderService.createOrder(req,body);
  }
}
