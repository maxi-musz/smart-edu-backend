import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as colors from "colors";
import { ApiResponse } from 'src/shared/helper-functions/response';
import { formatAmount } from 'src/shared/helper-functions/formatter';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  private formatProduct(product: any) {
    let displayImageUrl: string | null = null;
    if (product.displayImages) {
      let images = product.displayImages;
      if (typeof images === 'string') {
        try {
          images = JSON.parse(images);
        } catch {
          images = [];
        }
      }
      if (Array.isArray(images) && images.length > 0) {
        const firstImage = images[0];
        if (firstImage && typeof firstImage === 'object' && 'secure_url' in firstImage && typeof firstImage.secure_url === 'string') {
          displayImageUrl = firstImage.secure_url;
        }
      }
    }
    return {
      book_name: product.name,
      author: product.author ?? 'N/A',
      description: product.description ?? '',
      selling_price: product.sellingPrice,
      normal_price: product.normalPrice,
      total_purchase: 0, // fallback for now
      category: product.categories && product.categories.length > 0
        ? [product.categories[0]]
        : [],
      display_image: displayImageUrl,
    };
  }

  async getAllPublicProductsSections() {
    console.log(colors.cyan("fetching all products from db (sections)"));

    // Featured
    const featured = await this.prisma.product.findMany({
      where: { isFeatured: true },
      include: { categories: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Extract unique categories from featured products
    const availableCategories = new Map();
    featured.forEach(product => {
      product.categories.forEach(category => {
        if (!availableCategories.has(category.id)) {
          availableCategories.set(category.id, category);
        }
      });
    });

    // New Arrivals (last 14 days)
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const newArrivals = await this.prisma.product.findMany({
      where: { createdAt: { gte: twoWeeksAgo } },
      include: { categories: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Popular Categories (top 4 by product count)
    const popularCategories = await this.prisma.category.findMany({
      orderBy: { products: { _count: 'desc' } },
      take: 4,
      include: {
        products: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: { displayImages: true },
        },
        _count: { select: { products: true } },
      },
    });

    const formated_response = {
      featured: featured.map(this.formatProduct),
      available_categories: Array.from(availableCategories.values()),
      newArrivals: newArrivals.map(this.formatProduct),
      popularCategories: popularCategories.map(cat => {
        let displayImageUrl: string | null = null;
        if (cat.products[0]?.displayImages) {
          let images = cat.products[0].displayImages;
          if (typeof images === 'string') {
            try {
              images = JSON.parse(images);
            } catch {
              images = [];
            }
          }
          if (Array.isArray(images) && images.length > 0) {
            const firstImage = images[0];
            if (firstImage && typeof firstImage === 'object' && 'secure_url' in firstImage && typeof firstImage.secure_url === 'string') {
              displayImageUrl = firstImage.secure_url;
            }
          }
        }
        return {
          id: cat.id,
          name: cat.name,
          description: cat.description ?? '',
          total_books: cat._count.products,
          display_image: displayImageUrl,
        };
      }),
    };

    return new ApiResponse(true, "Homepage data fetched", formated_response);
  }

  // Keep the original endpoint for backwards compatibility
  async getAllPublicProducts() {
    console.log(colors.cyan("fetching all products from db"));
    const products = await this.prisma.product.findMany({
      include: {
        categories: { select: { id: true, name: true } },
      },
    });
    return products.map(this.formatProduct);
  }

  // Fetch products with pagination for browse products page (infinite scroll)
  async getPaginatedProducts(page: number = 1) {

    console.log(colors.cyan(`fetching products from db, page: ${page}`))

    try {
      const PAGE_SIZE = 20;
      const skip = (page - 1) * PAGE_SIZE;
      const products = await this.prisma.product.findMany({
        skip,
        take: PAGE_SIZE,
        orderBy: { createdAt: 'desc' },
        include: {
          categories: { select: { id: true, name: true } },
          formats: { select: { id: true, name: true } },
        },
      });
      const total = await this.prisma.product.count();

      // Fetch categories with product count
      const available_categories = await this.prisma.category.findMany({
        select: {
          id: true,
          name: true,
          _count: {
            select: { products: true }
          }
        }
      });

      const available_formats = await this.prisma.format.findMany({
        select: {
          id: true,
          name: true,
          _count: {
            select: { products: true }
          }
        }
      });

      const formatted_categories = [
        {
          id: 'all',
          name: 'All Books',
          total_books: total,
          icon: 'BookOpen'
        },
        ...available_categories.map(cat => ({
          id: cat.id,
          name: cat.name,
          total_books: cat._count.products,
          // icon: getCategoryIcon(cat.name)
        }))
      ];

      const formatted_formats = available_formats.map(format => ({
        id: format.id,
        name: format.name,
        total_books: format._count.products
      }));

      const formattedProducts = await Promise.all(products.map(async (product) => {
        // Check if product was created within the last 48 hours
        const createdAt = new Date(product.createdAt);
        const now = new Date();
        const diffInMs = now.getTime() - createdAt.getTime();
        const isNew = diffInMs <= 48 * 60 * 60 * 1000; // 48 hours in ms
        let images = product.displayImages;
        if (typeof images === 'string') {
          try { images = JSON.parse(images); } catch { images = []; }
        }
        const display_picture = Array.isArray(images) && images[0] && typeof images[0] === 'object' && 'secure_url' in images[0]
          ? images[0].secure_url
          : null;
        // Get total sold for this product
        const orderItemsAgg = await this.prisma.orderItem.aggregate({
          where: { productId: product.id },
          _sum: { quantity: true },
        });
        const totalSold = orderItemsAgg._sum.quantity || 0;
        return {
          id: product.id,
          product_name: product.name,
          is_new: isNew,
          stock_count: product.stock,
          categories: Array.isArray(product.categories)
            ? product.categories.map((cat: any) => ({ id: cat.id, name: cat.name }))
            : [],
            formats: Array.isArray(product.formats)
            ? product.formats.map((format: any) => ({ id: format.id, name: format.name }))
            : [],
          stock_status: product.stock < 1 ? "Out Of Stock" : product.stock <= 30 ? "Low Stock" : "In Stock",
          display_picture: display_picture,
          author: product.author || product.publisher || null,
          total_sold: totalSold,
          selling_price: formatAmount(product.sellingPrice),
          nomral_price: formatAmount(product.normalPrice),
          format: product.BookFormat || null,

        };
      }));

      return new ApiResponse(true, 'Products fetched', {
        page,
        pageSize: PAGE_SIZE,
        total,
        hasMore: skip + PAGE_SIZE < total,
        categories: formatted_categories,
        formats: formatted_formats,
        products: formattedProducts,
        pagination: {
          totalPages: Math.ceil(total / PAGE_SIZE),
          currentPage: page,
          totalProducts: total
        }
      });
    } catch (error) {
      console.log(colors.red("Error fetching products"))
      return new ApiResponse(false, 'Failed to fetch products', { error: error.message || error.toString() });
    }
  }

  // A LOGIC THAT FETCHES ALL PRODUCTS FROM DB, TO BE DISPLAYED ON THE BROWSE PRODUCTS PAGE, FETCHING 20 BOOKS AT A TIME, WHEN USER GETS TO BOTTOM OF PAGE IT FETCHES ANOTHR NEW 20 LIKE THAT LIKE THAT
}
