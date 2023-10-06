import { Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { query } from 'express';
import { CategoryService } from './category.service';

@ApiTags('category')
@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  @ApiQuery({
    name: 'name',
    required: false,
    type: String,
    example: 'a',
  })
  findByName(@Query() queryData: any) {
    return this.categoryService.findAll(queryData.name);
  }

  @Get('/:id')
  findByID(@Param('id') id: string) {
    return this.categoryService.findByID(id);
  }
}
