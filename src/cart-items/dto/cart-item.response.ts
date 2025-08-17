import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';

export class CartItemResponseDto {
  @Expose()
  @Transform(({ obj }) => obj._id?.toString?.())
  @ApiProperty({
    type: String,
    description: 'ไอดีของรายการในตะกร้า (ObjectId)',
    example: '66d0f0a5c1234567890abcde',
    readOnly: true,
  })
  id: string;

  @Expose()
  @Transform(({ obj }) => obj.cartId?.toString?.())
  @ApiProperty({
    type: String,
    description: 'ไอดีของตะกร้าที่รายการนี้สังกัด (ObjectId)',
    example: '66d0e1b2c1234567890abcdf',
    readOnly: true,
  })
  cartId: string;

  @Expose()
  @Transform(({ obj }) => obj.productId?.toString?.())
  @ApiProperty({
    type: String,
    description: 'ไอดีของสินค้าที่ถูกเพิ่มลงตะกร้า (ObjectId)',
    example: '66d0a9c8c1234567890abce0',
    readOnly: true,
  })
  productId: string;

  @Expose()
  @ApiProperty({
    type: Number,
    description: 'จำนวนสินค้าที่ใส่ในตะกร้า (ขั้นต่ำ 1)',
    example: 2,
  })
  qty: number;

  @Expose()
  @ApiProperty({
    type: String,
    format: 'date-time',
    description: 'เวลาที่สร้างรายการ (ISO 8601)',
    example: '2025-08-17T01:25:10.000Z',
    readOnly: true,
  })
  createdAt: Date;

  @Expose()
  @ApiProperty({
    type: String,
    format: 'date-time',
    description: 'เวลาอัปเดตรายการล่าสุด (ISO 8601)',
    example: '2025-08-17T02:10:45.000Z',
    readOnly: true,
  })
  updatedAt: Date;
}
