// dto/product.response.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { ProductStatus } from '../products.schema';

export class ProductResponseDto {
  @Expose()
  @ApiProperty({
    description: 'รหัสสินค้า',
    example: '66c8a4f2e1c0b3a4d9f1a2b3',
  })
  @Transform(({ obj }) => obj._id?.toString?.() ?? obj.id)
  id: string;

  @Expose()
  @ApiProperty({ description: 'หมวดหมู่', example: '66c8a4f2e1c0b3a4d9f1a2b3' })
  @Transform(({ obj }) => obj.categoryId?.toString?.() ?? obj.categoryId)
  categoryId: string;

  @Expose()
  @ApiProperty({ description: 'SKU (ต้องไม่ซ้ำ)', example: 'SKU-KEYB-001' })
  sku: string;

  @Expose()
  @ApiProperty({
    description: 'ชื่อสินค้า',
    example: 'Mechanical Keyboard 75%',
  })
  name: string;

  @Expose()
  @ApiProperty({
    description: 'สถานะสินค้า',
    enum: ProductStatus,
    example: ProductStatus.ACTIVE,
  })
  status: ProductStatus;

  @Expose()
  @ApiProperty({ description: 'ราคา (THB)', example: 1990, type: Number })
  price: number;

  @Expose()
  @ApiProperty({ description: 'จำนวนคงเหลือ', example: 120, type: Number })
  stockQty: number;

  @Expose()
  @ApiPropertyOptional({
    description: 'คำอธิบาย',
    example: 'คีย์บอร์ด 75% สวิตช์แดง ไฟ RGB',
  })
  description?: string;

  @Expose()
  @ApiProperty({
    description: 'วันที่สร้าง',
    example: '2025-08-16T12:41:04.810Z',
  })
  @Transform(({ value }) => (value ? new Date(value) : undefined))
  createdAt?: Date;

  @Expose()
  @ApiProperty({
    description: 'วันที่แก้ไขล่าสุด',
    example: '2025-08-16T12:45:10.100Z',
  })
  @Transform(({ value }) => (value ? new Date(value) : undefined))
  updatedAt?: Date;
}
