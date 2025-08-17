import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CartItemsController } from './cart-items.controller';
import { CartItemsService } from './cart-items.service';
import { CartItem, CartItemSchema } from './cart-items.schema';
import { CartsModule } from 'src/carts/carts.module';

@Module({
  imports: [
    CartsModule,
    MongooseModule.forFeature([
      { name: CartItem.name, schema: CartItemSchema },
    ]),
  ],
  controllers: [CartItemsController],
  providers: [CartItemsService],
  exports: [MongooseModule, CartItemsService],
})
export class CartItemsModule {}
