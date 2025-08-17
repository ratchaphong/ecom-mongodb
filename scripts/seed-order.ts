// scripts/seed-order.ts
import 'dotenv/config';
import mongoose, { Types } from 'mongoose';

// ===== import schemas จากโปรเจกต์ (ปรับ path ให้ตรงของพี่) =====
import { Order, OrderSchema, OrderStatus } from '../src/orders/orders.schema';
import { Cart, CartSchema } from '../src/carts/carts.schema';
import { CartItem, CartItemSchema } from '../src/cart-items/cart-items.schema';
import { Product, ProductSchema } from '../src/products/products.schema';
import {
  Payment,
  PaymentSchema,
  PaymentStatus,
} from '../src/payments/payments.schema';

const MONGO_URI =
  process.env.MONGO_URI ??
  'mongodb://root:example@localhost:27017/mydb?authSource=admin';

// ถ้ามีเมลของ user seed ไว้ ให้ระบุ (default คือ seed user ก่อนหน้า)
const SEED_EMAIL = (process.env.SEED_EMAIL ?? 'seed.user@example.com')
  .toLowerCase()
  .trim();

/* ================= Lean types ================= */
type UserIdPick = { _id: Types.ObjectId };

type CartLean = {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  status: 'ACTIVE' | 'CHECKED_OUT';
  createdAt: Date;
  updatedAt: Date;
};

type CartItemLean = {
  _id: Types.ObjectId;
  cartId: Types.ObjectId;
  productId: Types.ObjectId;
  qty: number;
  createdAt: Date;
  updatedAt: Date;
};

type ProductLean = {
  _id: Types.ObjectId;
  name: string;
  price: number;
};

type OrderItemEmbeddedLean = {
  productId: Types.ObjectId;
  name: string;
  priceAtPurchase: number;
  qty: number;
};

type OrderLean = {
  _id: Types.ObjectId;
  orderNo: string;
  userId: Types.ObjectId;
  status: 'PENDING' | 'PAID' | 'CANCELLED' | 'SHIPPED' | 'DELIVERED';
  items: OrderItemEmbeddedLean[];
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
};

type PaymentLean = {
  _id: Types.ObjectId;
  orderId: Types.ObjectId;
  amount: number;
  status: 'PENDING' | 'SUCCEEDED' | 'FAILED';
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};
/* ============================================== */

// ========== util ==========
function genOrderNo(now = new Date()): string {
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

async function main() {
  await mongoose.connect(MONGO_URI);
  mongoose.set('strictQuery', true);

  // register models ป้องกัน OverwriteModelError
  const OrderModel =
    (mongoose.models[Order.name] as mongoose.Model<any>) ??
    mongoose.model(Order.name, OrderSchema);
  const CartModel =
    (mongoose.models[Cart.name] as mongoose.Model<any>) ??
    mongoose.model(Cart.name, CartSchema);
  const CartItemModel =
    (mongoose.models[CartItem.name] as mongoose.Model<any>) ??
    mongoose.model(CartItem.name, CartItemSchema);
  const ProductModel =
    (mongoose.models[Product.name] as mongoose.Model<any>) ??
    mongoose.model(Product.name, ProductSchema);
  const PaymentModel =
    (mongoose.models[Payment.name] as mongoose.Model<any>) ??
    mongoose.model(Payment.name, PaymentSchema);

  console.log('[seed-order] connect ok');

  // 1) หา user จาก email → หา cart ACTIVE ของเขา
  const user = await mongoose.connection
    .collection('users')
    .findOne<UserIdPick>({ email: SEED_EMAIL }, { projection: { _id: 1 } });

  if (!user?._id) {
    throw new Error(
      `[seed-order] user not found for email: ${SEED_EMAIL} — โปรดรัน seed-user ก่อน`,
    );
  }

  const cart = await CartModel.findOne({ userId: user._id, status: 'ACTIVE' })
    .lean<CartLean>()
    .exec();

  if (!cart) {
    throw new Error(
      '[seed-order] Active cart not found — โปรดแน่ใจว่ามี cart ของ user นี้และสถานะ ACTIVE',
    );
  }

  const items = await CartItemModel.find({ cartId: cart._id })
    .lean<CartItemLean[]>()
    .exec();

  if (!items.length) {
    throw new Error(
      '[seed-order] Cart is empty — โปรดรัน seed-cart-items เพื่อใส่สินค้าในตะกร้าก่อน',
    );
  }

  // 2) ดึง snapshot products
  const productIds = items.map((i) => i.productId);
  const products = await ProductModel.find({ _id: { $in: productIds } })
    .lean<ProductLean[]>()
    .exec();

  const pMap = new Map<string, ProductLean>();
  for (const p of products) pMap.set(p._id.toString(), p);

  const embedded: OrderItemEmbeddedLean[] = [];
  let total = 0;

  for (const i of items) {
    const p = pMap.get(i.productId.toString());
    if (!p) {
      throw new Error(
        `[seed-order] Product not found in master: ${i.productId}`,
      );
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
    throw new Error('[seed-order] No valid cart items to checkout');
  }

  const orderNo = genOrderNo();

  // 3) สร้าง order + เคลียร์ cart_items + ปิด cart
  const created = await OrderModel.create({
    orderNo,
    userId: user._id,
    status: OrderStatus.PENDING,
    items: embedded,
    totalAmount: total,
  });

  // 3.1) สร้าง payment(PENDING) สำหรับ order นี้
  const paymentCreated = await PaymentModel.create({
    orderId: created._id,
    amount: total,
    status: PaymentStatus.PENDING,
    paidAt: null,
  });

  // 3.2) เคลียร์ cart items + ปิด cart
  await CartItemModel.deleteMany({ cartId: cart._id }).exec();
  await CartModel.updateOne(
    { _id: cart._id },
    { $set: { status: 'CHECKED_OUT' } },
  ).exec();

  // log
  const createdObj: OrderLean = created.toObject();
  const paymentObj: PaymentLean = paymentCreated.toObject();

  console.log('[seed-order] created order:', {
    orderNo: createdObj.orderNo,
    orderId: createdObj._id.toString(),
    userId: createdObj.userId.toString(),
    totalAmount: createdObj.totalAmount,
    items: createdObj.items.map((x) => ({
      productId: x.productId.toString(),
      name: x.name,
      priceAtPurchase: x.priceAtPurchase,
      qty: x.qty,
    })),
  });

  console.log('[seed-order] created payment:', {
    paymentId: paymentObj._id.toString(),
    orderId: paymentObj.orderId.toString(),
    amount: paymentObj.amount,
    status: paymentObj.status,
    paidAt: paymentObj.paidAt,
  });

  await mongoose.disconnect();
  console.log('[seed-order] done');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
