import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';
import { UserRole } from '../users.schema';

export class ProfileResponse {
  @Expose() @ApiPropertyOptional({ example: 'Alice' }) name?: string;
  @Expose() @ApiPropertyOptional({ example: '0800000000' }) phone?: string;
  @Expose() @ApiPropertyOptional({ example: '1999-01-01' }) birthDate?: Date;
  @Expose() @ApiPropertyOptional({ example: 'https://...' }) avatarUrl?: string;
}

export class AddressResponse {
  @Expose()
  @ApiProperty({ example: '66d0a1...' })
  @Transform(({ obj }) => obj._id?.toString?.() ?? obj.id)
  id: string;

  @Expose() @ApiPropertyOptional({ example: 'บ้าน' }) label?: string;
  @Expose() @ApiProperty({ example: '123/4' }) line1: string;
  @Expose() @ApiProperty({ example: 'กรุงเทพฯ' }) province: string;
  @Expose() @ApiProperty({ example: '10220' }) postcode: string;
  @Expose() @ApiProperty({ example: true }) isDefault: boolean;
}

export class UserResponseDto {
  @Expose()
  @ApiProperty({ example: '66d0aaaa...' })
  @Transform(({ obj }) => obj._id?.toString?.() ?? obj.id)
  id: string;

  @Expose()
  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @Expose()
  @ApiProperty({ enum: UserRole, example: UserRole.USER })
  role: UserRole;

  @Expose()
  @Type(() => ProfileResponse)
  @ApiPropertyOptional({ type: ProfileResponse })
  profile?: ProfileResponse;

  @Expose()
  @Type(() => AddressResponse)
  @ApiProperty({ type: AddressResponse, isArray: true })
  addresses: AddressResponse[];

  @Expose()
  @ApiProperty({ example: '2025-08-17T01:00:00.000Z' })
  createdAt: Date;

  @Expose()
  @ApiProperty({ example: '2025-08-17T01:10:00.000Z' })
  updatedAt: Date;

  @Expose()
  @ApiPropertyOptional({ example: null })
  deletedAt?: Date | null;
}
