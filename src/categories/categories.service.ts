import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types, isValidObjectId } from 'mongoose';
import { Category, CategoryDocument } from './category.schema';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { FindCategoriesQueryDto } from './dto/find-categories.query';
import { Product, ProductDocument } from '../products/products.schema'; // ใช้เช็คก่อนลบ

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name) private readonly model: Model<CategoryDocument>,
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
  ) {}

  private slugify(name: string) {
    return name
      .toLowerCase()
      .trim()
      .replace(/[_\s]+/g, '-')
      .replace(/[^a-z0-9\-ก-๙]+/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  private async uniqueSlug(name: string, excludeId?: Types.ObjectId) {
    const base = this.slugify(name) || 'category';
    let slug = base;
    let i = 1;
    while (
      await this.model.exists({
        slug,
        ...(excludeId ? { _id: { $ne: excludeId } } : {}),
      })
    ) {
      i += 1;
      slug = `${base}-${i}`;
    }
    return slug;
  }

  async create(dto: CreateCategoryDto) {
    const slug = await this.uniqueSlug(dto.name);
    try {
      const doc = await this.model.create({
        name: dto.name.trim(),
        slug,
      });
      return doc.toObject();
    } catch (e: any) {
      if (e?.code === 11000)
        throw new ConflictException('Category name or slug already exists');
      throw e;
    }
  }

  async findAll(qry: FindCategoriesQueryDto) {
    const q: FilterQuery<CategoryDocument> = {};
    if (qry.q) q.name = { $regex: qry.q, $options: 'i' };
    return this.model.find(q).sort({ name: 1 }).lean().exec();
  }

  async findOneById(id: string) {
    if (!isValidObjectId(id)) throw new NotFoundException('Category not found');
    const doc = await this.model.findById(id).lean().exec();
    if (!doc) throw new NotFoundException('Category not found');
    return doc;
  }

  async update(id: string, dto: UpdateCategoryDto) {
    if (!isValidObjectId(id)) throw new NotFoundException('Category not found');
    const _id = new Types.ObjectId(id);

    const update: any = {};
    if (dto.name) {
      update.name = dto.name.trim();
      update.slug = await this.uniqueSlug(update.name, _id);
    }

    try {
      const doc = await this.model
        .findByIdAndUpdate(_id, update, { new: true })
        .lean()
        .exec();
      if (!doc) throw new NotFoundException('Category not found');
      return doc;
    } catch (e: any) {
      if (e?.code === 11000)
        throw new ConflictException('Category name or slug already exists');
      throw e;
    }
  }

  async remove(id: string) {
    if (!isValidObjectId(id)) throw new NotFoundException('Category not found');
    const _id = new Types.ObjectId(id);

    const inUse = await this.productModel.exists({ categoryId: _id });
    if (inUse) throw new ConflictException('Category is in use by products');

    const res = await this.model.findByIdAndDelete(_id).lean().exec();
    if (!res) throw new NotFoundException('Category not found');
    return { deleted: true };
  }
}
