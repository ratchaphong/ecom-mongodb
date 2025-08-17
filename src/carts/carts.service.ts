import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cart, CartDocument, CartStatus } from './carts.schema';

@Injectable()
export class CartsService {
  constructor(
    @InjectModel(Cart.name) private readonly cartModel: Model<CartDocument>,
  ) {}

  async getOrCreateActiveCart(userId: string) {
    const _uid = new Types.ObjectId(userId);

    // upsert + new + lean -> ได้ POJO เสมอ (ไม่ชน type)
    const cart = await this.cartModel
      .findOneAndUpdate(
        { userId: _uid },
        { $setOnInsert: { userId: _uid, status: CartStatus.ACTIVE } },
        { upsert: true, new: true, lean: true },
      )
      .exec();

    return cart; // เป็น Lean object (ไม่ใช่ Document)
  }

  async setStatus(userId: string, status: CartStatus) {
    const _uid = new Types.ObjectId(userId);

    const doc = await this.cartModel
      .findOneAndUpdate(
        { userId: _uid },
        { $set: { status } },
        { new: true, lean: true },
      )
      .exec();

    if (!doc) throw new NotFoundException('Cart not found');
    return doc; // Lean object เช่นกัน
  }
}
