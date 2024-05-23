import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ShippingService } from './shipping.service';
import RoleGuard from 'src/core/guards/roles/roles.guard';
import { Role } from 'src/core/enum/roles.enum';
import { UpdateShippingrRequestStatusDto } from './dto/update-shipping-request.dto';

@ApiTags('shipping')
@Controller('shipping')
@ApiBearerAuth()
@Controller('shipping')
export class ShippingController {
  constructor(private shippingService: ShippingService) {}

  @Get()
  @UseGuards(RoleGuard(Role.Shipper))
  getListRequest(@Request() req: any) {
    return this.shippingService.getListShippingRequest(req);
  }

  @Patch('/modify-request-status/:id')
  @UseGuards(RoleGuard(Role.Shipper))
  updateBookingModifyRequestStatus(
    @Param('id') id: string,
    @Body() updateShippingrRequestStatusDto: UpdateShippingrRequestStatusDto,
    @Request() req: any,
  ) {
    return this.shippingService.updateModifyShippingRequestStatus(
      updateShippingrRequestStatusDto,
      req,
      id,
    );
  }

  @Patch('/completed/:id')
  @UseGuards(RoleGuard(Role.Shipper))
  completedShipping(@Param('id') id: string, @Request() req: any) {
    return this.shippingService.modifyStatusCompleted(id, req);
  }
}
