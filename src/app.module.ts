// app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductsModule } from './products/products.module';
import { CategoriesModule } from './categories/categories.module';
import { UsersModule } from './users/users.module';
import { CartsModule } from './carts/carts.module';
import { CartItemsModule } from './cart-items/cart-items.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (cfg: ConfigService) => ({
        // ถ้าไม่มี MONGO_URI ใน .env ให้ fallback เป็น localhost แบบ standalone
        uri:
          cfg.get<string>('MONGO_URI') ??
          'mongodb://root:example@localhost:27017/mydb?authSource=admin',
        serverSelectionTimeoutMS: 10000,
        connectionFactory: (connection) => {
          connection.on('connected', () => console.log('[Mongo] connected'));
          connection.on('error', (e) => console.error('[Mongo] error', e));
          connection.on('disconnected', () =>
            console.warn('[Mongo] disconnected'),
          );
          return connection;
        },
      }),
      inject: [ConfigService],
    }),
    ProductsModule,
    CategoriesModule,
    UsersModule,
    CartsModule,
    CartItemsModule,
    OrdersModule,
    PaymentsModule,
  ],
  providers: [],
  controllers: [],
})
export class AppModule {}
