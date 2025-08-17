import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export enum ProductStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export type ProductDocument = HydratedDocument<Product>;

// ---------- Subdocument ----------
@Schema({ _id: false })
export class ProductImage {
  @Prop({ required: true }) url: string;
  @Prop({ default: 0 }) position: number;
  @Prop({ default: false }) isPrimary: boolean;
}
export const ProductImageSchema = SchemaFactory.createForClass(ProductImage);

// ---------- Root document ----------
@Schema({ timestamps: true, collection: 'products' })
export class Product {
  @Prop({ type: Types.ObjectId, ref: 'Category', index: true, required: true })
  categoryId: Types.ObjectId;

  @Prop({ unique: true, index: true, required: true })
  sku: string;

  @Prop({ index: true, required: true })
  name: string;

  // ✅ ใช้ enum แบบ type-safe (ไม่มี any)
  @Prop({
    type: String,
    enum: Object.values(ProductStatus),
    default: ProductStatus.ACTIVE,
    index: true,
  })
  status: ProductStatus;

  @Prop({ type: Number, min: 0, required: true })
  price: number;

  @Prop({ type: Number, min: 0, required: true })
  stockQty: number;

  @Prop() description?: string;
  @Prop() seoTitle?: string;
  @Prop() seoDesc?: string;

  @Prop({ type: [ProductImageSchema], default: [] })
  images: ProductImage[];
}

export const ProductSchema = SchemaFactory.createForClass(Product);

// Indexes ที่ใช้บ่อย
ProductSchema.index({ categoryId: 1, status: 1, updatedAt: -1 });
ProductSchema.index({ categoryId: 1, price: 1 });
// ProductSchema.index({ name: 'text', description: 'text' }); // ถ้าค้นหาแบบ contains
