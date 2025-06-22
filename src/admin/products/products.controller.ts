import { Controller, Get, Param, Query, Put, Post, Body, UseGuards, UseInterceptors, UploadedFile, UploadedFiles } from '@nestjs/common';
import { FileFieldsInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { ProductsService } from './products.service';
import { JwtGuard } from '../../auth/guard';
import { GetProductsDto } from './dto/get-products.dto';
import { Roles } from 'src/common/decorators/roles.decorator';
import { DynamicFileFieldsInterceptor } from './interceptors/dynamic-file-fields.interceptor';

@Controller('admin/products')
@UseGuards(JwtGuard)
@Roles("admin")
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

    @Get('validation-info')
    async getValidationInfo() {
        return this.productsService.getValidationInfo();
    }

    @Post('add-new')
    @UseInterceptors(DynamicFileFieldsInterceptor)
    async addBook(
        @Body() formData: any,
        @UploadedFiles() files: Record<string, Express.Multer.File[]>
    ) {
        console.log('Form data received:', formData);
        
        // Parse and validate single book using service
        const book = await this.productsService.parseFormDataAndValidateBook(formData);
        
        // Validate uploaded files
        this.productsService.validateUploadedFiles(files);
        
        // Group images for the single book
        const coverImages: Express.Multer.File[] = [];
        
        // Process files using the indexed format (0-4)
        if (files) {
            Object.keys(files).forEach(imageKey => {
                const match = imageKey.match(/display_images\[(\d+)\]/);
                if (match && files[imageKey] && files[imageKey].length > 0) {
                    const imageIndex = parseInt(match[1], 10);
                    const file = files[imageKey][0];
                    
                    if (imageIndex >= 0 && imageIndex < 5) {
                        coverImages[imageIndex] = file;
                        console.log(`Mapped image ${imageIndex} to position ${imageIndex}`);
                    }
                }
            });
        }

        return this.productsService.addBook(book, coverImages);
    }

    @Post('books/upload')
    @UseInterceptors(FileInterceptor('file'))
    async addBooksFromFile(@UploadedFile() file: Express.Multer.File) {
        return this.productsService.addBooksFromFile(file);
    }
} 