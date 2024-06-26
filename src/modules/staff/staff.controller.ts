import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UsersService } from '../users/users.service';
import { FilterUserDto } from '../users/dto';
import { Role } from 'src/core/enum/roles.enum';
import RoleGuard from 'src/core/guards/roles/roles.guard';
import { ConfirmOrderDto } from '../order/dto/create-order.dto';
import { OrderService } from '../order/order.service';
import { Request } from 'express';
import { FilterBillDto } from '../bill/dto/filter-bill.dto';
import { BillService } from '../bill/bill.service';

@ApiTags('staff')
@Controller('staff')
@ApiBearerAuth()
@Controller('staff')
export class StaffController {
  constructor(
    private readonly userService: UsersService,
    private readonly orderService: OrderService,
    private readonly billService: BillService,
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

  @Get('/bill')
  @UseGuards(RoleGuard(Role.Staff))
  findAllBills(@Req() req: Request, @Query() queryData: FilterBillDto) {
    queryData.createdBy = req['user'].id;
    return this.billService.findAll(queryData);
  }

  @Get('/bill/:id')
  @UseGuards(RoleGuard(Role.Staff))
  findBillID(@Param('id') id: string) {
    return this.billService.findByID(id);
  }
}
