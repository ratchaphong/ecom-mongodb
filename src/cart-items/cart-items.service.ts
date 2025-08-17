import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CartItem, CartItemDocument } from './cart-items.schema';
import { CartsService } from 'src/carts/carts.service';

type CartItemLean = {
  _id: Types.ObjectId;
  cartId: Types.ObjectId;
  productId: Types.ObjectId;
  qty: number;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class CartItemsService {
  constructor(
    @InjectModel(CartItem.name) private readonly model: Model<CartItemDocument>,
    private readonly cartsService: CartsService,
  ) {}

  private oid(id: string) {
    return new Types.ObjectId(id);
  }

  async list(userId: string) {
    const cart = await this.cartsService.getOrCreateActiveCart(userId);
    const cartId = (cart as any)._id ?? (cart as any).id;
    return this.model
      .find({ cartId })
      .sort({ createdAt: -1 })
      .lean<CartItemLean[]>()
      .exec();
  }

  async add(userId: string, productId: string, qty = 1) {
    const cart = await this.cartsService.getOrCreateActiveCart(userId);
    const cartId = (cart as any)._id ?? (cart as any).id;

    // upsert + เพิ่ม qty ถ้ามีอยู่แล้ว
    const doc = await this.model
      .findOneAndUpdate(
        { cartId, productId: this.oid(productId) },
        { $inc: { qty } },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      )
      .lean<CartItemLean>()
      .exec();

    return doc;
  }

  async updateQty(userId: string, itemId: string, qty: number) {
    const cart = await this.cartsService.getOrCreateActiveCart(userId);
    const cartId = (cart as any)._id ?? (cart as any).id;

    const doc = await this.model
      .findOneAndUpdate(
        { _id: this.oid(itemId), cartId },
        { $set: { qty } },
        { new: true },
      )
      .lean<CartItemLean>()
      .exec();

    if (!doc) throw new NotFoundException('Cart item not found');
    return doc;
  }

  async remove(userId: string, itemId: string) {
    const cart = await this.cartsService.getOrCreateActiveCart(userId);
    const cartId = (cart as any)._id ?? (cart as any).id;

    const res = await this.model
      .deleteOne({ _id: this.oid(itemId), cartId })
      .exec();

    if (res.deletedCount === 0)
      throw new NotFoundException('Cart item not found');
    return { deleted: true };
  }

  async clear(userId: string) {
    const cart = await this.cartsService.getOrCreateActiveCart(userId);
    const cartId = (cart as any)._id ?? (cart as any).id;

    await this.model.deleteMany({ cartId }).exec();
    return { cleared: true };
  }
}
