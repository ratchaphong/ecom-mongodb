import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, Min, IsString } from 'class-validator';

export class CreatePaymentDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @ApiProperty({
    required: false,
    example: 48890,
    description: 'จำนวนเงินที่ชำระ (ไม่กรอก = ใช้ totalAmount จาก order)',
  })
  amount?: number;

  @IsOptional()
  @IsString()
  @ApiProperty({
    required: false,
    example: 'stripe',
    description: 'ช่องทางชำระ',
  })
  provider?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    required: false,
    example: 'ch_1QxYZ....',
    description: 'หมายเลขธุรกรรมจากผู้ให้บริการ (ถ้ามี)',
  })
  transactionId?: string;
}
