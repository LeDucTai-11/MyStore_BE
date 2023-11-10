import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { JwtAuthGuard } from 'src/core/guards/jwt/jwt.guard';
import { AddProductCartDTO } from './dto/add-product-cart.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CheckInOfStockStoreDto } from './dto/check-in-stock-store.dto';

@ApiTags('cart')
@Controller('cart')
@ApiBearerAuth()
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async addProduct(@Request() req: any, @Body() body: AddProductCartDTO) {
    return await this.cartService.addProduct(req, body);
  }

  @Patch()
  @UseGuards(JwtAuthGuard)
  async removeProduct(@Request() req: any, @Body() body: AddProductCartDTO) {
    return await this.cartService.removeProduct(req, body);
  }

  @Delete()
  @UseGuards(JwtAuthGuard)
  async clearCart(@Request() req: any) {
    return await this.cartService.clearCart(req);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findCart(
    @Request() req: any,
    @Query() queryData: CheckInOfStockStoreDto,
  ) {
    return await this.cartService.findByReq(req, queryData);
  }
}
