import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UserResponseDto } from './dto/user.response';
import { UpsertProfileDto } from './dto/upsert-profile.dto';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { AddressResponse, ProfileResponse } from './dto/user.response';
import { CartsService } from 'src/carts/carts.service';
import { CartResponseDto } from 'src/carts/dto/cart.response';

@ApiTags('users')
@UseInterceptors(ClassSerializerInterceptor)
@Controller('users')
export class UsersController {
  constructor(
    private readonly service: UsersService,
    private readonly cartsService: CartsService,
  ) {}

  // Users
  @Post()
  @ApiCreatedResponse({ type: UserResponseDto })
  @ApiConflictResponse({ description: 'Email already exists' })
  async create(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
    const doc = await this.service.createUser(dto);
    return plainToInstance(UserResponseDto, doc, {
      excludeExtraneousValues: true,
    });
  }

  @Get()
  @ApiOkResponse({ type: UserResponseDto, isArray: true })
  async list(): Promise<UserResponseDto[]> {
    const docs = await this.service.listUsers();
    return plainToInstance(UserResponseDto, docs, {
      excludeExtraneousValues: true,
    });
  }

  @Get(':userId')
  @ApiOkResponse({ type: UserResponseDto })
  @ApiNotFoundResponse({ description: 'User not found' })
  async get(@Param('userId') userId: string): Promise<UserResponseDto> {
    const doc = await this.service.getUser(userId);
    return plainToInstance(UserResponseDto, doc, {
      excludeExtraneousValues: true,
    });
  }

  // Profile (embedded)
  @Get(':userId/profile')
  @ApiOkResponse({ type: ProfileResponse })
  @ApiNotFoundResponse({ description: 'User not found' })
  async getProfile(@Param('userId') userId: string): Promise<ProfileResponse> {
    const doc = await this.service.getProfile(userId);
    return plainToInstance(ProfileResponse, doc, {
      excludeExtraneousValues: true,
    });
  }

  @Patch(':userId/profile')
  @ApiOkResponse({ type: ProfileResponse })
  @ApiNotFoundResponse({ description: 'User not found' })
  async upsertProfile(
    @Param('userId') userId: string,
    @Body() dto: UpsertProfileDto,
  ): Promise<ProfileResponse> {
    const doc = await this.service.upsertProfile(userId, dto);
    return plainToInstance(ProfileResponse, doc, {
      excludeExtraneousValues: true,
    });
  }

  // Addresses (embedded)
  @Get(':userId/addresses')
  @ApiOkResponse({ type: AddressResponse, isArray: true })
  @ApiNotFoundResponse({ description: 'User not found' })
  async listAddresses(
    @Param('userId') userId: string,
  ): Promise<AddressResponse[]> {
    const docs = await this.service.listAddresses(userId);
    return plainToInstance(AddressResponse, docs, {
      excludeExtraneousValues: true,
    });
  }

  @Post(':userId/addresses')
  @ApiCreatedResponse({ type: AddressResponse })
  @ApiNotFoundResponse({ description: 'User not found' })
  async createAddress(
    @Param('userId') userId: string,
    @Body() dto: CreateAddressDto,
  ): Promise<AddressResponse> {
    const doc = await this.service.createAddress(userId, dto);
    return plainToInstance(AddressResponse, doc, {
      excludeExtraneousValues: true,
    });
  }

  @Patch(':userId/addresses/:addressId')
  @ApiOkResponse({ type: AddressResponse })
  @ApiNotFoundResponse({ description: 'User/Address not found' })
  async updateAddress(
    @Param('userId') userId: string,
    @Param('addressId') addressId: string,
    @Body() dto: UpdateAddressDto,
  ): Promise<AddressResponse> {
    const doc = await this.service.updateAddress(userId, addressId, dto);
    return plainToInstance(AddressResponse, doc, {
      excludeExtraneousValues: true,
    });
  }

  @Delete(':userId/addresses/:addressId')
  @ApiOkResponse({ description: 'deleted' })
  @ApiNotFoundResponse({ description: 'User/Address not found' })
  async removeAddress(
    @Param('userId') userId: string,
    @Param('addressId') addressId: string,
  ) {
    return this.service.removeAddress(userId, addressId);
  }

  @Post(':userId/addresses/:addressId/default')
  @ApiOkResponse({ description: 'ok' })
  @ApiNotFoundResponse({ description: 'User/Address not found' })
  async setDefaultAddress(
    @Param('userId') userId: string,
    @Param('addressId') addressId: string,
  ) {
    return this.service.setDefaultAddress(userId, addressId);
  }
}
