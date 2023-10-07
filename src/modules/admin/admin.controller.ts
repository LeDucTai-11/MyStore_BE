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
import { CreateCategoryDTO, FilterCategoryDto, UpdateCategoryDTO } from '../category/dto';
import { CategoryService } from '../category/category.service';
import { FilterUserDto } from '../users/dto'; 
@ApiTags('admin')
@Controller('admin')
@ApiBearerAuth()
export class AdminController {
  constructor(
    private readonly userService: UsersService,
    private readonly categoryService: CategoryService,
  ) {}

  @Get('/users')
  // @UseGuards(RoleGuard(Role.Admin))
  findAllUsers(@Query() queryData: FilterUserDto) {
    return this.userService.findAll(queryData);
  }

  @Get('/users/:id')
  @UseGuards(RoleGuard(Role.Admin))
  findUserByID(@Param('id') id: string) {
    return this.userService.findByID(id);
  }

  @Post('/cashiers')
  @UseGuards(RoleGuard(Role.Admin))
  createCashier(@Body() body: CreateUserDTO) {
    return this.userService.createUser(body, false);
  }

  @Post('/category')
  @UseGuards(RoleGuard(Role.Admin))
  createCateogry(@Body() body: CreateCategoryDTO) {
    return this.categoryService.createCategory(body);
  }

  @Patch('/category/:id')
  @UseGuards(RoleGuard(Role.Admin))
  updateCateogry(@Param('id') id: string, @Body() body: UpdateCategoryDTO) {
    return this.categoryService.updateCategory(id, body);
  }

  @Get('/category')
  // @UseGuards(RoleGuard(Role.Admin))
  findAllCategories(@Query() queryData: FilterCategoryDto) {
    return this.categoryService.findAll(queryData);
  }
}
