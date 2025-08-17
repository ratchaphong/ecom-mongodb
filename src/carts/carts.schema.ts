import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type CartDocument = HydratedDocument<Cart>;
export enum CartStatus {
  ACTIVE = 'ACTIVE',
  CHECKED_OUT = 'CHECKED_OUT',
}

@Schema({ collection: 'carts', timestamps: true, versionKey: false })
export class Cart {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  userId: Types.ObjectId;

  @Prop({
    type: String,
    enum: Object.values(CartStatus),
    default: CartStatus.ACTIVE,
  })
  status: CartStatus;
}
export const CartSchema = SchemaFactory.createForClass(Cart);
CartSchema.index({ userId: 1 }, { unique: true });
