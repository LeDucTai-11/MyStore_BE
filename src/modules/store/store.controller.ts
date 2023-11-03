import { Controller, Get } from '@nestjs/common';
import { StoreService } from './store.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('store')
@Controller('store')
export class StoreController {
    constructor(private readonly storeService: StoreService){}

    @Get()
    async findAll() {
        return this.storeService.findAll();
    }
}
