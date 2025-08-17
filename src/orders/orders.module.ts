import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { Order, OrderSchema } from './orders.schema';
import { CartsModule } from 'src/carts/carts.module';
import { CartItemsModule } from 'src/cart-items/cart-items.module';
import { ProductsModule } from 'src/products/products.module';
import { Payment, PaymentSchema } from 'src/payments/payments.schema';

@Module({
  imports: [
    CartsModule,
    CartItemsModule,
    ProductsModule,
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: Payment.name, schema: PaymentSchema },
    ]),
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [MongooseModule, OrdersService],
})
export class OrdersModule {}
