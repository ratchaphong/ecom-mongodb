import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Post,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { CreateCategoryDto } from './dto/create-category.dto';
import { FindCategoriesQueryDto } from './dto/find-categories.query';
import { CategoryResponseDto } from './dto/category.response';
import { CategoriesService } from './categories.service';

@ApiTags('categories')
@UseInterceptors(ClassSerializerInterceptor)
@Controller('categories')
export class CategoriesController {
  constructor(private readonly service: CategoriesService) {}

  @Post()
  @ApiCreatedResponse({ type: CategoryResponseDto })
  async create(@Body() dto: CreateCategoryDto): Promise<CategoryResponseDto> {
    const doc = await this.service.create(dto);
    return plainToInstance(CategoryResponseDto, doc, {
      excludeExtraneousValues: true,
    });
  }

  @Get()
  @ApiOkResponse({ type: CategoryResponseDto, isArray: true })
  async list(
    @Query() query: FindCategoriesQueryDto,
  ): Promise<CategoryResponseDto[]> {
    const docs = await this.service.findAll(query);
    return plainToInstance(CategoryResponseDto, docs, {
      excludeExtraneousValues: true,
    });
  }
}
