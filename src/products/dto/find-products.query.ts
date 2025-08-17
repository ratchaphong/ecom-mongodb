// dto/find-products.query.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsMongoId, IsOptional } from 'class-validator';
import { ProductStatus } from '../products.schema';

export class FindProductsQueryDto {
  @IsOptional()
  @IsMongoId()
  @ApiPropertyOptional({
    description: 'รหัสหมวดหมู่ (Mongo ObjectId)',
    example: '66c8a4f2e1c0b3a4d9f1a2b3',
  })
  categoryId?: string;

  @IsOptional()
  @IsEnum(ProductStatus)
  @ApiPropertyOptional({
    description: 'สถานะสินค้า',
    enum: ProductStatus,
    example: ProductStatus.ACTIVE,
  })
  status?: ProductStatus;
}
