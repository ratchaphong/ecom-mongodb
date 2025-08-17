import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';

export class PaymentResponseDto {
  @Expose()
  @Transform(({ obj }) => obj._id?.toString?.() ?? obj.id)
  @ApiProperty({ example: '66e0...123' })
  id: string;

  @Expose()
  @Transform(({ obj }) => obj.orderId?.toString?.())
  @ApiProperty({ example: '66d0aa22bbccff0011223344' })
  orderId: string;

  @Expose()
  @ApiProperty({ example: 48890 })
  amount: number;

  @Expose()
  @ApiProperty({ enum: ['PENDING', 'SUCCEEDED', 'FAILED'], example: 'PENDING' })
  status: string;

  @Expose()
  @ApiProperty({ required: false, example: 'stripe', nullable: true })
  provider?: string;

  @Expose()
  @ApiProperty({ required: false, example: 'ch_1QxYZ...', nullable: true })
  transactionId?: string;

  @Expose()
  @ApiProperty({ required: false, nullable: true })
  paidAt?: Date | null;

  @Expose() createdAt: Date;
  @Expose() updatedAt: Date;
}
