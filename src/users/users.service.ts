import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, isValidObjectId } from 'mongoose';
import { User, UserDocument } from './users.schema';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcryptjs';
import { CartsService } from '../carts/carts.service'; // ← ปรับ path ให้ตรงโครงจริง

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly cartsService: CartsService,
  ) {}

  // ---------- Users ----------
  async createUser(dto: CreateUserDto) {
    const email = dto.email.toLowerCase().trim();
    if (await this.userModel.exists({ email })) {
      throw new ConflictException('Email already exists');
    }
    const passwordHash = await bcrypt.hash(dto.password, 10);

    const defaultProfile = {
      name: '',
      phone: '',
      // เพื่อเลี่ยง union-type/Date|null ให้ "ไม่ส่งฟิลด์" แทนการส่ง null
      // ถ้าอยากให้เป็น null จริง ๆ แนะนำปรับ schema ตามทางเลือก A
      // birthDate: null,
      avatarUrl: '',
    };

    const doc = await this.userModel.create({
      email,
      passwordHash,
      profile: defaultProfile,
      addresses: [],
    });

    // สร้าง/คืน cart ว่าง 1-1 ผ่าน CartsService (แทน this.cartModel)
    await this.cartsService.getOrCreateActiveCart(doc._id.toString());

    return doc.toObject();
  }

  async getUser(id: string) {
    if (!isValidObjectId(id)) throw new NotFoundException('User not found');
    const doc = await this.userModel.findById(id).lean().exec();
    if (!doc) throw new NotFoundException('User not found');
    return doc;
  }

  async listUsers() {
    return this.userModel
      .find({ deletedAt: null })
      .sort({ createdAt: -1 })
      .lean()
      .exec();
  }

  // ---------- Profile (embedded) ----------
  async getProfile(userId: string) {
    const _id = new Types.ObjectId(userId);
    const user = await this.userModel
      .findById(_id, { profile: 1 })
      .lean()
      .exec();
    if (!user) throw new NotFoundException('User not found');
    return user.profile ?? {};
  }

  async upsertProfile(
    userId: string,
    payload: Partial<{
      name: string;
      phone: string;
      birthDate: string;
      avatarUrl: string;
    }>,
  ) {
    const _id = new Types.ObjectId(userId);
    const $set: any = {};
    if (payload.name !== undefined) $set['profile.name'] = payload.name;
    if (payload.phone !== undefined) $set['profile.phone'] = payload.phone;
    if (payload.birthDate !== undefined)
      $set['profile.birthDate'] = payload.birthDate
        ? new Date(payload.birthDate)
        : null;
    if (payload.avatarUrl !== undefined)
      $set['profile.avatarUrl'] = payload.avatarUrl;

    const updated = await this.userModel
      .findOneAndUpdate(
        { _id },
        { $set },
        { new: true, projection: { profile: 1 } },
      )
      .lean()
      .exec();

    if (!updated) throw new NotFoundException('User not found');
    return updated.profile ?? {};
  }

  // ---------- Addresses (embedded array) ----------
  async listAddresses(userId: string) {
    const _id = new Types.ObjectId(userId);
    const user = await this.userModel
      .findById(_id, { addresses: 1 })
      .lean()
      .exec();
    if (!user) throw new NotFoundException('User not found');
    return user.addresses ?? [];
  }

  async createAddress(
    userId: string,
    payload: {
      label?: string;
      line1: string;
      province: string;
      postcode: string;
      isDefault?: boolean;
    },
  ) {
    const _id = new Types.ObjectId(userId);
    const addrId = new Types.ObjectId();
    if (payload.isDefault) {
      await this.userModel.updateOne(
        { _id },
        { $set: { 'addresses.$[].isDefault': false } },
      );
    }
    const newAddr = {
      _id: addrId,
      label: payload.label,
      line1: payload.line1,
      province: payload.province,
      postcode: payload.postcode,
      isDefault: !!payload.isDefault,
    };
    const res = await this.userModel.updateOne(
      { _id },
      { $push: { addresses: newAddr } },
    );
    if (res.matchedCount === 0) throw new NotFoundException('User not found');
    return newAddr;
  }

  async updateAddress(
    userId: string,
    addressId: string,
    payload: Partial<{
      label: string;
      line1: string;
      province: string;
      postcode: string;
      isDefault: boolean;
    }>,
  ) {
    const _uid = new Types.ObjectId(userId);
    const _aid = new Types.ObjectId(addressId);

    if (payload.isDefault === true) {
      await this.userModel.updateOne(
        { _id: _uid },
        { $set: { 'addresses.$[].isDefault': false } },
      );
    }

    const $set: any = {};
    if (payload.label !== undefined)
      $set['addresses.$[a].label'] = payload.label;
    if (payload.line1 !== undefined)
      $set['addresses.$[a].line1'] = payload.line1;
    if (payload.province !== undefined)
      $set['addresses.$[a].province'] = payload.province;
    if (payload.postcode !== undefined)
      $set['addresses.$[a].postcode'] = payload.postcode;
    if (payload.isDefault !== undefined)
      $set['addresses.$[a].isDefault'] = payload.isDefault;

    const upd = await this.userModel
      .findOneAndUpdate(
        { _id: _uid },
        { $set },
        {
          new: true,
          arrayFilters: [{ 'a._id': _aid }],
          projection: { addresses: 1 },
        },
      )
      .lean()
      .exec();

    if (!upd) throw new NotFoundException('User not found');

    const found = (upd.addresses ?? []).find(
      (x: any) => x._id?.toString() === _aid.toString(),
    );
    if (!found) throw new NotFoundException('Address not found');
    return found;
  }

  async removeAddress(userId: string, addressId: string) {
    const _uid = new Types.ObjectId(userId);
    const _aid = new Types.ObjectId(addressId);
    const res = await this.userModel.updateOne(
      { _id: _uid },
      { $pull: { addresses: { _id: _aid } } },
    );
    if (res.matchedCount === 0) throw new NotFoundException('User not found');
    if (res.modifiedCount === 0)
      throw new NotFoundException('Address not found');
    return { deleted: true };
  }

  async setDefaultAddress(userId: string, addressId: string) {
    const _uid = new Types.ObjectId(userId);
    const _aid = new Types.ObjectId(addressId);

    const user = await this.userModel
      .findOne({ _id: _uid, 'addresses._id': _aid }, { _id: 1 })
      .lean();
    if (!user) throw new NotFoundException('Address not found');

    await this.userModel.updateOne(
      { _id: _uid },
      { $set: { 'addresses.$[].isDefault': false } },
    );
    const r = await this.userModel.updateOne(
      { _id: _uid, 'addresses._id': _aid },
      { $set: { 'addresses.$.isDefault': true } },
    );
    if (r.modifiedCount === 0) throw new NotFoundException('Address not found');
    return { ok: true };
  }
}
