import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateAddressDto {
  @IsOptional() @IsString() @ApiPropertyOptional() label?: string;
  @IsOptional() @IsString() @ApiPropertyOptional() line1?: string;
  @IsOptional() @IsString() @ApiPropertyOptional() province?: string;
  @IsOptional() @IsString() @ApiPropertyOptional() postcode?: string;
  @IsOptional() @IsBoolean() @ApiPropertyOptional() isDefault?: boolean;
}
