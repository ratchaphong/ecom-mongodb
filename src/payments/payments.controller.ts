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
import { PaymentsService } from './payments.service';
import { PaymentResponseDto } from './dto/payment.response';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';

@ApiTags('payments')
@UseInterceptors(ClassSerializerInterceptor)
@Controller()
export class PaymentsController {
  constructor(private readonly service: PaymentsService) {}

  // ดู payment ทั้งหมดของออเดอร์
  @Get('orders/:orderId/payments')
  @ApiOkResponse({ type: PaymentResponseDto, isArray: true })
  async listByOrder(
    @Param('orderId') orderId: string,
  ): Promise<PaymentResponseDto[]> {
    const docs = await this.service.listByOrder(orderId);
    return plainToInstance(PaymentResponseDto, docs, {
      excludeExtraneousValues: true,
    });
  }

  // เปลี่ยนสถานะ payment; ถ้า SUCCEEDED → order เป็น PAID
  @Patch('payments/:paymentId/status')
  @ApiOkResponse({ type: PaymentResponseDto })
  @ApiNotFoundResponse({ description: 'Payment/Order not found' })
  @ApiBadRequestResponse({ description: 'Order already paid' })
  async updateStatus(
    @Param('paymentId') paymentId: string,
    @Body() dto: UpdatePaymentStatusDto,
  ): Promise<PaymentResponseDto> {
    const doc = await this.service.updateStatus(paymentId, dto.status);
    return plainToInstance(PaymentResponseDto, doc, {
      excludeExtraneousValues: true,
    });
  }

  // ดู payment รายตัว
  @Get('payments/:paymentId')
  @ApiOkResponse({ type: PaymentResponseDto })
  @ApiNotFoundResponse({ description: 'Payment not found' })
  async getById(
    @Param('paymentId') paymentId: string,
  ): Promise<PaymentResponseDto> {
    const doc = await this.service.getById(paymentId);
    return plainToInstance(PaymentResponseDto, doc, {
      excludeExtraneousValues: true,
    });
  }
}
