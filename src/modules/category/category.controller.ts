import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CategoryService } from './category.service';
import { FilterCategoryDto } from './dto';

@ApiTags('category')
@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  findByName(@Query() queryData: FilterCategoryDto) {
    return this.categoryService.findAll(queryData);
  }

  @Get('/:id')
  findByID(@Param('id') id: string) {
    return this.categoryService.findByID(id);
  }
}
