import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'ชื่อหมวดหมู่ (ต้องไม่ซ้ำ)',
    example: 'Keyboards',
  })
  name: string;
}
