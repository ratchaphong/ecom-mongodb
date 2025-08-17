import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, IsUrl } from 'class-validator';

export class UpsertProfileDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'Alice' })
  name?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: '0800000000' })
  phone?: string;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({ example: '1999-01-01' })
  birthDate?: string;

  @IsOptional()
  @IsUrl()
  @ApiPropertyOptional({ example: 'https://cdn.example.com/a.jpg' })
  avatarUrl?: string;
}
