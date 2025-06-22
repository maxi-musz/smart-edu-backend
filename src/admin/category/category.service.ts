import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ApiResponse } from 'src/shared/helper-functions/response';
import * as colors from "colors"
import { CreateCategoryDto } from './dto/create-category.dto';
import { Store, User } from '@prisma/client';

@Injectable()
export class CategoryService {
    constructor(private prisma: PrismaService) {}

    async getAllCategories(req: any, page?: number, limit?: number, search?: string, storeId?: string) {
        console.log(colors.cyan("Fetching all categories"));

        const whereClause: any = {};
        if (search) {
            whereClause.name = { contains: search, mode: 'insensitive' };
        }
        if (storeId) {
            whereClause.storeId = storeId;
        }
        try {
            // If no pagination and no search, fetch all
            if (!page && !limit && !search) {
                const categories = await this.prisma.category.findMany({
                    where: whereClause,
                    orderBy: { createdAt: 'desc' }
                });
                return new ApiResponse(true, '', { categories });
            }
            // Otherwise, use pagination
            const skip = ((page || 1) - 1) * (limit || 10);
            const [categories, total] = await Promise.all([
                this.prisma.category.findMany({
                    skip,
                    take: limit,
                    where: whereClause,
                    orderBy: { createdAt: 'desc' }
                }),
                this.prisma.category.count({ where: whereClause })
            ]);
            const totalPages = Math.ceil(total / (limit || 10));
            
            console.log(colors.magenta(`Total of ${categories.length} categories found`))
            return new ApiResponse(true, '', {
                pagination: {
                    currentPage: page || 1,
                    totalPages,
                    totalItems: total,
                    itemsPerPage: limit || 10
                },
                categories
            });
                
        } catch (error) {

            console.log(colors.red("Error fetching categories"), error)
            return new ApiResponse(
                false,
                "Error fetching categories"
            )
        }
    }

    async addCategory(data: CreateCategoryDto, req?: any) {
        console.log(colors.cyan('Attempting to add new category...'));
        // Get user info from req
        const userEmail = req?.user?.email;
        let adminName = '';
        let adminEmail = '';
        let storeId = '';
        if (userEmail) {
            const user: User | null = await this.prisma.user.findUnique({ where: { email: userEmail } });
            const store: Store | null = await this.prisma.store.findUnique({ where: { email: userEmail } });
            if (user && store) {
                adminName = user.first_name + ' ' + user.last_name;
                adminEmail = user.email;
                storeId = store.id
            }
        }
        try {
            // Check for duplicate
            const exists = await this.prisma.category.findUnique({
                where: { name_storeId: { name: data.name, storeId: storeId } }
            });
            if (exists) {
                console.log(colors.red(`Duplicate category found: ${data.name} for store ${storeId}`));
                throw new BadRequestException('Category with this name already exists for this store');
            }
            const category = await this.prisma.category.create({
                data: {
                    name: data.name.toLowerCase(),
                    description: data.description?.toLowerCase(),
                    storeId: storeId,
                    createdByName: adminName,
                    createdByEmail: adminEmail
                }
            });
            console.log(colors.green(`Category created successfully: ${category.name} (${category.id}) by ${adminEmail}`));
            return new ApiResponse(true, 'Category created successfully', category);
        } catch (error) {
            console.log(colors.red('Error adding category:'), error);
            throw error;
        }
    }
}
