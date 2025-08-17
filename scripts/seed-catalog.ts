// scripts/seed-catalog.ts
import 'dotenv/config';
import mongoose, { Types } from 'mongoose';

// ===== import schemas (ปรับ pathให้ตรงโปรเจกต์คุณ) =====
// ตัวอย่างถ้าอยู่ใต้ src/modules/...
// import { Category, CategorySchema } from '../src/modules/categories/category.schema';
// import { Product, ProductSchema, ProductStatus } from '../src/modules/products/products.schema';

// ตัวอย่างถ้าโครงคุณเป็น src/categories, src/products
import { Category, CategorySchema } from '../src/categories/category.schema';
import {
  Product,
  ProductSchema,
  ProductStatus,
} from '../src/products/products.schema';

const MONGO_URI =
  process.env.MONGO_URI ??
  'mongodb://root:example@localhost:27017/mydb?authSource=admin';

// ===== mock data (แก้ได้ตามต้องการ/โยนจาก ENV เป็น JSON ก็ได้) =====
const CATEGORIES: Array<{ name: string; slug: string }> = [
  { name: 'Keyboards', slug: 'keyboards' },
  { name: 'Mice', slug: 'mice' },
  { name: 'Headsets', slug: 'headsets' },
];

type ProductSeed = {
  sku: string;
  name: string;
  categorySlug: string;
  price: number;
  stockQty: number;
  description?: string;
  images?: { url: string; position?: number; isPrimary?: boolean }[];
};

const PRODUCTS: ProductSeed[] = [
  {
    sku: 'KB-001',
    name: 'Keyboard 75%',
    categorySlug: 'keyboards',
    price: 1990,
    stockQty: 100,
    description: 'Compact 75% keyboard',
    images: [
      { url: 'https://example.com/img/keyboard75.jpg', isPrimary: true },
    ],
  },
  {
    sku: 'KB-002',
    name: 'Keyboard 60%',
    categorySlug: 'keyboards',
    price: 1590,
    stockQty: 80,
  },
  {
    sku: 'MS-001',
    name: 'Mouse Wireless',
    categorySlug: 'mice',
    price: 790,
    stockQty: 120,
  },
  {
    sku: 'HS-001',
    name: 'Headset X',
    categorySlug: 'headsets',
    price: 1290,
    stockQty: 60,
  },
];

// ===== Lean types เพื่อ TS ชัดเจน =====
type CategoryLean = {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  createdAt?: Date;
  updatedAt?: Date;
};

type ProductLean = {
  _id: Types.ObjectId;
  categoryId: Types.ObjectId;
  sku: string;
  name: string;
  status: ProductStatus;
  price: number;
  stockQty: number;
  description?: string;
  seoTitle?: string;
  seoDesc?: string;
  images?: { url: string; position?: number; isPrimary?: boolean }[];
  createdAt?: Date;
  updatedAt?: Date;
};

async function main() {
  await mongoose.connect(MONGO_URI);
  mongoose.set('strictQuery', true);
  console.log('[seed] connect ok');

  // ป้องกัน OverwriteModelError
  const CategoryModel =
    (mongoose.models[Category.name] as mongoose.Model<any>) ??
    mongoose.model(Category.name, CategorySchema);
  const ProductModel =
    (mongoose.models[Product.name] as mongoose.Model<any>) ??
    mongoose.model(Product.name, ProductSchema);

  // === 1) Ensure Categories (idempotent) ===
  const slugToId = new Map<string, Types.ObjectId>();
  for (const c of CATEGORIES) {
    const existed = await CategoryModel.findOne({ slug: c.slug })
      .lean<CategoryLean>()
      .exec();
    if (!existed) {
      const created = await CategoryModel.create({
        name: c.name,
        slug: c.slug,
      });
      const obj = created.toObject() as CategoryLean;
      slugToId.set(c.slug, obj._id);
      console.log(`[seed] category created: ${c.slug}`);
    } else {
      slugToId.set(c.slug, existed._id);
      // ถ้าอยาก patch ชื่อเฉพาะเคสที่ว่าง/ไม่มีค่อยเปิดบรรทัดล่าง
      // if (!existed.name && c.name) await CategoryModel.updateOne({ _id: existed._id }, { $set: { name: c.name } });
      console.log(`[seed] category exists: ${c.slug}`);
    }
  }

  // === 2) Ensure Products (idempotent + ไม่ทับของเดิม) ===
  for (const p of PRODUCTS) {
    const catId = slugToId.get(p.categorySlug);
    if (!catId) {
      console.warn(
        `[seed] skip product ${p.sku}: category slug "${p.categorySlug}" not found`,
      );
      continue;
    }

    let prod = await ProductModel.findOne({ sku: p.sku })
      .lean<ProductLean>()
      .exec();

    if (!prod) {
      // สร้างใหม่ครบถ้วน
      const created = await ProductModel.create({
        categoryId: catId,
        sku: p.sku,
        name: p.name,
        status: ProductStatus.ACTIVE,
        price: p.price,
        stockQty: p.stockQty,
        description: p.description,
        images: p.images ?? [],
      });
      prod = created.toObject() as ProductLean;
      console.log(`[seed] product created: ${p.sku}`);
    } else {
      // อัปเดตเฉพาะฟิลด์ที่ "ยังไม่มี" เท่านั้น → ไม่ทับค่าที่ผู้ใช้แก้เอง
      const $set: Record<string, any> = {};
      if (!prod.categoryId) $set['categoryId'] = catId;
      if (!prod.name && p.name) $set['name'] = p.name;
      if (prod.price === undefined || prod.price === null)
        $set['price'] = p.price;
      if (prod.stockQty === undefined || prod.stockQty === null)
        $set['stockQty'] = p.stockQty;
      if (!prod.description && p.description)
        $set['description'] = p.description;
      if ((!prod.images || prod.images.length === 0) && p.images?.length)
        $set['images'] = p.images;
      if (!prod.status) $set['status'] = ProductStatus.ACTIVE;

      if (Object.keys($set).length > 0) {
        await ProductModel.updateOne({ _id: prod._id }, { $set }).exec();
        console.log(`[seed] product patched (missing fields only): ${p.sku}`);
      } else {
        console.log(`[seed] product exists: ${p.sku}`);
      }
    }
  }

  await mongoose.disconnect();
  console.log('[seed] done');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
