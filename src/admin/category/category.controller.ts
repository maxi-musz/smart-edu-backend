import { Controller, Get, Post, Query, Body, UseGuards, Request } from '@nestjs/common';
import { CategoryService } from './category.service';
import { JwtGuard } from '../../auth/guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateGenreDto } from './dto/create-genre.dto';
import { CreateLanguageDto } from './dto/create-language.dto';
import { CreateFormatDto } from './dto/create-format.dto';
import { CreateAgeRatingDto } from './dto/create-age-rating.dto';

@Controller('admin')
@UseGuards(JwtGuard)
@Roles('admin')
export class CategoryController {
    constructor(private readonly categoryService: CategoryService) {}

    @Get('category/all')
    async getAllCategories(
        @Request() req,
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 10,
        @Query('search') search?: string,
        @Query('storeId') storeId?: string
    ) {
        return this.categoryService.getAllCategories(req, Number(page), Number(limit), search, storeId);
    }

    @Post('category/add-new')
    async addCategory(
        @Body() body: CreateCategoryDto,
        @Request() req: any
    ) {
        return this.categoryService.addCategory(body, req);
    }

    @Get('genres/all')
    async getAllGenres() {
        return this.categoryService.getAllGenres();
    }

    @Post('genres/add-new')
    async addGenre(
        @Body() body: CreateGenreDto,
        @Request() req: any
    ) {
        return this.categoryService.addGenre(body, req);
    }

    @Get('languages/all')
    async getAllLanguages() {
        return this.categoryService.getAllLanguages();
    }

    @Post('languages/add-new')
    async addLanguage(
        @Body() body: CreateLanguageDto,
        @Request() req: any
    ) {
        return this.categoryService.addLanguage(body, req);
    }

    @Get('formats/all')
    async getAllFormats() {
        return this.categoryService.getAllFormats();
    }

    @Post('formats/add-new')
    async addFormat(
        @Body() body: CreateFormatDto,
        @Request() req: any
    ) {
        return this.categoryService.addFormat(body, req);
    }

    @Get('age-ratings/all')
    async getAllAgeRatings() {
        return this.categoryService.getAllAgeRatings();
    }

    @Post('age-ratings/add-new')
    async addAgeRating(
        @Body() body: CreateAgeRatingDto,
        @Request() req: any
    ) {
        return this.categoryService.addAgeRating(body, req);
    }

    @Get('metadata/all')
    async getAllMetadata(@Request() req) {
        return this.categoryService.getAllMetadata(req);
    }
}
