import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type CartItemDocument = HydratedDocument<CartItem>;

@Schema({ collection: 'cart_items', timestamps: true, versionKey: false })
export class CartItem {
  @Prop({ type: Types.ObjectId, ref: 'Cart', required: true, index: true })
  cartId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Product', required: true, index: true })
  productId: Types.ObjectId;

  @Prop({ type: Number, min: 1, required: true, default: 1 })
  qty: number;
}
export const CartItemSchema = SchemaFactory.createForClass(CartItem);

// ห้ามมีสินค้าซ้ำใน cart เดียวกัน
CartItemSchema.index({ cartId: 1, productId: 1 }, { unique: true });
