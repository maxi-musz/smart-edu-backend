import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as colors from 'colors';
import { ApiResponse } from 'src/shared/helper-functions/response';
import { CreateBookDto } from './dto/create-book.dto';
import * as csv from 'csv-parse/sync';
import * as XLSX from 'xlsx';

@Injectable()
export class ProductsService {
    constructor(private prisma: PrismaService) {}

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
                        status: product.status
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

            // Get products by category
            const productsByCategory = await this.prisma.product.groupBy({
                by: ['category'],
                _count: {
                    id: true
                }
            });

            // Get top selling products
            const topSellingProducts = await this.prisma.product.findMany({
                take: 10,
                include: {
                    store: {
                        select: {
                            name: true
                        }
                    },
                    _count: {
                        select: {
                            orderItems: true
                        }
                    }
                },
                orderBy: {
                    orderItems: {
                        _count: 'desc'
                    }
                }
            });

            const analytics = {
                overview: {
                    totalProducts,
                    activeProducts,
                    inactiveProducts,
                    suspendedProducts
                },
                byCategory: productsByCategory,
                topSelling: topSellingProducts
            };

            console.log(colors.magenta('Product analytics retrieved successfully'));
            return new ApiResponse(true, "", analytics);

        } catch (error) {
            console.log(colors.red('Error fetching product analytics:'), error);
            throw error;
        }
    }

    async addBooksManually(books: CreateBookDto[]) {
        // console.log(colors.blue("Admin manually adding new books"))
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
            // For now, let's create books one by one to get better error messages
            const createdBooks: any[] = [];
            
            for (const book of books) {
                console.log(colors.yellow(`Processing book: ${book.name}`));
                
                const bookData = {
                    name: book.name,
                    description: book.description,
                    stock: book.qty,
                    sellingPrice: book.sellingPrice,
                    normalPrice: book.normalPrice,
                    commission: book.commission,
                    // Use the correct field names from Prisma schema
                    BookFormat: book.format as any,
                    format: book.format,
                    language: book.language,
                    category: book.category as any, // Direct enum field
                    genre: book.genre as any, // Direct enum field
                    rated: book.rated,
                    isbn: book.isbn,
                    publisher: book.publisher,
                    storeId: null, // TODO: Set default storeId
                    displayImages: book.coverImage ? [book.coverImage] : [],
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
            return this.addBooksManually(books);
        } catch (error) {
            throw new BadRequestException('Failed to parse file: ' + error.message);
        }
    }
} 