import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ProductService } from './product.service';
import { FilterProductDto } from './dto';

@ApiTags('product')
@Controller('product')
export class ProductController {
    constructor(private readonly productService: ProductService){}

    @Get()
    findAll(@Query() queryData: FilterProductDto) {
        return this.productService.findAll(queryData);
    }

    @Get('/:id')
    findByID(@Param('id') id: string) {
        return this.productService.findByID(id);
    }
}
