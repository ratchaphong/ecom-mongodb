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
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { CartItemsService } from './cart-items.service';
import { AddCartItemDto, UpdateCartItemQtyDto } from './dto/cart-item.request';
import { CartItemResponseDto } from './dto/cart-item.response';

@ApiTags('cart-items')
@UseInterceptors(ClassSerializerInterceptor)
@Controller('users/:userId/cart/items')
export class CartItemsController {
  constructor(private readonly service: CartItemsService) {}

  @Get()
  @ApiOkResponse({ type: CartItemResponseDto, isArray: true })
  async list(@Param('userId') userId: string) {
    const docs = await this.service.list(userId);
    return plainToInstance(CartItemResponseDto, docs, {
      excludeExtraneousValues: true,
    });
  }

  @Post()
  @ApiCreatedResponse({ type: CartItemResponseDto })
  async add(@Param('userId') userId: string, @Body() dto: AddCartItemDto) {
    const doc = await this.service.add(userId, dto.productId, dto.qty ?? 1);
    return plainToInstance(CartItemResponseDto, doc, {
      excludeExtraneousValues: true,
    });
  }

  @Patch(':itemId')
  @ApiOkResponse({ type: CartItemResponseDto })
  async updateQty(
    @Param('userId') userId: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateCartItemQtyDto,
  ) {
    const doc = await this.service.updateQty(userId, itemId, dto.qty);
    return plainToInstance(CartItemResponseDto, doc, {
      excludeExtraneousValues: true,
    });
  }

  @Delete(':itemId')
  @ApiOkResponse({ description: 'deleted' })
  async remove(
    @Param('userId') userId: string,
    @Param('itemId') itemId: string,
  ) {
    return this.service.remove(userId, itemId);
  }

  @Delete()
  @ApiOkResponse({ description: 'cleared' })
  async clear(@Param('userId') userId: string) {
    return this.service.clear(userId);
  }
}
