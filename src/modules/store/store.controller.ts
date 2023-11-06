import { Controller, Get, Query } from '@nestjs/common';
import { StoreService } from './store.service';
import { ApiTags } from '@nestjs/swagger';
import { FilterStoreDto } from './dto/filter-store.dto';

@ApiTags('store')
@Controller('store')
export class StoreController {
    constructor(private readonly storeService: StoreService){}

    @Get()
    async findAll(@Query() queryData: FilterStoreDto) {
        return this.storeService.findAll(queryData);
    }
}
