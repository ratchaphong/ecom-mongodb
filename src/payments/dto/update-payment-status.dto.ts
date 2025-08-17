import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { PaymentStatus } from '../payments.schema';

export class UpdatePaymentStatusDto {
  @IsEnum(PaymentStatus)
  @ApiProperty({ enum: PaymentStatus, example: PaymentStatus.SUCCEEDED })
  status: PaymentStatus;
}
