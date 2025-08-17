import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { OrdersService } from './orders.service';
import { OrderResponseDto } from './dto/order.response';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@ApiTags('orders')
@UseInterceptors(ClassSerializerInterceptor)
@Controller()
export class OrdersController {
  constructor(private readonly service: OrdersService) {}

  // ----- User-scoped routes -----
  @Post('users/:userId/orders/checkout')
  @ApiCreatedResponse({ type: OrderResponseDto })
  @ApiBadRequestResponse({ description: 'Cart is empty' })
  @ApiNotFoundResponse({
    description: 'Active cart not found / Product not found',
  })
  async checkout(@Param('userId') userId: string): Promise<OrderResponseDto> {
    const doc = await this.service.checkoutFromCart(userId);
    return plainToInstance(OrderResponseDto, doc, {
      excludeExtraneousValues: true,
    });
  }

  @Get('users/:userId/orders')
  @ApiOkResponse({ type: OrderResponseDto, isArray: true })
  async listMyOrders(
    @Param('userId') userId: string,
  ): Promise<OrderResponseDto[]> {
    const docs = await this.service.listUserOrders(userId);
    return plainToInstance(OrderResponseDto, docs, {
      excludeExtraneousValues: true,
    });
  }

  @Patch('orders/:orderId/status')
  @ApiOkResponse({ type: OrderResponseDto })
  @ApiNotFoundResponse({ description: 'Order not found' })
  async updateStatus(
    @Param('orderId') orderId: string,
    @Body() dto: UpdateOrderStatusDto,
  ): Promise<OrderResponseDto> {
    const doc = await this.service.updateStatus(orderId, dto.status);
    return plainToInstance(OrderResponseDto, doc, {
      excludeExtraneousValues: true,
    });
  }
}
