import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';

export class OrderItemResponseDto {
  @Expose()
  @Transform(({ obj }) => obj.productId?.toString?.())
  @ApiProperty({
    example: '66c0aa11ccdd990022334455',
    description: 'อ้างถึงสินค้าเดิม',
  })
  productId: string;

  @Expose()
  @ApiProperty({ example: 'iPhone 16 Pro' })
  name: string;

  @Expose()
  @ApiProperty({ example: 38900, description: 'ราคาขณะสั่งซื้อ' })
  priceAtPurchase: number;

  @Expose()
  @ApiProperty({ example: 2, description: 'จำนวนที่สั่ง' })
  qty: number;
}

export class OrderResponseDto {
  @Expose()
  @Transform(({ obj }) => obj._id?.toString?.() ?? obj.id)
  @ApiProperty({ example: '66e01234abcd9001ff223344' })
  id: string;

  @Expose()
  @ApiProperty({ example: 'ORD-2025-000123' })
  orderNo: string;

  @Expose()
  @Transform(({ obj }) => obj.userId?.toString?.())
  @ApiProperty({ example: '66d0aa22bbccff0011223344' })
  userId: string;

  @Expose()
  @ApiProperty({
    example: 'PENDING',
    enum: ['PENDING', 'PAID', 'CANCELLED', 'SHIPPED', 'DELIVERED'],
  })
  status: string;

  @Expose()
  @Type(() => OrderItemResponseDto)
  @ApiProperty({ type: OrderItemResponseDto, isArray: true })
  items: OrderItemResponseDto[];

  @Expose()
  @ApiProperty({ example: 48890, description: 'ราคารวมทั้งออเดอร์' })
  totalAmount: number;

  @Expose() createdAt: Date;
  @Expose() updatedAt: Date;
}
