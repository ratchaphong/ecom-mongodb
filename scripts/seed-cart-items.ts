// scripts/seed-cart-items.ts
import 'dotenv/config';
import mongoose, { Types } from 'mongoose';

// --- Schemas (แก้ path ให้ตรงโปรเจกต์คุณ) ---
import { User, UserSchema } from '../src/users/users.schema';
import { Cart, CartSchema } from '../src/carts/carts.schema';
import { CartItem, CartItemSchema } from '../src/cart-items/cart-items.schema';
import {
  Product,
  ProductSchema,
  ProductStatus,
} from '../src/products/products.schema';

const MONGO_URI =
  process.env.MONGO_URI ??
  'mongodb://root:example@localhost:27017/mydb?authSource=admin';

// --- ใช้ user เดิมจาก seed ก่อนหน้า ---
const SEED_EMAIL = (process.env.SEED_EMAIL ?? 'seed.user@example.com')
  .toLowerCase()
  .trim();

// --- รายการสินค้าที่จะใส่ใน cart (อ่านจาก ENV ได้) ---
type SeedItem = { sku: string; qty: number };
const DEFAULT_ITEMS: SeedItem[] = [
  { sku: 'KB-001', qty: 2 },
  { sku: 'MS-001', qty: 1 },
];
const SEED_ITEMS: SeedItem[] = (() => {
  const raw = process.env.SEED_CART_ITEMS_JSON; // ตัวเลือก: ใส่เป็น JSON string ใน .env
  if (!raw) return DEFAULT_ITEMS;
  try {
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) {
      return arr
        .map((x) => ({
          sku: String(x.sku),
          qty: Math.max(1, Number(x.qty) || 1),
        }))
        .slice(0, 50);
    }
  } catch (_) {}
  return DEFAULT_ITEMS;
})();

// --- Lean types เล็ก ๆ สำหรับ TS ให้ชัด ---
type UserLean = { _id: Types.ObjectId; email: string };
type CartLean = {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  status: 'ACTIVE' | 'CHECKED_OUT';
};
type ProductLean = {
  _id: Types.ObjectId;
  sku: string;
  status: ProductStatus;
  stockQty?: number;
};
type CartItemLean = {
  _id: Types.ObjectId;
  cartId: Types.ObjectId;
  productId: Types.ObjectId;
  qty: number;
};

async function main() {
  await mongoose.connect(MONGO_URI);
  mongoose.set('strictQuery', true);
  console.log('[seed] connect ok');

  // ป้องกัน OverwriteModelError
  const UserModel =
    (mongoose.models[User.name] as mongoose.Model<any>) ??
    mongoose.model(User.name, UserSchema);
  const CartModel =
    (mongoose.models[Cart.name] as mongoose.Model<any>) ??
    mongoose.model(Cart.name, CartSchema);
  const CartItemModel =
    (mongoose.models[CartItem.name] as mongoose.Model<any>) ??
    mongoose.model(CartItem.name, CartItemSchema);
  const ProductModel =
    (mongoose.models[Product.name] as mongoose.Model<any>) ??
    mongoose.model(Product.name, ProductSchema);

  // 1) หา user เดิม
  const user = await UserModel.findOne({ email: SEED_EMAIL })
    .lean<UserLean>()
    .exec();
  if (!user) {
    throw new Error(
      `[seed] user not found for email ${SEED_EMAIL} — ให้รัน scripts/seed-user.ts ก่อน`,
    );
  }
  console.log('[seed] user:', user._id.toString(), user.email);

  // 2) ensure cart (ACTIVE)
  const cart = await CartModel.findOneAndUpdate(
    { userId: user._id },
    { $setOnInsert: { userId: user._id, status: 'ACTIVE' } },
    { upsert: true, new: true },
  )
    .lean<CartLean>()
    .exec();
  console.log('[seed] cart:', cart!._id.toString(), cart!.status);

  // 3) ใส่ cart_items สองตัว (idempotent → ใช้ $set qty ให้ค่าตาม seed)
  for (const item of SEED_ITEMS) {
    const prod = await ProductModel.findOne(
      { sku: item.sku },
      { _id: 1, status: 1, stockQty: 1 },
    )
      .lean<ProductLean>()
      .exec();

    if (!prod) {
      console.warn(`[seed] skip: product sku "${item.sku}" not found`);
      continue;
    }
    if (prod.status !== ProductStatus.ACTIVE) {
      console.warn(`[seed] skip: product "${item.sku}" not ACTIVE`);
      continue;
    }

    const stock = typeof prod.stockQty === 'number' ? prod.stockQty : Infinity;
    const targetQty = Math.max(1, Math.min(item.qty, stock));
    if (targetQty < 1) {
      console.warn(`[seed] skip: product "${item.sku}" out of stock`);
      continue;
    }

    const doc = await CartItemModel.findOneAndUpdate(
      { cartId: cart!._id, productId: prod._id },
      { $set: { qty: targetQty } }, // idempotent: set ให้เท่าที่กำหนด
      { upsert: true, new: true, setDefaultsOnInsert: true },
    )
      .lean<CartItemLean>()
      .exec();

    console.log(
      `[seed] cart-item ok: sku=${item.sku} qty=${doc!.qty} id=${doc!._id.toString()}`,
    );
  }

  await mongoose.disconnect();
  console.log('[seed] done');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
