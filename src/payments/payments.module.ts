import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { Payment, PaymentSchema } from './payments.schema';

// อิง order เพื่ออ่านยอด/อัปเดตสถานะ
import { OrdersModule } from 'src/orders/orders.module';
import { CartsModule } from 'src/carts/carts.module';

@Module({
  imports: [
    OrdersModule,
    CartsModule,
    MongooseModule.forFeature([{ name: Payment.name, schema: PaymentSchema }]),
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [MongooseModule, PaymentsService],
})
export class PaymentsModule {}
