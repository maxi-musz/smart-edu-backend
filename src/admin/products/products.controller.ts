import { Controller, Get, Param, Query, Put, UseGuards, Request } from '@nestjs/common';
import { ProductsService } from './products.service';
import { JwtGuard } from '../../auth/guard';
import { GetProductsDto } from './dto/get-products.dto';

@Controller('admin/products')
@UseGuards(JwtGuard)
export class ProductsController {
    constructor(private productsService: ProductsService) {}

    @Get('dashboard')
    async getProductDashboard(
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 10
    ) {
        return this.productsService.getProductDashboard(page, limit);
    }

    @Get('filters')
    async getFilterOptions() {
        return this.productsService.getFilterOptions();
    }

    @Get()
    async getAllProducts(@Query() query: GetProductsDto) {
        return this.productsService.getAllProducts(
            query.page,
            query.limit,
            query.search,
            query.category,
            query.status,
            query.format,
            query.publisher,
            query.author,
            query.minPrice,
            query.maxPrice,
            query.inStock,
            query.sortBy,
            query.sortOrder
        );
    }

    @Get(':id')
    async getProductById(@Param('id') id: string) {
        return this.productsService.getProductById(id);
    }

    @Put(':id/status')
    async updateProductStatus(
        @Param('id') id: string,
        @Query('status') status: 'active' | 'inactive' | 'suspended'
    ) {
        return this.productsService.updateProductStatus(id, status);
    }

    @Get('store/:storeId')
    async getProductsByStore(
        @Param('storeId') storeId: string,
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 10
    ) {
        return this.productsService.getProductsByStore(storeId, page, limit);
    }

    @Get('analytics/overview')
    async getProductAnalytics() {
        return this.productsService.getProductAnalytics();
    }
} 