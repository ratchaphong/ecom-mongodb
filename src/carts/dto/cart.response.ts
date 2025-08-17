import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { CartStatus } from '../carts.schema';

export class CartResponseDto {
  @Expose()
  @ApiProperty({ example: '66d0dddd...' })
  @Transform(({ obj }) => obj._id?.toString?.() ?? obj.id)
  id: string;

  @Expose()
  @ApiProperty({ example: '66d0aaaa...' })
  @Transform(({ obj }) => obj.userId?.toString?.() ?? obj.userId)
  userId: string;

  @Expose()
  @ApiProperty({ example: CartStatus.ACTIVE })
  status: CartStatus;

  @Expose() createdAt: Date;
  @Expose() updatedAt: Date;
}
