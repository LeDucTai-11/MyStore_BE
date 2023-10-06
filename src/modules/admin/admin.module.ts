import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { UsersService } from '../users/users.service';
import { CategoryService } from '../category/category.service';

@Module({
  controllers: [AdminController],
  providers: [AdminService,UsersService,CategoryService]
})
export class AdminModule {}
