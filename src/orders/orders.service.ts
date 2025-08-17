import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Order,
  OrderDocument,
  OrderItemEmbedded,
  OrderStatus,
} from './orders.schema';

// ใช้โมเดลจากโมดูลอื่น
import { Cart, CartDocument, CartStatus } from 'src/carts/carts.schema';
import { CartItem, CartItemDocument } from 'src/cart-items/cart-items.schema';
import { Product, ProductDocument } from 'src/products/products.schema';
import {
  Payment,
  PaymentDocument,
  PaymentStatus,
} from 'src/payments/payments.schema';
import { CartsService } from 'src/carts/carts.service';
import { CartItemsService } from 'src/cart-items/cart-items.service';
import { ProductsService } from 'src/products/products.service';

export function genOrderNo(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  const rnd = Math.floor(Math.random() * 1_000_000)
    .toString()
    .padStart(6, '0');
  return `ORD-${y}${m}${d}-${hh}${mm}${ss}-${rnd}`;
}

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
    // @InjectModel(Cart.name) private readonly cartModel: Model<CartDocument>,
    // @InjectModel(CartItem.name)
    // private readonly cartItemModel: Model<CartItemDocument>,
    private readonly cartsService: CartsService,
    private readonly cartItemsService: CartItemsService,
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    // private readonly productsService: ProductsService,
    @InjectModel(Payment.name)
    private readonly paymentModel: Model<PaymentDocument>,
  ) {}

  /** 1) สร้างออเดอร์จาก cart ACTIVE ของ user และปรับสถานะ cart */
  async checkoutFromCart(userId: string) {
    const _uid = new Types.ObjectId(userId);

    // const cart = await this.cartModel
    //   .findOne({ userId: _uid, status: 'ACTIVE' })
    //   .lean()
    //   .exec();
    const cart = await this.cartsService.getOrCreateActiveCart(userId);
    if (!cart || cart.status !== CartStatus.ACTIVE)
      throw new NotFoundException('Active cart not found');

    // const items = await this.cartItemModel
    //   .find({ cartId: cart._id })
    //   .lean()
    //   .exec();
    const items = await this.cartItemsService.list(userId);
    if (!items || items.length === 0)
      throw new NotFoundException('Cart is empty');

    const productIds = items.map((i) => i.productId);
    const products = await this.productModel
      .find({ _id: { $in: productIds } })
      .lean()
      .exec();
    // const products = await this.productsService.findAll({});

    const pMap = new Map<string, any>();
    for (const p of products) pMap.set(p._id.toString(), p);

    const embedded: OrderItemEmbedded[] = [];
    let total = 0;

    for (const i of items) {
      const p = pMap.get(i.productId.toString());
      if (!p) {
        throw new NotFoundException(`Product not found: ${i.productId}`);
      }
      const price = Number(p.price ?? 0);
      const qty = Number(i.qty ?? 0);
      if (qty <= 0) continue;

      embedded.push({
        productId: new Types.ObjectId(i.productId),
        name: p.name,
        priceAtPurchase: price,
        qty,
      });
      total += price * qty;
    }

    if (!embedded.length) {
      throw new BadRequestException('No valid cart items to checkout');
    }

    const orderNo = genOrderNo();
    const order = await this.orderModel.create({
      orderNo,
      userId: _uid,
      status: OrderStatus.PENDING,
      items: embedded,
      totalAmount: total,
    });

    await this.paymentModel.create({
      orderId: order._id,
      amount: total,
      status: PaymentStatus.PENDING,
      paidAt: null,
    });

    // เคลียร์ cart items และปิด cart
    // await this.cartItemModel.deleteMany({ cartId: cart._id }).exec();
    await this.cartItemsService.clear(userId);

    // await this.cartModel
    //   .updateOne({ _id: cart._id }, { $set: { status: 'CHECKED_OUT' } })
    //   .exec();
    await this.cartsService.setStatus(userId, CartStatus.CHECKED_OUT);

    return order.toObject();
  }

  /** 2) ค้นหา orders ทั้งหมดของ user */
  async listUserOrders(userId: string) {
    const _uid = new Types.ObjectId(userId);
    return this.orderModel
      .find({ userId: _uid })
      .sort({ createdAt: -1 })
      .lean()
      .exec();
  }

  /** 3) ปรับสถานะ order (ยังไม่ยุ่ง payment) */
  async updateStatus(orderId: string, status: OrderStatus) {
    const _id = new Types.ObjectId(orderId);
    const doc = await this.orderModel
      .findOneAndUpdate({ _id }, { $set: { status } }, { new: true })
      .lean()
      .exec();
    if (!doc) throw new NotFoundException('Order not found');
    return doc;
  }
}
