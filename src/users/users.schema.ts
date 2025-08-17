import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

// ---------- Embedded subdocs ----------
@Schema({ _id: false })
export class ProfileEmbedded {
  @Prop() name?: string;
  @Prop() phone?: string;
  @Prop({ type: Date }) birthDate?: Date; // <-- ใส่ type ชัดเจน
  @Prop() avatarUrl?: string;
}
export const ProfileEmbeddedSchema =
  SchemaFactory.createForClass(ProfileEmbedded);

@Schema() // _id ของที่อยู่ให้เป็น ObjectId (Mongoose จะสร้างให้)
export class AddressEmbedded {
  @Prop() label?: string;
  @Prop({ required: true }) line1: string;
  @Prop({ required: true }) province: string;
  @Prop({ required: true }) postcode: string;
  @Prop({ default: false }) isDefault: boolean;
}
export const AddressEmbeddedSchema =
  SchemaFactory.createForClass(AddressEmbedded);

// ---------- Root document ----------
@Schema({ collection: 'users', timestamps: true, versionKey: false })
export class User {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ type: String, enum: Object.values(UserRole), default: UserRole.USER })
  role: UserRole;

  @Prop({ type: ProfileEmbeddedSchema, default: {} })
  profile: ProfileEmbedded;

  @Prop({ type: [AddressEmbeddedSchema], default: [] })
  addresses: (AddressEmbedded & { _id: Types.ObjectId })[];

  @Prop({ type: Date, default: null }) // <-- ใส่ type ชัดเจน
  deletedAt?: Date | null;
}
export const UserSchema = SchemaFactory.createForClass(User);

// Indexes
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ createdAt: -1 });
UserSchema.index({ role: 1, createdAt: -1 });
UserSchema.index({ deletedAt: 1, createdAt: -1 });
// UserSchema.index({ 'addresses.postcode': 1 }); // ถ้าจะค้นหาจาก postcode ใน array
