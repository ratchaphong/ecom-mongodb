import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type OrderDocument = HydratedDocument<Order>;

export enum OrderStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
}

@Schema({ _id: false })
export class OrderItemEmbedded {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ type: Number, min: 0, required: true })
  priceAtPurchase: number;

  @Prop({ type: Number, min: 1, required: true })
  qty: number;
}
export const OrderItemEmbeddedSchema =
  SchemaFactory.createForClass(OrderItemEmbedded);

@Schema({ timestamps: true, collection: 'orders' })
export class Order {
  @Prop({ required: true, unique: true, index: true })
  orderNo: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({
    type: String,
    enum: Object.values(OrderStatus),
    default: OrderStatus.PENDING,
    index: true,
  })
  status: OrderStatus;

  @Prop({ type: [OrderItemEmbeddedSchema], required: true, default: [] })
  items: OrderItemEmbedded[];

  @Prop({ type: Number, min: 0, required: true })
  totalAmount: number;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

// Indexes ที่ใช้บ่อย
OrderSchema.index({ userId: 1, createdAt: -1 });
OrderSchema.index({ status: 1, createdAt: -1 });
