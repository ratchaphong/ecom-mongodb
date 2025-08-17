import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';

export class CategoryResponseDto {
  @Expose()
  @ApiProperty({ description: 'ไอดี', example: '66d0bbbb0000000000000001' })
  @Transform(({ obj }) => obj._id?.toString?.() ?? obj.id)
  id: string;

  @Expose()
  @ApiProperty({ description: 'ชื่อหมวดหมู่', example: 'Keyboards' })
  name: string;

  @Expose()
  @ApiProperty({ description: 'slug', example: 'keyboards' })
  slug: string;

  @Expose()
  @ApiProperty({
    description: 'สร้างเมื่อ',
    example: '2025-08-16T12:41:04.810Z',
  })
  createdAt: Date;

  @Expose()
  @ApiProperty({
    description: 'แก้ไขล่าสุด',
    example: '2025-08-16T12:45:10.100Z',
  })
  updatedAt: Date;
}
