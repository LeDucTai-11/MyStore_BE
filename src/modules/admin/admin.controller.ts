import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { ApiBearerAuth, ApiConsumes, ApiQuery, ApiTags } from '@nestjs/swagger';
import RoleGuard from 'src/core/guards/roles/roles.guard';
import { Role } from 'src/core/enum/roles.enum';
import { CreateUserDTO } from '../users/dto';
import { CreateCategoryDTO, FilterCategoryDto, UpdateCategoryDTO } from '../category/dto';
import { CategoryService } from '../category/category.service';
import { FilterUserDto } from '../users/dto'; 
import { CreateProducDTO, FilterProductDto, UpdateProductDTO } from '../product/dto';
import { ProductService } from '../product/product.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadFileDto } from '../files/dto/upload-file.dto';
import { FilesService } from '../files/files.service';
import { CreateStoreDTO } from '../store/dto/create-store.dto';
import { StoreService } from '../store/store.service';
import { UpdateStoreDTO } from '../store/dto/update-store.dto';
@ApiTags('admin')
@Controller('admin')
@ApiBearerAuth()
export class AdminController {
  constructor(
    private readonly userService: UsersService,
    private readonly categoryService: CategoryService,
    private readonly productService: ProductService,
    private readonly filesService: FilesService,
    private readonly storeService: StoreService,
  ) {}

  @Get('/users')
  @UseGuards(RoleGuard(Role.Admin))
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
  createCategory(@Body() body: CreateCategoryDTO) {
    return this.categoryService.createCategory(body);
  }

  @Patch('/category/:id')
  @UseGuards(RoleGuard(Role.Admin))
  updateCategory(@Param('id') id: string, @Body() body: UpdateCategoryDTO) {
    return this.categoryService.updateCategory(id, body);
  }

  @Get('/category')
  @UseGuards(RoleGuard(Role.Admin))
  findAllCategories(@Query() queryData: FilterCategoryDto) {
    return this.categoryService.findAll(queryData);
  }

  @Get('/category/:id')
  @UseGuards(RoleGuard(Role.Admin))
  findCategoryByID(@Param('id') id: string) {
    return this.categoryService.findByID(id);
  }

  @Get('/products')
  @UseGuards(RoleGuard(Role.Admin))
  findAllProducts(@Query() queryData: FilterProductDto) {
    return this.productService.findAll(queryData);
  }

  @Get('/products/:id')
  @UseGuards(RoleGuard(Role.Admin))
  findProductById(@Param('id') id: string) {
    return this.productService.findByID(id);
  }

  @Post('/products')
  @UseGuards(RoleGuard(Role.Admin))
  createProduct(@Body() body: CreateProducDTO) {
    return this.productService.createProduct(body);
  }

  @Patch('/products/:id')
  @UseGuards(RoleGuard(Role.Admin))
  updateProduct(@Param('id') id: string, @Body() body: UpdateProductDTO) {
    return this.productService.updateProduct(id, body);
  }

  @Get('/stores')
  @UseGuards(RoleGuard(Role.Admin))
  findAllStores() {
    return this.storeService.findAll();
  }

  @Post('/stores')
  @UseGuards(RoleGuard(Role.Admin))
  createStore(@Body() body: CreateStoreDTO) {
    return this.storeService.createStore(body);
  }

  @Patch('/stores/:id')
  @UseGuards(RoleGuard(Role.Admin))
  updateStore(@Param('id') id: string, @Body() body: UpdateStoreDTO) {
    return this.storeService.updateStore(id, body);
  }

  @UseGuards(RoleGuard(Role.Admin))
  @Post('/files')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(
    @Body() uploadFileDto: UploadFileDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.filesService.uploadFile(file,uploadFileDto.object);
  }
}
