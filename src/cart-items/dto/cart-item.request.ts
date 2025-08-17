import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsMongoId, IsOptional, Min } from 'class-validator';

export class AddCartItemDto {
  @IsMongoId()
  @ApiProperty({ example: '66d0aa...p1' })
  productId: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @ApiPropertyOptional({ example: 2, default: 1 })
  qty?: number = 1;
}

export class UpdateCartItemQtyDto {
  @IsInt()
  @Min(1)
  @ApiProperty({ example: 3 })
  qty: number;
}
