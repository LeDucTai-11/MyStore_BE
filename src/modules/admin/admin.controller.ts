import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import RoleGuard from 'src/core/guards/roles/roles.guard';
import { Role } from 'src/core/enum/roles.enum';
import { CreateUserDTO } from '../users/dto';

@ApiTags('admin')
@Controller('admin')
@ApiBearerAuth()
export class AdminController {
  constructor(private userService: UsersService) {}

  @Get('/users')
  @UseGuards(RoleGuard(Role.Admin))
  @ApiQuery({
    name: 'roles',
    required: false,
    type: [Number],
    example: [1,2],
  })
  @ApiQuery({
    name: 'key',
    required: false,
    type: String,
    example: 'David',
  })
  @ApiQuery({
    name: 'active',
    required: false,
    type: Boolean,
    example: true,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 10,
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    example: 0,
  })
  findAll(@Query() queryData: any) {
    return this.userService.findAll(queryData);
  }

  @Get('/users/:id')
  @UseGuards(RoleGuard(Role.Admin))
  findByID(@Param('id') id: string) {
    return this.userService.findByID(id);
  }

  @Post('/cashiers')
  @UseGuards(RoleGuard(Role.Admin))
  createCashier(@Body() body: CreateUserDTO) {
    return this.userService.createUser(body,false);
  }
}
