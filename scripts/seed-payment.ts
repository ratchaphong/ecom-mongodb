// scripts/seed-payment.ts
import 'dotenv/config';
import mongoose, { Types } from 'mongoose';

import {
  Payment,
  PaymentSchema,
  PaymentStatus,
} from '../src/payments/payments.schema';
import { Order, OrderSchema, OrderStatus } from '../src/orders/orders.schema';
import { Cart, CartSchema, CartStatus } from '../src/carts/carts.schema';

const MONGO_URI =
  process.env.MONGO_URI ??
  'mongodb://root:example@localhost:27017/mydb?authSource=admin';

const SEED_EMAIL = (process.env.SEED_EMAIL ?? 'seed.user@example.com')
  .toLowerCase()
  .trim();
const SEED_ORDER_NO = process.env.SEED_ORDER_NO; // optional
const SEED_PAYMENT_STATUS =
  (process.env.SEED_PAYMENT_STATUS as keyof typeof PaymentStatus) ??
  'SUCCEEDED';

/* ============== lean types ============== */
type UserIdPick = { _id: Types.ObjectId };
type OrderLean = {
  _id: Types.ObjectId;
  orderNo: string;
  userId: Types.ObjectId;
  status: 'PENDING' | 'PAID' | 'CANCELLED' | 'SHIPPED' | 'DELIVERED';
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
type CartLean = {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  status: 'ACTIVE' | 'CHECKED_OUT';
  createdAt: Date;
  updatedAt: Date;
};
/* ======================================== */

function coercePaymentStatus(s: string): PaymentStatus {
  if (s === 'PENDING' || s === 'SUCCEEDED' || s === 'FAILED')
    return s as PaymentStatus;
  return PaymentStatus.SUCCEEDED;
}

async function main() {
  await mongoose.connect(MONGO_URI);
  mongoose.set('strictQuery', true);

  const PaymentModel =
    (mongoose.models[Payment.name] as mongoose.Model<any>) ??
    mongoose.model(Payment.name, PaymentSchema);
  const OrderModel =
    (mongoose.models[Order.name] as mongoose.Model<any>) ??
    mongoose.model(Order.name, OrderSchema);
  const CartModel =
    (mongoose.models[Cart.name] as mongoose.Model<any>) ??
    mongoose.model(Cart.name, CartSchema);

  console.log('[seed-payment] connect ok');

  // 1) user
  const user = await mongoose.connection
    .collection('users')
    .findOne<UserIdPick>({ email: SEED_EMAIL }, { projection: { _id: 1 } });

  if (!user?._id) {
    throw new Error(
      `[seed-payment] user not found for email: ${SEED_EMAIL} — โปรดรัน seed-user ก่อน`,
    );
  }

  // 2) order (by orderNo or latest)
  let order: OrderLean | null = null;
  if (SEED_ORDER_NO) {
    order = await OrderModel.findOne({
      userId: user._id,
      orderNo: SEED_ORDER_NO,
    })
      .lean<OrderLean>()
      .exec();
  }
  if (!order) {
    order = await OrderModel.findOne({ userId: user._id })
      .sort({ createdAt: -1 })
      .lean<OrderLean>()
      .exec();
  }
  if (!order) throw new Error('[seed-payment] order not found for this user');

  // 3) payment for this order
  let payment = await PaymentModel.findOne({ orderId: order._id })
    .lean<PaymentLean>()
    .exec();
  if (!payment) {
    const created = await PaymentModel.create({
      orderId: order._id,
      amount: order.totalAmount,
      status: PaymentStatus.PENDING,
      paidAt: null,
    });
    payment = created.toObject() as PaymentLean;
    console.log('[seed-payment] created payment:', payment._id.toString());
  }

  // 4) update payment status
  const newStatus = coercePaymentStatus(SEED_PAYMENT_STATUS);
  const paidAt = newStatus === PaymentStatus.SUCCEEDED ? new Date() : null;

  const updatedPayment = await PaymentModel.findOneAndUpdate(
    { _id: payment._id },
    {
      $set: {
        status: newStatus,
        paidAt,
        amount: order.totalAmount, // sync amount to order total
      },
    },
    { new: true },
  )
    .lean<PaymentLean>()
    .exec();

  // 5) if SUCCEEDED → mark order PAID + reopen cart ACTIVE
  if (newStatus === PaymentStatus.SUCCEEDED) {
    if (order.status !== OrderStatus.PAID) {
      await OrderModel.updateOne(
        { _id: order._id },
        { $set: { status: OrderStatus.PAID } },
      ).exec();
    }
    await CartModel.updateOne(
      { userId: order.userId },
      {
        $set: { status: CartStatus.ACTIVE },
        $setOnInsert: { userId: order.userId },
      },
      { upsert: true },
    ).exec();
  }

  // 6) logs
  const cartAfter = await CartModel.findOne({ userId: order.userId })
    .lean<CartLean>()
    .exec();
  const orderAfter = await OrderModel.findById(order._id)
    .lean<OrderLean>()
    .exec();

  console.log('[seed-payment] result:', {
    orderNo: order.orderNo,
    orderId: order._id.toString(),
    orderStatus: orderAfter?.status,
    paymentId: updatedPayment!._id.toString(),
    paymentStatus: updatedPayment!.status,
    paidAt: updatedPayment!.paidAt,
    cartStatus: cartAfter?.status,
  });

  await mongoose.disconnect();
  console.log('[seed-payment] done');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
