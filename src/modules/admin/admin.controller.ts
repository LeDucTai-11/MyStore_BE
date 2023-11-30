import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Response } from 'express';
import { UsersService } from '../users/users.service';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOkResponse,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import RoleGuard from 'src/core/guards/roles/roles.guard';
import { Role } from 'src/core/enum/roles.enum';
import { CreateUserDTO } from '../users/dto';
import {
  CreateCategoryDTO,
  FilterCategoryDto,
  UpdateCategoryDTO,
} from '../category/dto';
import { CategoryService } from '../category/category.service';
import { FilterUserDto } from '../users/dto';
import {
  CreateProducDTO,
  FilterProductDto,
  UpdateProductDTO,
} from '../product/dto';
import { ProductService } from '../product/product.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadFileDto } from '../files/dto/upload-file.dto';
import { FilesService } from '../files/files.service';
import { CreateStoreDTO } from '../store/dto/create-store.dto';
import { StoreService } from '../store/store.service';
import { UpdateStoreDTO } from '../store/dto/update-store.dto';
import { CreateImportOrderDTO } from '../import-order/dto/create-import-order.dto';
import { ImportOrderService } from '../import-order/import-order.service';
import { CreateVoucherDTO } from '../voucher/dto/create-voucher.dto';
import { VoucherService } from '../voucher/voucher.service';
import { FilterStoreDto } from '../store/dto/filter-store.dto';
import { ExportProductStoreDTO } from '../product/dto/export-product-store.dto';
import { ExportType } from 'src/core/enum/exportType.enum';
import { ResponseProductStoreDTO } from '../product/dto/response-product-store.dto';
import { FilterImportOderDto } from '../import-order/dto/filter-import-order.dto';
import { FilterVoucherDto } from '../voucher/dto/filter-voucher.dto';
import { UpdateVoucherDTO } from '../voucher/dto/update-voucher.dto';
import { UpdateOrderRequestStatusDto } from '../order-request/dto/update-order-request.dto';
import { OrderRequestService } from '../order-request/order-request.service';
import { FilterOrderRequestDto } from '../order-request/dto/filter-order-request.dto';
import { OrderService } from '../order/order.service';
import { FilterOrderDto } from '../order/dto/filter-order.dto';

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
    private readonly importOrderService: ImportOrderService,
    private readonly voucherService: VoucherService,
    private readonly orderRequestService: OrderRequestService,
    private readonly orderService: OrderService,
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
  @ApiQuery({
    name: 'storeId',
    required: false,
    type: String,
    example: '',
  })
  findProductById(@Param('id') id: string,@Query() queryData: any) {
    return this.productService.findByID(id,queryData);
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

  @Delete('/products/:id')
  @UseGuards(RoleGuard(Role.Admin))
  deleteProduct(@Param('id') id: string) {
    return this.productService.deleteProduct(id);
  }

  @Get('/products/stores/:id')
  @UseGuards(RoleGuard(Role.Admin))
  @ApiOkResponse({
    type: ResponseProductStoreDTO,
  })
  async exportProductStores(
    @Param('id') id: string,
    @Res() res: Response,
    @Query() queryData: ExportProductStoreDTO,
  ) {
    const productStores = await this.productService.findByStoreID(id);
    if (queryData.exportType === ExportType.CSV) {
      const filePath = `product-stores-${new Date().valueOf().toString()}.csv`;
      const dataCSV = await this.productService.exportProductStoresToCSV(
        productStores,
      );
      res.header('Content-Type', 'text/csv');
      res.attachment(filePath);
      return res.status(200).send(dataCSV);
    } else if (queryData.exportType === ExportType.EXCEL) {
      const filePath = `product-stores-${new Date().valueOf().toString()}.xlsx`;
      const streamBuffer = await this.productService.exportProductStoresToExcel(
        productStores,
      );
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.attachment(filePath);
      return streamBuffer.pipe(res);
    } else if (queryData.exportType === ExportType.PDF) {
      const filePath = `product-stores-${new Date().valueOf().toString()}.pdf`;
      const pdfDoc = await this.productService.exportProductStoresToPDF(
        productStores,
      );
      res.setHeader('Content-Type', 'application/pdf');
      res.attachment(filePath);
      pdfDoc.pipe(res);
      return pdfDoc.end();
    }
    return res.status(200).json(productStores);
  }

  @Get('/stores')
  @UseGuards(RoleGuard(Role.Admin))
  findAllStores(@Query() queryData: FilterStoreDto) {
    return this.storeService.findAll(queryData);
  }

  @Get('/stores/:id')
  @UseGuards(RoleGuard(Role.Admin))
  findStoreById(@Param('id') id: string) {
    return this.storeService.findByID(id);
  }

  @Post('/stores')
  @UseGuards(RoleGuard(Role.Admin))
  createStore(@Body() body: CreateStoreDTO) {
    return this.storeService.createStore(body);
  }

  @Delete('/stores/:id')
  @UseGuards(RoleGuard(Role.Admin))
  deleteStore(@Param('id') id: string) {
    return this.storeService.deleteStore(id);
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
    return this.filesService.uploadFile(file, uploadFileDto);
  }

  @Post('/import-order')
  @UseGuards(RoleGuard(Role.Admin))
  async createImportOrder(@Body() body: CreateImportOrderDTO) {
    return this.importOrderService.createImportOrder(body);
  }

  @Get('/import-order')
  @UseGuards(RoleGuard(Role.Admin))
  async findAllImportOrders(@Query() queryData: FilterImportOderDto) {
    return this.importOrderService.findAll(queryData);
  }

  @Get('/import-order/:id')
  @UseGuards(RoleGuard(Role.Admin))
  async findImportOrdersByID(@Param('id') id: string) {
    return this.importOrderService.findByID(id);
  }

  @Post('/voucher')
  @UseGuards(RoleGuard(Role.Admin))
  async createVoucher(@Body() body: CreateVoucherDTO) {
    return this.voucherService.createVoucher(body);
  }

  @Get('/voucher')
  @UseGuards(RoleGuard(Role.Admin))
  async findAllVouchers(@Query() queryDate: FilterVoucherDto) {
    return this.voucherService.findAll(queryDate);
  }

  @Get('/voucher/:id')
  @UseGuards(RoleGuard(Role.Admin))
  async findVoucherByID(@Param('id') id: string) {
    return this.voucherService.findByID(id);
  }

  @Delete('/voucher/:id')
  @UseGuards(RoleGuard(Role.Admin))
  deleteVoucher(@Param('id') id: string) {
    return this.voucherService.deleteVoucher(id);
  }

  @Patch('/voucher/:id')
  @UseGuards(RoleGuard(Role.Admin))
  updateVoucher(@Param('id') id: string, @Body() body: UpdateVoucherDTO) {
    return this.voucherService.updateVoucher(id,body);
  }

  @Get('/order-request')
  @UseGuards(RoleGuard(Role.Admin))
  findAllOrderRequets(@Query() queryData: FilterOrderRequestDto) {
    return this.orderRequestService.findAll(queryData);
  }

  @Get('/order-request/:id')
  @UseGuards(RoleGuard(Role.Admin))
  findOrderRequetById(@Param('id') id: string) {
    return this.orderRequestService.findById(id);
  }

  @Patch('/order/modify-request-status/:id')
  @UseGuards(RoleGuard(Role.Admin))
  updateBookingModifyRequestStatus(
    @Param('id') id: string,
    @Body() updateBookingRequestStatusDto: UpdateOrderRequestStatusDto,
    @Request() req: any,
  ) {
    return this.orderRequestService.updateModifyRequestStatusByAdmin(
      updateBookingRequestStatusDto,
      req,
      id,
    );
  }

  @Get('/order')
  @UseGuards(RoleGuard(Role.Admin))
  findAllOrdes(@Query() queryData: FilterOrderDto) {
    return this.orderService.findAll(queryData);
  }

  @Get('/order/:id')
  @UseGuards(RoleGuard(Role.Admin))
  findOrderById(@Param('id') id: string) {
    return this.orderService.findById(id);
  }
}
