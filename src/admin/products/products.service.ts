import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as colors from 'colors';
import { ApiResponse } from 'src/shared/helper-functions/response';
import { CreateBookDto, BookCategory, BookGenre, BookLanguage, BookFormat } from './dto/create-book.dto';
import * as csv from 'csv-parse/sync';
import * as XLSX from 'xlsx';
import { CloudinaryService } from 'src/shared/services/cloudinary.service';
import { PRODUCT_VALIDATION_LIMITS, VALIDATION_MESSAGES } from './constants/validation-limits';

@Injectable()
export class ProductsService {
    constructor(
        private prisma: PrismaService,
        private cloudinaryService: CloudinaryService
    ) {}

    async getProductDashboard(page: number = 1, limit: number = 10) {
        console.log(colors.cyan('Fetching product dashboard data...'));

        try {
            const skip = (page - 1) * limit;

            // Get dashboard cards data
            const [totalBooks, totalCategories, inStock, productsWithValue] = await Promise.all([
                this.prisma.product.count(),
                this.prisma.category.count(),
                this.prisma.product.count({ where: { stock: { gt: 0 } } }),
                this.prisma.product.findMany({
                    select: { sellingPrice: true, stock: true }
                })
            ]);

            const totalProductValue = productsWithValue.reduce((total, product) => {
                return total + (product.sellingPrice * product.stock);
            }, 0);

            // Get products table data with pagination
            const [products, total] = await Promise.all([
                this.prisma.product.findMany({
                    skip,
                    take: limit,
                    select: {
                        id: true,
                        name: true,           // book name
                        publisher: true,      // published by
                        format: true,         // book format
                        isbn: true,           // isbn
                        sellingPrice: true,   // selling price
                        normalPrice: true,    // normal price
                        stock: true,          // stock
                        status: true,         // status
                        categoryId: true,
                        displayImages: true,  // displayImages
                        // Add more fields as needed
                    },
                    orderBy: { createdAt: 'desc' }
                }),
                this.prisma.product.count()
            ]);

            const totalPages = Math.ceil(total / limit);

            const dashboardData = {
                dashboardCards: {
                    totalBooks,
                    totalCategories,
                    inStock,
                    totalProductValue: Math.round(totalProductValue * 100) / 100 // Round to 2 decimal places
                },
                productsTable: {
                    products: products.map(product => ({
                        id: product.id,
                        bookName: product.name,
                        publishedBy: product.publisher || 'N/A',
                        bookFormat: product.format || 'N/A',
                        categoryId: product.categoryId || 'N/A',
                        isbn: product.isbn || 'N/A',
                        sellingPrice: product.sellingPrice,
                        normalPrice: product.normalPrice,
                        stock: product.stock,
                        status: product.status,
                        displayImages: product.displayImages || []
                    })),
                    pagination: {
                        currentPage: page,
                        totalPages,
                        totalItems: total,
                        itemsPerPage: limit
                    }
                }
            };

            console.log(colors.magenta('Product dashboard data retrieved successfully'));
            return new ApiResponse(true, "", dashboardData);

        } catch (error) {
            console.log(colors.red('Error fetching product dashboard:'), error);
            throw error;
        }
    }

    async getAllProducts(
        page: number = 1, 
        limit: number = 10, 
        search?: string,
        category?: string,
        status?: string,
        format?: string,
        publisher?: string,
        author?: string,
        minPrice?: number,
        maxPrice?: number,
        inStock?: boolean,
        sortBy?: string,
        sortOrder?: 'asc' | 'desc'
    ) {
        console.log(colors.cyan('Fetching all products with filters...'));

        try {
            const skip = (page - 1) * limit;
            
            // Build comprehensive where clause
            const whereClause: any = {};

            // Search functionality - search across multiple fields
            if (search) {
                whereClause.OR = [
                    { name: { contains: search, mode: 'insensitive' as const } },
                    { description: { contains: search, mode: 'insensitive' as const } },
                    { store: { name: { contains: search, mode: 'insensitive' as const } } },
                    { isbn: { contains: search, mode: 'insensitive' as const } },
                    { author: { contains: search, mode: 'insensitive' as const } },
                    { publisher: { contains: search, mode: 'insensitive' as const } }
                ];
            }

            // Filter by category
            if (category) {
                whereClause.category = category;
            }

            // Filter by status
            if (status) {
                whereClause.status = status;
            }

            // Filter by format
            if (format) {
                whereClause.format = { contains: format, mode: 'insensitive' as const };
            }

            // Filter by publisher
            if (publisher) {
                whereClause.publisher = { contains: publisher, mode: 'insensitive' as const };
            }

            // Filter by author
            if (author) {
                whereClause.author = { contains: author, mode: 'insensitive' as const };
            }

            // Price range filter
            if (minPrice !== undefined || maxPrice !== undefined) {
                whereClause.price = {};
                if (minPrice !== undefined) {
                    whereClause.price.gte = minPrice;
                }
                if (maxPrice !== undefined) {
                    whereClause.price.lte = maxPrice;
                }
            }

            // Stock filter
            if (inStock !== undefined) {
                if (inStock) {
                    whereClause.stock = { gt: 0 };
                } else {
                    whereClause.stock = { lte: 0 };
                }
            }

            // Build order by clause
            let orderBy: any = { createdAt: 'desc' }; // default sorting
            if (sortBy) {
                orderBy = { [sortBy]: sortOrder || 'desc' };
            }

            const [products, total] = await Promise.all([
                this.prisma.product.findMany({
                    skip,
                    take: limit,
                    where: whereClause,
                    include: {
                        store: {
                            select: {
                                id: true,
                                name: true,
                                email: true
                            }
                        }
                    },
                    orderBy
                }),
                this.prisma.product.count({ where: whereClause })
            ]);

            const totalPages = Math.ceil(total / limit);

            const formattedResponse = {
                products,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalItems: total,
                    itemsPerPage: limit
                }
            };

            console.log(colors.magenta(`Products retrieved successfully. Page ${page} of ${totalPages}`));
            return new ApiResponse(true, "", formattedResponse);

        } catch (error) {
            console.log(colors.red('Error fetching products:'), error);
            throw error;
        }
    }

    async getProductById(id: string) {
        console.log(colors.cyan(`Fetching product with ID: ${id}`));

        try {
            const product = await this.prisma.product.findUnique({
                where: { id },
                include: {
                    store: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            phone: true
                        }
                    }
                }
            });

            if (!product) {
                throw new NotFoundException('Product not found');
            }

            console.log(colors.magenta('Product retrieved successfully'));
            return new ApiResponse(true, "", product);

        } catch (error) {
            console.log(colors.red('Error fetching product:'), error);
            throw error;
        }
    }

    async updateProductStatus(id: string, status: 'active' | 'inactive' | 'suspended') {
        console.log(colors.cyan(`Updating product status to: ${status}`));

        try {
            const product = await this.prisma.product.findUnique({
                where: { id }
            });

            if (!product) {
                throw new NotFoundException('Product not found');
            }

            const updatedProduct = await this.prisma.product.update({
                where: { id },
                data: { status },
                include: {
                    store: {
                        select: {
                            id: true,
                            name: true,
                            email: true
                        }
                    }
                }
            });

            console.log(colors.magenta(`Product status updated to: ${status}`));
            return new ApiResponse(true, "", updatedProduct);

        } catch (error) {
            console.log(colors.red('Error updating product status:'), error);
            throw error;
        }
    }

    async getProductsByStore(storeId: string, page: number = 1, limit: number = 10) {
        console.log(colors.cyan(`Fetching products for store: ${storeId}`));

        try {
            const skip = (page - 1) * limit;

            const [products, total] = await Promise.all([
                this.prisma.product.findMany({
                    skip,
                    take: limit,
                    where: { storeId: storeId },
                    include: {
                        store: {
                            select: {
                                id: true,
                                name: true,
                                email: true
                            }
                        }
                    },
                    orderBy: { createdAt: 'desc' }
                }),
                this.prisma.product.count({ where: { storeId: storeId } })
            ]);

            const totalPages = Math.ceil(total / limit);

            console.log(colors.magenta(`Store products retrieved successfully. Page ${page} of ${totalPages}`));
            return new ApiResponse(true, "", {
                products,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalItems: total,
                    itemsPerPage: limit
                }
            });

        } catch (error) {
            console.log(colors.red('Error fetching store products:'), error);
            throw error;
        }
    }

    async getFilterOptions() {
        console.log(colors.cyan('Fetching filter options...'));

        try {
            // Get all filter options in parallel for better performance
            const [formats, publishers, authors, categories] = await Promise.all([
                // Available formats
                this.prisma.product.findMany({
                    where: { format: { not: null } },
                    select: { format: true },
                    distinct: ['format']
                }),
                // Available publishers
                this.prisma.product.findMany({
                    where: { publisher: { not: null } },
                    select: { publisher: true },
                    distinct: ['publisher']
                }),
                // Available authors
                this.prisma.product.findMany({
                    where: { author: { not: null } },
                    select: { author: true },
                    distinct: ['author']
                }),
                // Available categories
                this.prisma.product.findMany({
                    where: { category: { not: null } },
                    select: { category: true },
                    distinct: ['category']
                })
            ]);

            const filterOptions = {
                formats: formats.map(item => item.format).filter(Boolean),
                publishers: publishers.map(item => item.publisher).filter(Boolean),
                authors: authors.map(item => item.author).filter(Boolean),
                categories: categories.map(cat => ({ id: cat.category, name: cat.category })),
                statuses: ['active', 'inactive', 'suspended'],
                sortOptions: [
                    { value: 'name', label: 'Book Name' },
                    { value: 'price', label: 'Price' },
                    { value: 'stock', label: 'Stock' },
                    { value: 'createdAt', label: 'Date Added' },
                    { value: 'author', label: 'Author' },
                    { value: 'publisher', label: 'Publisher' }
                ]
            };

            console.log(colors.magenta('Filter options retrieved successfully'));
            return new ApiResponse(true, "", filterOptions);

        } catch (error) {
            console.log(colors.red('Error fetching filter options:'), error);
            throw error;
        }
    }

    async getProductAnalytics() {
        console.log(colors.cyan('Fetching product analytics...'));
        
        try {
            const totalProducts = await this.prisma.product.count();
            const activeProducts = await this.prisma.product.count({
                where: { status: 'active' }
            });
            const inactiveProducts = await this.prisma.product.count({
                where: { status: 'inactive' }
            });
            const suspendedProducts = await this.prisma.product.count({
                where: { status: 'suspended' }
            });

            const analytics = {
                total: totalProducts,
                active: activeProducts,
                inactive: inactiveProducts,
                suspended: suspendedProducts,
                activePercentage: totalProducts > 0 ? Math.round((activeProducts / totalProducts) * 100) : 0
            };

            console.log(colors.magenta('Product analytics retrieved successfully'));
            return new ApiResponse(true, "", analytics);

        } catch (error) {
            console.log(colors.red('Error fetching product analytics:'), error);
            throw error;
        }
    }

    async getValidationInfo() {
        console.log(colors.cyan('Fetching validation info...'));
        
        try {
            const validationInfo = {
                maxImagesPerBook: PRODUCT_VALIDATION_LIMITS.MAX_IMAGES_PER_BOOK,
                maxFileSizeMB: PRODUCT_VALIDATION_LIMITS.MAX_FILE_SIZE / (1024 * 1024),
                maxTotalFileSizeMB: PRODUCT_VALIDATION_LIMITS.MAX_TOTAL_FILE_SIZE / (1024 * 1024),
                allowedImageTypes: PRODUCT_VALIDATION_LIMITS.ALLOWED_IMAGE_TYPES,
                maxNameLength: PRODUCT_VALIDATION_LIMITS.MAX_NAME_LENGTH,
                maxDescriptionLength: PRODUCT_VALIDATION_LIMITS.MAX_DESCRIPTION_LENGTH,
                maxPublisherLength: PRODUCT_VALIDATION_LIMITS.MAX_PUBLISHER_LENGTH,
                maxIsbnLength: PRODUCT_VALIDATION_LIMITS.MAX_ISBN_LENGTH,
                maxRatedLength: PRODUCT_VALIDATION_LIMITS.MAX_RATED_LENGTH,
                minPrice: PRODUCT_VALIDATION_LIMITS.MIN_PRICE,
                maxPrice: PRODUCT_VALIDATION_LIMITS.MAX_PRICE,
                minStock: PRODUCT_VALIDATION_LIMITS.MIN_STOCK,
                maxStock: PRODUCT_VALIDATION_LIMITS.MAX_STOCK
            };

            console.log(colors.magenta('Validation info retrieved successfully'));
            return new ApiResponse(true, "", validationInfo);

        } catch (error) {
            console.log(colors.red('Error fetching validation info:'), error);
            throw error;
        }
    }

    async parseFormDataAndValidateBook(formData: any): Promise<CreateBookDto> {
        console.log('Parsing form data for single book...');
        
        if (!formData || Object.keys(formData).length === 0) {
            throw new BadRequestException('No form data received');
        }

        // Extract book data from form fields (without array indexing)
        const name = formData.name;
        const description = formData.description;
        const qty = formData.qty;
        const sellingPrice = formData.sellingPrice;
        const normalPrice = formData.normalPrice;
        const category = formData.category;
        const language = formData.language;
        const format = formData.format;
        const genre = formData.genre;
        const rated = formData.rated;
        const isbn = formData.isbn;
        const publisher = formData.publisher;
        const commission = formData.commission;

        if (!name) {
            throw new BadRequestException('Book name is required');
        }

        console.log(`Processing book: ${name}`);
        
        // Normalize enum values
        const normalizedCategory = category?.trim().toLowerCase();
        const normalizedGenre = genre?.trim().toLowerCase();
        const normalizedFormat = format?.trim().toLowerCase();
        const normalizedLanguage = language?.trim().toLowerCase();
        
        // Handle special case for 'ebook' -> 'e_book'
        const finalFormat = normalizedFormat === 'ebook' ? 'e_book' : normalizedFormat;
        
        // Validate enum values
        this.validateEnumValues(category, genre, format, language, 0);
        
        // Validate individual book data
        const bookData = {
            name: name,
            description: description || '',
            qty: parseInt(qty),
            sellingPrice: parseFloat(sellingPrice),
            normalPrice: parseFloat(normalPrice),
            category: normalizedCategory as BookCategory,
            language: normalizedLanguage as BookLanguage,
            format: finalFormat as BookFormat,
            genre: normalizedGenre as BookGenre,
            rated: rated || '',
            isbn: isbn || '',
            publisher: publisher || '',
            commission: commission || '0',
            coverImage: '' // will be set after upload
        };
        
        // Validate book data
        this.validateBookData(bookData, 0);
        
        console.log(`Book data:`, bookData);
        return bookData;
    }

    public validateUploadedFiles(files: Record<string, Express.Multer.File[]>) {
        if (!files || Object.keys(files).length === 0) {
            return; // No files uploaded, which is fine
        }

        let totalFileSize = 0;
        let imageCount = 0;

        // Process each uploaded file
        Object.keys(files).forEach(imageKey => {
            const match = imageKey.match(/display_images\[(\d+)\]/);
            if (match && files[imageKey] && files[imageKey].length > 0) {
                const imageIndex = parseInt(match[1], 10);
                const file = files[imageKey][0];
                
                // Validate file type
                if (!PRODUCT_VALIDATION_LIMITS.ALLOWED_IMAGE_TYPES.includes(file.mimetype as any)) {
                    throw new BadRequestException(`File ${file.originalname}: ${VALIDATION_MESSAGES.INVALID_FILE_TYPE}`);
                }

                // Validate file size
                if (file.size > PRODUCT_VALIDATION_LIMITS.MAX_FILE_SIZE) {
                    throw new BadRequestException(`File ${file.originalname}: ${VALIDATION_MESSAGES.FILE_TOO_LARGE}`);
                }

                // Track total file size
                totalFileSize += file.size;
                imageCount++;
            }
        });

        // Validate total file size
        if (totalFileSize > PRODUCT_VALIDATION_LIMITS.MAX_TOTAL_FILE_SIZE) {
            throw new BadRequestException(VALIDATION_MESSAGES.TOTAL_FILE_SIZE_EXCEEDED);
        }

        // Validate total number of images
        if (imageCount > PRODUCT_VALIDATION_LIMITS.MAX_IMAGES_PER_BOOK) {
            throw new BadRequestException(VALIDATION_MESSAGES.TOO_MANY_IMAGES);
        }

        console.log(`File validation passed. Total files: ${imageCount}, Total size: ${totalFileSize} bytes`);
    }

    async addBook(book: CreateBookDto, coverImages: Express.Multer.File[]) {
        console.log(colors.cyan(`Admin attempting to add book: ${book.name}`))
       
        // Check for duplicate ISBN
        if (book.isbn) {
            const existingBook = await this.prisma.product.findUnique({
                where: { isbn: book.isbn },
                select: { isbn: true }
            });
            if (existingBook) {
                console.log(colors.red(`Duplicate ISBN found: ${book.isbn}`))
                throw new BadRequestException(`Duplicate ISBN found: ${book.isbn}`);
            }
        }

        try {
            console.log(colors.yellow(`Processing book: ${book.name}`));
            let displayImages: any[] = [];
            
            // If coverImages are provided, upload them
            if (coverImages && coverImages.length > 0) {
                const uploadResults = await this.cloudinaryService.uploadToCloudinary(
                    coverImages.filter(img => img), // Filter out undefined entries
                    'acces-sellr/book-covers'
                );
                displayImages = uploadResults.map(res => ({
                    secure_url: res.secure_url,
                    public_id: res.public_id
                }));
            } else if (book.coverImage && typeof book.coverImage === 'string' && book.coverImage.startsWith('http')) {
                // If already a URL, just use it
                displayImages = [{ secure_url: book.coverImage, public_id: null }];
            }
            
            const bookData = {
                name: book.name,
                description: book.description,
                stock: book.qty,
                sellingPrice: book.sellingPrice,
                normalPrice: book.normalPrice,
                commission: book.commission,
                BookFormat: book.format as any,
                format: book.format,
                language: book.language,
                category: book.category as any,
                genre: book.genre as any,
                rated: book.rated,
                isbn: book.isbn,
                publisher: book.publisher,
                storeId: null, // TODO: Set default storeId
                displayImages: displayImages,
                isActive: true,
                status: 'active'
            };
            
            console.log(colors.green(`Book data prepared for: ${book.name}`));
            const createdBook = await this.prisma.product.create({
                data: bookData
            });
            
            console.log(colors.green(`Book created successfully: ${createdBook.id}`));
            console.log(colors.magenta(`Successfully added book: ${book.name}`));
            
            return new ApiResponse(true, `Successfully added book: ${book.name}`, {
                book: createdBook
            });
        } catch (error) {
            console.log(colors.red('Error adding book:'), error);
            throw new BadRequestException('Failed to add book: ' + error.message);
        }
    }

    private validateEnumValues(category: string, genre: string, format: string, language: string, bookIndex: number) {
        const validCategories = CreateBookDto.VALID_CATEGORIES;
        const validGenres = CreateBookDto.VALID_GENRES;
        const validFormats = CreateBookDto.VALID_FORMATS;
        const validLanguages = CreateBookDto.VALID_LANGUAGES;

        // Normalize input values (trim and convert to lowercase)
        const normalizedCategory = category?.trim().toLowerCase();
        const normalizedGenre = genre?.trim().toLowerCase();
        const normalizedFormat = format?.trim().toLowerCase();
        const normalizedLanguage = language?.trim().toLowerCase();

        // Handle special case for 'ebook' -> 'e_book'
        const finalFormat = normalizedFormat === 'ebook' ? 'e_book' : normalizedFormat;

        if (!validCategories.includes(normalizedCategory as BookCategory)) {
            throw new BadRequestException(`Invalid category for book ${bookIndex}: ${category}. Valid categories are: ${validCategories.join(', ')}`);
        }
        if (!validGenres.includes(normalizedGenre as BookGenre)) {
            throw new BadRequestException(`Invalid genre for book ${bookIndex}: ${genre}. Valid genres are: ${validGenres.join(', ')}`);
        }
        if (!validFormats.includes(finalFormat as BookFormat)) {
            throw new BadRequestException(`Invalid format for book ${bookIndex}: ${format}. Valid formats are: ${validFormats.join(', ')}`);
        }
        if (!validLanguages.includes(normalizedLanguage as BookLanguage)) {
            throw new BadRequestException(`Invalid language for book ${bookIndex}: ${language}. Valid languages are: ${validLanguages.join(', ')}`);
        }
    }

    private validateBookData(book: any, bookIndex: number) {
        // Validate name length
        if (book.name.length > PRODUCT_VALIDATION_LIMITS.MAX_NAME_LENGTH) {
            throw new BadRequestException(`Book ${bookIndex}: ${VALIDATION_MESSAGES.NAME_TOO_LONG}`);
        }

        // Validate description length
        if (book.description && book.description.length > PRODUCT_VALIDATION_LIMITS.MAX_DESCRIPTION_LENGTH) {
            throw new BadRequestException(`Book ${bookIndex}: ${VALIDATION_MESSAGES.DESCRIPTION_TOO_LONG}`);
        }

        // Validate publisher length
        if (book.publisher && book.publisher.length > PRODUCT_VALIDATION_LIMITS.MAX_PUBLISHER_LENGTH) {
            throw new BadRequestException(`Book ${bookIndex}: Publisher must be less than ${PRODUCT_VALIDATION_LIMITS.MAX_PUBLISHER_LENGTH} characters`);
        }

        // Validate ISBN length
        if (book.isbn && book.isbn.length > PRODUCT_VALIDATION_LIMITS.MAX_ISBN_LENGTH) {
            throw new BadRequestException(`Book ${bookIndex}: ISBN must be less than ${PRODUCT_VALIDATION_LIMITS.MAX_ISBN_LENGTH} characters`);
        }

        // Validate rated length
        if (book.rated && book.rated.length > PRODUCT_VALIDATION_LIMITS.MAX_RATED_LENGTH) {
            throw new BadRequestException(`Book ${bookIndex}: Rated must be less than ${PRODUCT_VALIDATION_LIMITS.MAX_RATED_LENGTH} characters`);
        }

        // Validate price range
        // if (book.sellingPrice < PRODUCT_VALIDATION_LIMITS.MIN_PRICE || book.sellingPrice > PRODUCT_VALIDATION_LIMITS.MAX_PRICE) {
        //     throw new BadRequestException(`Book ${bookIndex}: ${VALIDATION_MESSAGES.PRICE_OUT_OF_RANGE}`);
        // }

        // if (book.normalPrice < PRODUCT_VALIDATION_LIMITS.MIN_PRICE || book.normalPrice > PRODUCT_VALIDATION_LIMITS.MAX_PRICE) {
        //     throw new BadRequestException(`Book ${bookIndex}: ${VALIDATION_MESSAGES.PRICE_OUT_OF_RANGE}`);
        // }

        // Validate stock range
        if (book.qty < PRODUCT_VALIDATION_LIMITS.MIN_STOCK || book.qty > PRODUCT_VALIDATION_LIMITS.MAX_STOCK) {
            throw new BadRequestException(`Book ${bookIndex}: ${VALIDATION_MESSAGES.STOCK_OUT_OF_RANGE}`);
        }

        // Validate that selling price is not higher than normal price
        if (book.sellingPrice > book.normalPrice) {
            throw new BadRequestException(`Book ${bookIndex}: Selling price cannot be higher than normal price`);
        }
    }

    async addBooksManually(books: CreateBookDto[], coverImagesPerBook: Express.Multer.File[][]) {
        console.log(colors.cyan(`Admin attempting to add ${books.length} books`))
       
        const isbns = books.map(book => book.isbn).filter(isbn => isbn); 
        if (isbns.length > 0) {
            const existingBooks = await this.prisma.product.findMany({
                where: { isbn: { in: isbns } },
                select: { isbn: true }
            });
            if (existingBooks.length > 0) {
                const duplicates = existingBooks.map(b => b.isbn);
                console.log(colors.red(`Duplicate ISBN(s) found: ${duplicates.join(', ')}`))
                throw new BadRequestException(`Duplicate ISBN(s) found: ${duplicates.join(', ')}`);
            }
        }

        try {
            const createdBooks: any[] = [];
            for (let i = 0; i < books.length; i++) {
                const book = books[i];
                console.log(colors.yellow(`Processing book: ${book.name}`));
                let displayImages: any[] = [];
                // If coverImagesPerBook is provided and has files for this book, upload them
                if (coverImagesPerBook && coverImagesPerBook[i] && coverImagesPerBook[i].length > 0) {
                    const uploadResults = await this.cloudinaryService.uploadToCloudinary(
                        coverImagesPerBook[i],
                        'acces-sellr/book-covers'
                    );
                    displayImages = uploadResults.map(res => ({
                        secure_url: res.secure_url,
                        public_id: res.public_id
                    }));
                } else if (book.coverImage && typeof book.coverImage === 'string' && book.coverImage.startsWith('http')) {
                    // If already a URL, just use it
                    displayImages = [{ secure_url: book.coverImage, public_id: null }];
                }
                const bookData = {
                    name: book.name,
                    description: book.description,
                    stock: book.qty,
                    sellingPrice: book.sellingPrice,
                    normalPrice: book.normalPrice,
                    commission: book.commission,
                    BookFormat: book.format as any,
                    format: book.format,
                    language: book.language,
                    category: book.category as any,
                    genre: book.genre as any,
                    rated: book.rated,
                    isbn: book.isbn,
                    publisher: book.publisher,
                    storeId: null, // TODO: Set default storeId
                    displayImages: displayImages,
                    isActive: true,
                    status: 'active'
                };
                console.log(colors.green(`Book data prepared for: ${book.name}`));
                const createdBook = await this.prisma.product.create({
                    data: bookData
                });
                createdBooks.push(createdBook);
                console.log(colors.green(`Book created successfully: ${createdBook.id}`));
            }
            console.log(colors.magenta(`Successfully added ${createdBooks.length} books`));
            return new ApiResponse(true, `Successfully added ${createdBooks.length} books`, {
                count: createdBooks.length,
                books: createdBooks
            });
        } catch (error) {
            console.log(colors.red('Error adding books:'), error);
            throw new BadRequestException('Failed to add books: ' + error.message);
        }
    }

    async addBooksFromFile(file: Express.Multer.File) {
        if (!file) throw new BadRequestException('No file uploaded');
        let books: CreateBookDto[] = [];
        try {
            if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
                const records = csv.parse(file.buffer.toString(), {
                    columns: true,
                    skip_empty_lines: true,
                });
                books = records.map((row: any) => ({
                    name: row.name,
                    description: row.description,
                    qty: Number(row.qty),
                    sellingPrice: Number(row.sellingPrice),
                    normalPrice: Number(row.normalPrice),
                    category: row.category,
                    language: row.language,
                    format: row.format,
                    genre: row.genre,
                    rated: row.rated,
                    coverImage: row.coverImage,
                    isbn: row.isbn,
                    publisher: row.publisher,
                    commission: String(row.commission ?? '0'),
                }));
            } else if (
                file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                file.mimetype === 'application/vnd.ms-excel' ||
                file.originalname.endsWith('.xlsx') ||
                file.originalname.endsWith('.xls')
            ) {
                const workbook = XLSX.read(file.buffer, { type: 'buffer' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const records = XLSX.utils.sheet_to_json(sheet);
                books = records.map((row: any) => ({
                    name: row.name,
                    description: row.description,
                    qty: Number(row.qty),
                    sellingPrice: Number(row.sellingPrice),
                    normalPrice: Number(row.normalPrice),
                    category: row.category,
                    language: row.language,
                    format: row.format,
                    genre: row.genre,
                    rated: row.rated,
                    coverImage: row.coverImage,
                    isbn: row.isbn,
                    publisher: row.publisher,
                    commission: String(row.commission ?? '0'),
                }));
            } else {
                throw new BadRequestException('Unsupported file type');
            }

            console.log(colors.magenta("New books successfully added"))
            return this.addBooksManually(books, []);
        } catch (error) {
            throw new BadRequestException('Failed to parse file: ' + error.message);
        }
    }
} 