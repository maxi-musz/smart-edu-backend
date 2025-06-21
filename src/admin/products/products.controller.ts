import { Controller, Get, Param, Query, Put, Post, Body, UseGuards, Request, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProductsService } from './products.service';
import { JwtGuard } from '../../auth/guard';
import { GetProductsDto } from './dto/get-products.dto';
import { CreateBookDto, CreateBooksDto } from './dto/create-book.dto';
import { UploadBooksDto } from './dto/upload-books.dto';
import { Roles } from 'src/common/decorators/roles.decorator';

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

    @Post('add-new')
    @UseInterceptors(FileInterceptor('display_image'))
    async addBooksManually(
        @Body() formData: any,
        @UploadedFile() displayImage?: Express.Multer.File
    ) {
        console.log('Form data received:', formData);
        console.log('Display image:', displayImage ? 'Present' : 'Not present');
        
        // Parse the form data to extract books array
        const books: CreateBookDto[] = [];
        
        // Check if we have any form data
        if (!formData || Object.keys(formData).length === 0) {
            throw new BadRequestException('No form data received');
        }

        // Define valid enum values from Prisma schema
        const validCategories = [
            'fiction', 'non_fiction', 'science', 'technology', 'business', 'self_help',
            'biography', 'history', 'philosophy', 'religion', 'politics', 'economics',
            'psychology', 'health', 'cooking', 'travel', 'sports', 'arts', 'literature',
            'poetry', 'drama', 'mystery', 'thriller', 'romance', 'fantasy', 'science_fiction',
            'horror', 'western', 'adventure', 'humor', 'comics', 'graphic_novels', 'children',
            'young_adult', 'academic', 'textbook', 'reference', 'dictionary', 'encyclopedia',
            'magazine', 'newspaper', 'other'
        ];

        const validGenres = [
            'education', 'fiction', 'non_fiction', 'mystery', 'romance', 'fantasy',
            'science_fiction', 'horror', 'biography', 'self_help', 'other'
        ];

        const validFormats = [
            'audiobook', 'e_book', 'hardcover', 'paperback', 'hardcopy'
        ];

        const validLanguages = [
            'english', 'spanish', 'french', 'german', 'chinese', 'japanese'
        ];
        
        // Handle array format from Postman
        if (Array.isArray(formData.name)) {
            console.log(`Found ${formData.name.length} books in array format`);
            
            for (let i = 0; i < formData.name.length; i++) {
                console.log(`Processing book ${i}:`, formData.name[i]);
                
                // Validate enum values
                const category = formData.category[i].trim();
                const genre = formData.genre[i].trim();
                const format = formData.format[i].trim();
                const language = formData.language[i].trim();

                if (!validCategories.includes(category)) {
                    throw new BadRequestException(`Invalid category: ${category}. Valid categories are: ${validCategories.join(', ')}`);
                }
                if (!validGenres.includes(genre)) {
                    throw new BadRequestException(`Invalid genre: ${genre}. Valid genres are: ${validGenres.join(', ')}`);
                }
                if (!validFormats.includes(format)) {
                    throw new BadRequestException(`Invalid format: ${format}. Valid formats are: ${validFormats.join(', ')}`);
                }
                if (!validLanguages.includes(language)) {
                    throw new BadRequestException(`Invalid language: ${language}. Valid languages are: ${validLanguages.join(', ')}`);
                }
                
                const book: CreateBookDto = {
                    name: formData.name[i].trim(),
                    description: formData.description[i].trim(),
                    qty: parseInt(formData.qty[i].trim()),
                    sellingPrice: parseFloat(formData.sellingPrice[i].trim()),
                    normalPrice: parseFloat(formData.normalPrice[i].trim()),
                    category: category as any,
                    language: language as any,
                    format: format as any,
                    genre: genre as any,
                    rated: formData.rated[i].trim(),
                    isbn: formData.isbn[i].trim(),
                    publisher: formData.publisher[i].trim(),
                    commission: formData.commission[i].trim(),
                    coverImage: displayImage ? displayImage.buffer.toString('base64') : ''
                };
                
                console.log(`Book ${i} data:`, book);
                books.push(book);
            }
        } else {
            // Handle indexed format (name[0], name[1], etc.)
            let index = 0;
            while (formData[`name[${index}]`]) {
                console.log(`Processing book ${index}:`, formData[`name[${index}]`]);
                
                // Validate enum values
                const category = formData[`category[${index}]`];
                const genre = formData[`genre[${index}]`];
                const format = formData[`format[${index}]`];
                const language = formData[`language[${index}]`];

                if (!validCategories.includes(category)) {
                    throw new BadRequestException(`Invalid category: ${category}. Valid categories are: ${validCategories.join(', ')}`);
                }
                if (!validGenres.includes(genre)) {
                    throw new BadRequestException(`Invalid genre: ${genre}. Valid genres are: ${validGenres.join(', ')}`);
                }
                if (!validFormats.includes(format)) {
                    throw new BadRequestException(`Invalid format: ${format}. Valid formats are: ${validFormats.join(', ')}`);
                }
                if (!validLanguages.includes(language)) {
                    throw new BadRequestException(`Invalid language: ${language}. Valid languages are: ${validLanguages.join(', ')}`);
                }
                
                const book: CreateBookDto = {
                    name: formData[`name[${index}]`],
                    description: formData[`description[${index}]`],
                    qty: parseInt(formData[`qty[${index}]`]),
                    sellingPrice: parseFloat(formData[`sellingPrice[${index}]`]),
                    normalPrice: parseFloat(formData[`normalPrice[${index}]`]),
                    category: category as any,
                    language: language as any,
                    format: format as any,
                    genre: genre as any,
                    rated: formData[`rated[${index}]`],
                    isbn: formData[`isbn[${index}]`],
                    publisher: formData[`publisher[${index}]`],
                    commission: formData[`commission[${index}]`],
                    coverImage: displayImage ? displayImage.buffer.toString('base64') : ''
                };
                
                console.log(`Book ${index} data:`, book);
                books.push(book);
                index++;
            }
        }
        
        console.log(`Total books parsed: ${books.length}`);
        
        if (books.length === 0) {
            throw new BadRequestException('No books found in form data. Please check your form field names.');
        }
        
        return this.productsService.addBooksManually(books);
    }

    @Post('books/upload')
    @UseInterceptors(FileInterceptor('file'))
    async addBooksFromFile(@UploadedFile() file: Express.Multer.File) {
        return this.productsService.addBooksFromFile(file);
    }
} 