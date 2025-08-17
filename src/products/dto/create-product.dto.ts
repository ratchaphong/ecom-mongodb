// create-product.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProductStatus } from '../products.schema';

export class CreateProductDto {
  @IsMongoId()
  @ApiProperty({
    description: 'รหัสหมวดหมู่สินค้า (Mongo ObjectId)',
    example: '66c8a4f2e1c0b3a4d9f1a2b3',
  })
  categoryId: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'รหัสสินค้า (ต้องไม่ซ้ำ)',
    example: 'SKU-KEYB-001',
  })
  sku: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'ชื่อสินค้า',
    example: 'Mechanical Keyboard 75%',
  })
  name: string;

  @IsEnum(ProductStatus)
  @ApiProperty({
    description: 'สถานะสินค้า',
    enum: ProductStatus,
    default: ProductStatus.ACTIVE,
    example: ProductStatus.ACTIVE,
  })
  status: ProductStatus = ProductStatus.ACTIVE;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @ApiProperty({
    description: 'ราคาต่อหน่วย (THB)',
    example: 1990,
    minimum: 0,
    type: Number,
  })
  price: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @ApiProperty({
    description: 'จำนวนคงเหลือในสต็อก',
    example: 120,
    minimum: 0,
    type: Number,
  })
  stockQty: number;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: 'คำอธิบายสินค้า (optional)',
    example: 'คีย์บอร์ด 75% สวิตช์แดง มีไฟ RGB และ hot-swap',
  })
  description?: string;
}
