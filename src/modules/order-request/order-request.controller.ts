import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { OrderRequestService } from './order-request.service';
import { JwtAuthGuard } from 'src/core/guards/jwt/jwt.guard';
import { Request } from 'express';
import { CreateModifyOrderRequestDto } from './dto/update-order-request.dto';

@ApiTags('order-request')
@Controller('order-request')
@ApiBearerAuth()
export class OrderRequestController {
  constructor(private readonly orderRequestService: OrderRequestService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(@Req() req: Request) {
    return await this.orderRequestService.findAllByReq(req);
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
