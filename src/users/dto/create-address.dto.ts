import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateAddressDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'บ้าน' })
  label?: string;

  @IsString() @ApiProperty({ example: '123/4' }) line1: string;
  @IsString() @ApiProperty({ example: 'กรุงเทพฯ' }) province: string;
  @IsString() @ApiProperty({ example: '10220' }) postcode: string;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({ example: true })
  isDefault?: boolean;
}
