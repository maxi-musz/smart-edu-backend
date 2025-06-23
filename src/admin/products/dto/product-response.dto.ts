export class ProductResponseDto {
    id: string;
    name: string;
    description?: string;
    sellingPrice: number;
    normalPrice: number;
    stock: number;
    images: string[];
    categoryId: string;
    storeId: string;
    commission: number;
    isActive: boolean;
    status: string;
    
    // Book-specific fields
    isbn?: string;
    format?: string[];
    publisher?: string;
    author?: string;
    pages?: number;
    language?: string[];
    genre?: string[];
    publishedDate?: Date;
    
    createdAt: Date;
    updatedAt: Date;
    
    // Relations
    store?: {
        id: string;
        name: string;
        email: string;
    };
    
    category?: {
        id: string;
        name: string;
    };
}

export class ProductDashboardResponseDto {
    totalBooks: number;
    totalCategories: number;
    inStock: number;
    totalProductValue: number;
}

export class ProductListResponseDto {
    products: ProductResponseDto[];
    pagination: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        itemsPerPage: number;
    };
} 