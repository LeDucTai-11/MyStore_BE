import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { OrderRequestService } from './order-request.service';
import { JwtAuthGuard } from 'src/core/guards/jwt/jwt.guard';
import { Request } from 'express';
import { CreateModifyOrderRequestDto } from './dto/update-order-request.dto';
import { FilterOrderRequestDto } from './dto/filter-order-request.dto';

@ApiTags('order-request')
@Controller('order-request')
@ApiBearerAuth()
export class OrderRequestController {
  constructor(private readonly orderRequestService: OrderRequestService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(@Req() req: Request,@Query() queryData: FilterOrderRequestDto) {
    return await this.orderRequestService.findAll(queryData,req);
  }

  @Post('/create-modify-request')
  @UseGuards(JwtAuthGuard)
  createModifyBookingRequest(
    @Body() createModifyBookingRequestDto: CreateModifyOrderRequestDto,
    @Req() req: any,
  ) {
    return this.orderRequestService.handleCreateModifyOrderRequest(
      createModifyBookingRequestDto,
      req,
    );
  }
}
