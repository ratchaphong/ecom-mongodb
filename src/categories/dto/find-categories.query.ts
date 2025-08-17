import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsMongoId, IsOptional, IsString } from 'class-validator';

export class FindCategoriesQueryDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: 'ค้นหาชื่อตามคำสำคัญ (case-insensitive)',
    example: 'key',
  })
  q?: string;
}
