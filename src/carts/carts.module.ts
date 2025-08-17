import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Cart, CartSchema } from './carts.schema';
import { CartsService } from './carts.service';
import { CartsController } from './carts.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Cart.name, schema: CartSchema }]),
  ],
  controllers: [CartsController],
  providers: [CartsService],
  exports: [MongooseModule, CartsService],
})
export class CartsModule {}
