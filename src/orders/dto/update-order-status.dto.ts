import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { OrderStatus } from '../orders.schema';

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  @ApiProperty({ enum: OrderStatus, example: OrderStatus.PAID })
  status: OrderStatus;
}
