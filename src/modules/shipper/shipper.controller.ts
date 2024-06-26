import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ShipperService } from './shipper.service';

@ApiTags('shipper')
@Controller('shipper')
export class ShipperController {
  constructor(private readonly shipperService: ShipperService) {}

  @Get('/:id')
  getShipper(@Param('id') id: string) {
    return this.shipperService.findByID(id);
  }
}
