import { Controller, Get, Param, Patch } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { CartsService } from './carts.service';
import { CartResponseDto } from './dto/cart.response';
import { CartStatus } from './carts.schema';

@ApiTags('cart')
@Controller('users/:userId/cart') // คง URL เดิม
export class CartsController {
  constructor(private readonly service: CartsService) {}

  @Get()
  @ApiOkResponse({ type: CartResponseDto })
  async getCart(@Param('userId') userId: string): Promise<CartResponseDto> {
    const doc = await this.service.getOrCreateActiveCart(userId);
    return plainToInstance(CartResponseDto, doc, {
      excludeExtraneousValues: true,
    });
  }

  @Patch('status/active')
  @ApiOkResponse({ type: CartResponseDto })
  async setActive(@Param('userId') userId: string): Promise<CartResponseDto> {
    const doc = await this.service.setStatus(userId, CartStatus.ACTIVE);
    return plainToInstance(CartResponseDto, doc, {
      excludeExtraneousValues: true,
    });
  }

  @Patch('status/checked-out')
  @ApiOkResponse({ type: CartResponseDto })
  async setCheckedOut(
    @Param('userId') userId: string,
  ): Promise<CartResponseDto> {
    const doc = await this.service.setStatus(userId, CartStatus.CHECKED_OUT);
    return plainToInstance(CartResponseDto, doc, {
      excludeExtraneousValues: true,
    });
  }
}
