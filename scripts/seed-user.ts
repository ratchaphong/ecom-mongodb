// scripts/seed-user.ts
import 'dotenv/config';
import mongoose, { Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';

// ===== import schemas (ปรับ path ให้ตรงโปรเจกต์) =====
import { User, UserRole, UserSchema } from '../src/users/users.schema';
import { Cart, CartSchema } from '../src/carts/carts.schema';

const MONGO_URI =
  process.env.MONGO_URI ??
  'mongodb://root:example@localhost:27017/mydb?authSource=admin';

// ---- mock data (แก้ได้จาก ENV) ----
const SEED_EMAIL = (process.env.SEED_EMAIL ?? 'seed.user@example.com')
  .toLowerCase()
  .trim();
const SEED_PASSWORD = process.env.SEED_PASSWORD ?? 'P@ssw0rd';
const SEED_PROFILE = {
  name: process.env.SEED_PROFILE_NAME ?? 'Seed User',
  phone: process.env.SEED_PROFILE_PHONE ?? '0800000000',
  birthDate: process.env.SEED_PROFILE_BIRTHDATE ?? '1999-01-01',
  avatarUrl:
    process.env.SEED_PROFILE_AVATAR ?? 'https://cdn.example.com/avatar.jpg',
};
const SEED_ADDRESS = {
  label: process.env.SEED_ADDR_LABEL ?? 'บ้าน',
  line1: process.env.SEED_ADDR_LINE1 ?? '123/4',
  province: process.env.SEED_ADDR_PROVINCE ?? 'กรุงเทพฯ',
  postcode: process.env.SEED_ADDR_POSTCODE ?? '10220',
  isDefault: true,
};

// ===== Lean types ชัดเจน =====
type AddressLean = {
  _id: Types.ObjectId;
  label?: string;
  line1: string;
  province: string;
  postcode: string;
  isDefault: boolean;
};

type ProfileLean = {
  name?: string;
  phone?: string;
  birthDate?: Date;
  avatarUrl?: string;
};

type UserLean = {
  _id: Types.ObjectId;
  email: string;
  passwordHash: string;
  role: UserRole | 'USER' | 'ADMIN';
  profile?: ProfileLean;
  addresses?: AddressLean[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
};

type CartLean = {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  status: 'ACTIVE' | 'CHECKED_OUT';
  createdAt: Date;
  updatedAt: Date;
};

async function ensureUserAndCart() {
  await mongoose.connect(MONGO_URI);
  mongoose.set('strictQuery', true);

  // register models (กัน OverwriteModelError)
  const UserModel =
    (mongoose.models[User.name] as mongoose.Model<any>) ??
    mongoose.model(User.name, UserSchema);
  const CartModel =
    (mongoose.models[Cart.name] as mongoose.Model<any>) ??
    mongoose.model(Cart.name, CartSchema);

  console.log('[seed] connect ok');

  // 1) หา/สร้างผู้ใช้
  let user = await UserModel.findOne({ email: SEED_EMAIL })
    .lean<UserLean>()
    .exec();

  if (!user) {
    const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);
    const birthDate = SEED_PROFILE.birthDate
      ? new Date(SEED_PROFILE.birthDate)
      : undefined;

    const created = await UserModel.create({
      email: SEED_EMAIL,
      passwordHash,
      role: UserRole.USER,
      profile: {
        name: SEED_PROFILE.name,
        phone: SEED_PROFILE.phone,
        birthDate,
        avatarUrl: SEED_PROFILE.avatarUrl,
      },
      addresses: [
        {
          _id: new Types.ObjectId(),
          ...SEED_ADDRESS,
        },
      ],
    });

    user = created.toObject() as UserLean; // 👈 ให้ type ตรงกับ lean
    console.log('[seed] user created:', user._id.toString());
  } else {
    console.log('[seed] user exists:', user._id.toString());

    // 1.1) อัปเดตเฉพาะฟิลด์โปรไฟล์ที่ยังว่าง (ไม่ทับของเดิม)
    const $set: Record<string, any> = {};
    if (!user.profile?.name && SEED_PROFILE.name)
      $set['profile.name'] = SEED_PROFILE.name;
    if (!user.profile?.phone && SEED_PROFILE.phone)
      $set['profile.phone'] = SEED_PROFILE.phone;
    if (!user.profile?.birthDate && SEED_PROFILE.birthDate)
      $set['profile.birthDate'] = new Date(SEED_PROFILE.birthDate);
    if (!user.profile?.avatarUrl && SEED_PROFILE.avatarUrl)
      $set['profile.avatarUrl'] = SEED_PROFILE.avatarUrl;

    if (Object.keys($set).length) {
      await UserModel.updateOne({ _id: user._id }, { $set }).exec();
      console.log('[seed] user profile patched');
    }

    // 1.2) ถ้าไม่มี address key เดียวกัน (line1+province+postcode) ให้เพิ่ม
    const uAfter = await UserModel.findById(user._id, { addresses: 1 })
      .lean<{ _id: Types.ObjectId; addresses?: AddressLean[] }>()
      .exec();

    const existsAddr = (uAfter?.addresses ?? []).some(
      (a) =>
        (a.line1 ?? '') === SEED_ADDRESS.line1 &&
        (a.province ?? '') === SEED_ADDRESS.province &&
        (a.postcode ?? '') === SEED_ADDRESS.postcode,
    );

    if (!existsAddr) {
      if (SEED_ADDRESS.isDefault) {
        await UserModel.updateOne(
          { _id: user._id },
          { $set: { 'addresses.$[].isDefault': false } },
        ).exec();
      }
      await UserModel.updateOne(
        { _id: user._id },
        {
          $push: { addresses: { _id: new Types.ObjectId(), ...SEED_ADDRESS } },
        },
      ).exec();
      console.log('[seed] address pushed');
    } else if (SEED_ADDRESS.isDefault) {
      // ตั้ง default ให้ address ที่ตรง key
      const addrDoc = (uAfter?.addresses ?? []).find(
        (a) =>
          (a.line1 ?? '') === SEED_ADDRESS.line1 &&
          (a.province ?? '') === SEED_ADDRESS.province &&
          (a.postcode ?? '') === SEED_ADDRESS.postcode,
      );
      if (addrDoc && !addrDoc.isDefault) {
        await UserModel.updateOne(
          { _id: user._id },
          { $set: { 'addresses.$[].isDefault': false } },
        ).exec();
        await UserModel.updateOne(
          { _id: user._id, 'addresses._id': addrDoc._id },
          { $set: { 'addresses.$.isDefault': true } },
        ).exec();
        console.log('[seed] address set as default');
      }
    }
  }

  // 2) ensure cart (upsert by userId) — ไม่กระทบ collection อื่น
  const cart = await CartModel.findOneAndUpdate(
    { userId: user!._id },
    { $setOnInsert: { userId: user!._id, status: 'ACTIVE' } },
    { upsert: true, new: true },
  )
    .lean<CartLean>()
    .exec();

  // findOneAndUpdate + upsert + new จะได้ doc เสมอ แต่ TS ให้เป็น CartLean | null -> assert
  console.log('[seed] cart ok:', (cart!._id as Types.ObjectId).toString());

  await mongoose.disconnect();
  console.log('[seed] done');
}

ensureUserAndCart().catch((e) => {
  console.error(e);
  process.exit(1);
});
