import { Controller, Get, Post, Query, Body, UseGuards, Request } from '@nestjs/common';
import { CategoryService } from './category.service';
import { JwtGuard } from '../../auth/guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CreateCategoryDto } from './dto/create-category.dto';

@Controller('admin/category')
@UseGuards(JwtGuard)
@Roles('admin')
export class CategoryController {
    constructor(private readonly categoryService: CategoryService) {}

    @Get('all')
    async getAllCategories(
        @Request() req,
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 10,
        @Query('search') search?: string,
        @Query('storeId') storeId?: string
    ) {
        return this.categoryService.getAllCategories(req, Number(page), Number(limit), search, storeId);
    }

    @Post('add-new')
    async addCategory(
        @Body() body: CreateCategoryDto,
        @Request() req: any
    ) {
        return this.categoryService.addCategory(body, req);
    }
}
