// products.controller.ts
import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { FindProductsQueryDto } from './dto/find-products.query';
import { ProductResponseDto } from './dto/product.response';

@ApiTags('products')
@UseInterceptors(ClassSerializerInterceptor)
@Controller('products')
export class ProductsController {
  constructor(private readonly service: ProductsService) {}

  @Post()
  @ApiCreatedResponse({
    type: ProductResponseDto,
    description: 'สร้างสินค้าเรียบร้อย',
  })
  async create(@Body() dto: CreateProductDto): Promise<ProductResponseDto> {
    const doc = await this.service.create(dto);
    return plainToInstance(ProductResponseDto, doc, {
      excludeExtraneousValues: true,
    });
  }

  @Get()
  @ApiOkResponse({
    type: ProductResponseDto,
    isArray: true,
    description: 'รายการสินค้า',
  })
  async list(
    @Query() query: FindProductsQueryDto,
  ): Promise<ProductResponseDto[]> {
    const docs = await this.service.findAll(query);
    return plainToInstance(ProductResponseDto, docs, {
      excludeExtraneousValues: true,
    });
  }

  // (แถม) รองรับ NotFound ให้ชัด ด้วย endpoint ดึงตาม id
  @Get(':id')
  @ApiOkResponse({ type: ProductResponseDto, description: 'ข้อมูลสินค้า' })
  @ApiNotFoundResponse({ description: 'ไม่พบสินค้า' })
  async findOne(@Param('id') id: string): Promise<ProductResponseDto> {
    const doc = await this.service.findOneById(id);
    if (!doc) throw new NotFoundException('ไม่พบสินค้า');
    return plainToInstance(ProductResponseDto, doc, {
      excludeExtraneousValues: true,
    });
  }
}
