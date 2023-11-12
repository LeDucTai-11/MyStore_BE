import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
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
    @ApiQuery({
        name: 'storeId',
        required: false,
        type: String,
        example: '',
      })
    findByID(@Param('id') id: string,@Query() queryData: any) {
        return this.productService.findByID(id,queryData);
    }
}
