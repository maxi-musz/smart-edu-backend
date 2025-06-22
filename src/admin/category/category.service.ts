import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ApiResponse } from 'src/shared/helper-functions/response';
import * as colors from "colors"
import { CreateCategoryDto } from './dto/create-category.dto';
import { Store, User } from '@prisma/client';
import { CreateGenreDto } from './dto/create-genre.dto';
import { CreateLanguageDto } from './dto/create-language.dto';
import { CreateFormatDto } from './dto/create-format.dto';
import { CreateAgeRatingDto } from './dto/create-age-rating.dto';

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

    async getAllGenres() {
        console.log(colors.cyan('Fetching all genres...'));

        try {
            const genres = await this.prisma.genre.findMany({ orderBy: { createdAt: 'desc' } });

            console.log(colors.magenta(`Total of ${genres.length} genres found`));
            const formattedGenres = genres.map(g => ({
                name: g.name,
                description: g.description,
                createdByName: g.createdByName,
                createdByEmail: g.createdByEmail
            }));

            return new ApiResponse(true, `Total of ${genres.length} genres found`, { genres: formattedGenres });
        } catch (error) {
            console.log(colors.red('Error fetching genres'), error);
            return new ApiResponse(false, 'Error fetching genres');
        }
    }

    async addGenre(data: CreateGenreDto, req?: any) {
        console.log(colors.cyan('Attempting to add new genre...'));
        // Get user info from req
        const userEmail = req?.user?.email;
        let adminName = '';
        let adminEmail = '';
        if (userEmail) {
            const user: User | null = await this.prisma.user.findUnique({ where: { email: userEmail } });
            if (user) {
                adminName = user.first_name + ' ' + user.last_name;
                adminEmail = user.email;
            }
        }
        try {
            const exists = await this.prisma.genre.findUnique({ where: { name: data.name.toLowerCase() } });
            if (exists) {
                console.log(colors.red(`Duplicate genre found: ${data.name}`));
                throw new BadRequestException('Genre with this name already exists');
            }
            const genre = await this.prisma.genre.create({
                data: {
                    name: data.name.toLowerCase(),
                    description: data.description?.toLowerCase(),
                    createdByName: adminName,
                    createdByEmail: adminEmail
                }
            });
            console.log(colors.green(`Genre created successfully: ${genre.name} (${genre.id}) by ${adminEmail}`));
            return new ApiResponse(true, 'Genre created successfully', genre);
        } catch (error) {
            console.log(colors.red('Error adding genre:'), error);
            throw error;
        }
    }

    async getAllLanguages() {
        console.log(colors.cyan('Fetching all languages...'));
        try {
            const languages = await this.prisma.language.findMany({ orderBy: { createdAt: 'desc' } });
            console.log(colors.magenta(`Total of ${languages.length} languages found`));
            const formattedLanguages = languages.map(l => ({
                name: l.name,
                description: l.description,
                createdByName: l.createdByName,
                createdByEmail: l.createdByEmail
            }));
            return new ApiResponse(true, `Total of ${languages.length} languages found`, { languages: formattedLanguages });
        } catch (error) {
            console.log(colors.red('Error fetching languages'), error);
            return new ApiResponse(false, 'Error fetching languages');
        }
    }

    async addLanguage(data: CreateLanguageDto, req?: any) {
        console.log(colors.cyan('Attempting to add new language...'));
        // Get user info from req
        const userEmail = req?.user?.email;
        let adminName = '';
        let adminEmail = '';
        if (userEmail) {
            const user: User | null = await this.prisma.user.findUnique({ where: { email: userEmail } });
            if (user) {
                adminName = user.first_name + ' ' + user.last_name;
                adminEmail = user.email;
            }
        }
        try {
            const exists = await this.prisma.language.findUnique({ where: { name: data.name.toLowerCase() } });
            if (exists) {
                console.log(colors.red(`Duplicate language found: ${data.name}`));
                throw new BadRequestException('Language with this name already exists');
            }
            const language = await this.prisma.language.create({
                data: {
                    name: data.name.toLowerCase(),
                    description: data.description?.toLowerCase(),
                    createdByName: adminName,
                    createdByEmail: adminEmail
                }
            });
            console.log(colors.green(`Language created successfully: ${language.name} (${language.id}) by ${adminEmail}`));
            return new ApiResponse(true, 'Language created successfully', language);
        } catch (error) {
            console.log(colors.red('Error adding language:'), error);
            throw error;
        }
    }

    async getAllFormats() {
        console.log(colors.cyan('Fetching all formats...'));
        try {
            const formats = await this.prisma.format.findMany({ orderBy: { createdAt: 'desc' } });
            console.log(colors.magenta(`Total of ${formats.length} formats found`));
            const formattedFormats = formats.map(f => ({
                name: f.name,
                description: f.description,
                createdByName: f.createdByName,
                createdByEmail: f.createdByEmail
            }));
            return new ApiResponse(true, `Total of ${formats.length} formats found`, { formats: formattedFormats });
        } catch (error) {
            console.log(colors.red('Error fetching formats'), error);
            return new ApiResponse(false, 'Error fetching formats');
        }
    }

    async addFormat(data: CreateFormatDto, req?: any) {
        console.log(colors.cyan('Attempting to add new format...'));
        // Get user info from req
        const userEmail = req?.user?.email;
        let adminName = '';
        let adminEmail = '';
        if (userEmail) {
            const user: User | null = await this.prisma.user.findUnique({ where: { email: userEmail } });
            if (user) {
                adminName = user.first_name + ' ' + user.last_name;
                adminEmail = user.email;
            }
        }
        try {
            const exists = await this.prisma.format.findUnique({ where: { name: data.name.toLowerCase() } });
            if (exists) {
                console.log(colors.red(`Duplicate format found: ${data.name}`));
                throw new BadRequestException('Format with this name already exists');
            }
            const format = await this.prisma.format.create({
                data: {
                    name: data.name.toLowerCase(),
                    description: data.description?.toLowerCase(),
                    createdByName: adminName,
                    createdByEmail: adminEmail
                }
            });
            console.log(colors.green(`Format created successfully: ${format.name} (${format.id}) by ${adminEmail}`));
            return new ApiResponse(true, 'Format created successfully', format);
        } catch (error) {
            console.log(colors.red('Error adding format:'), error);
            throw error;
        }
    }

    async getAllAgeRatings() {
        console.log(colors.cyan('Fetching all age ratings...'));
        try {
            const ageRatings = await this.prisma.ageRating.findMany({ orderBy: { createdAt: 'desc' } });
            console.log(colors.magenta(`Total of ${ageRatings.length} age ratings found`));
            const formattedAgeRatings = ageRatings.map(a => ({
                name: a.name,
                description: a.description,
                createdByName: a.createdByName,
                createdByEmail: a.createdByEmail
            }));
            return new ApiResponse(true, `Total of ${ageRatings.length} age ratings found`, { ageRatings: formattedAgeRatings });
        } catch (error) {
            console.log(colors.red('Error fetching age ratings'), error);
            return new ApiResponse(false, 'Error fetching age ratings');
        }
    }

    async addAgeRating(data: CreateAgeRatingDto, req?: any) {
        console.log(colors.cyan('Attempting to add new age rating...'));
        // Get user info from req
        const userEmail = req?.user?.email;
        let adminName = '';
        let adminEmail = '';
        if (userEmail) {
            const user: User | null = await this.prisma.user.findUnique({ where: { email: userEmail } });
            if (user) {
                adminName = user.first_name + ' ' + user.last_name;
                adminEmail = user.email;
            }
        }
        try {
            const exists = await this.prisma.ageRating.findUnique({ where: { name: data.name.toLowerCase() } });
            if (exists) {
                console.log(colors.red(`Duplicate age rating found: ${data.name}`));
                throw new BadRequestException('Age rating with this name already exists');
            }
            const ageRating = await this.prisma.ageRating.create({
                data: {
                    name: data.name.toLowerCase(),
                    description: data.description?.toLowerCase(),
                    createdByName: adminName,
                    createdByEmail: adminEmail
                }
            });
            console.log(colors.green(`Age rating created successfully: ${ageRating.name} (${ageRating.id}) by ${adminEmail}`));
            return new ApiResponse(true, 'Age rating created successfully', ageRating);
        } catch (error) {
            console.log(colors.red('Error adding age rating:'), error);
            throw error;
        }
    }

    async getAllMetadata(req: any) {
        
        console.log(colors.cyan("fetching metadata"))

        try {
            // Fetch all in parallel
            const [categoriesRes, genresRes, languagesRes, formatsRes, ageRatingsRes] = await Promise.all([
                this.getAllCategories(req),
                this.getAllGenres(),
                this.getAllLanguages(),
                this.getAllFormats(),
                this.getAllAgeRatings()
            ]);
            const categoriesData = categoriesRes.data && typeof categoriesRes.data === 'object' ? categoriesRes.data as { categories?: any[] } : {};
            const genresData = genresRes.data && typeof genresRes.data === 'object' ? genresRes.data as { genres?: any[] } : {};
            const languagesData = languagesRes.data && typeof languagesRes.data === 'object' ? languagesRes.data as { languages?: any[] } : {};
            const formatsData = formatsRes.data && typeof formatsRes.data === 'object' ? formatsRes.data as { formats?: any[] } : {};
            const ageRatingsData = ageRatingsRes.data && typeof ageRatingsRes.data === 'object' ? ageRatingsRes.data as { ageRatings?: any[] } : {};
            return new ApiResponse(true, 'Fetched all metadata', {
                categories: (categoriesData.categories || []).map((c: any) => ({ id: c.id, name: this.capitalizeFirstLetter(c.name) })),
                genres: (genresData.genres || []).map((g: any) => ({ id: g.id, name: this.capitalizeFirstLetter(g.name) })),
                languages: (languagesData.languages || []).map((l: any) => ({ id: l.id, name: this.capitalizeFirstLetter(l.name) })),
                formats: (formatsData.formats || []).map((f: any) => ({ id: f.id, name: this.capitalizeFirstLetter(f.name) })),
                ageRatings: (ageRatingsData.ageRatings || []).map((a: any) => ({ id: a.id, name: this.capitalizeFirstLetter(a.name) }))
            });
        } catch (error) {
            console.log(colors.red('Error fetching all metadata'), error);
            return new ApiResponse(false, 'Error fetching all metadata');
        }
    }

    // Helper to capitalize first letter
    private capitalizeFirstLetter(str: string): string {
        if (!str) return str;
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}
