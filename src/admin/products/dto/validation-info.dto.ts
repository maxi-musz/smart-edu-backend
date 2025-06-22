import { ApiProperty } from '@nestjs/swagger';

export class ValidationInfoDto {
    @ApiProperty({ description: 'Maximum number of display images per book' })
    maxImagesPerBook: number;

    @ApiProperty({ description: 'Maximum file size per image in MB' })
    maxFileSizeMB: number;

    @ApiProperty({ description: 'Maximum total file size for all images in a single request in MB' })
    maxTotalFileSizeMB: number;

    @ApiProperty({ description: 'Allowed image file types' })
    allowedImageTypes: string[];

    @ApiProperty({ description: 'Maximum number of characters for book name' })
    maxNameLength: number;

    @ApiProperty({ description: 'Maximum number of characters for description' })
    maxDescriptionLength: number;

    @ApiProperty({ description: 'Maximum number of characters for publisher' })
    maxPublisherLength: number;

    @ApiProperty({ description: 'Maximum number of characters for ISBN' })
    maxIsbnLength: number;

    @ApiProperty({ description: 'Maximum number of characters for rated field' })
    maxRatedLength: number;

    @ApiProperty({ description: 'Minimum price allowed' })
    minPrice: number;

    @ApiProperty({ description: 'Maximum price allowed' })
    maxPrice: number;

    @ApiProperty({ description: 'Minimum stock allowed' })
    minStock: number;

    @ApiProperty({ description: 'Maximum stock allowed' })
    maxStock: number;
} 