// products.service.ts
import { ConflictException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types, isValidObjectId } from 'mongoose';
import { CreateProductDto } from './dto/create-product.dto';
import { FindProductsQueryDto } from './dto/find-products.query';
import { Product, ProductDocument, ProductStatus } from './products.schema';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private readonly model: Model<ProductDocument>,
  ) {}

  async create(dto: CreateProductDto) {
    try {
      const doc = await this.model.create(dto);
      // คืน plain object เพื่อให้ controller ใช้ plainToInstance ได้สวย
      return doc.toObject();
    } catch (e: any) {
      // ดัก duplicate key (เช่น sku ซ้ำ)
      if (e?.code === 11000 && (e?.keyPattern?.sku || e?.keyValue?.sku)) {
        throw new ConflictException('SKU already exists');
      }
      throw e;
    }
  }

  async findAll(params?: FindProductsQueryDto) {
    const q: FilterQuery<ProductDocument> = {};

    if (params?.categoryId) {
      // กัน CastError และค้นด้วย ObjectId
      q.categoryId = new Types.ObjectId(params.categoryId);
    }
    if (params?.status) {
      q.status = params.status as ProductStatus;
    }

    return this.model
      .find(q)
      .sort({ updatedAt: -1 })
      .lean() // คืน plain objects
      .exec();
  }

  async findOneById(id: string) {
    if (!isValidObjectId(id)) return null; // ให้ controller โยน 404 เอง
    return this.model.findById(id).lean().exec();
  }
}
