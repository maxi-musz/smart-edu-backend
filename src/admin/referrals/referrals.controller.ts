import { Controller, Get, Param, Query, Put, UseGuards, Body, Post, Request } from '@nestjs/common';
import { ReferralsService } from './referrals.service';
import { JwtGuard } from '../../auth/guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { GenerateAffiliateLinkDto } from './dto/generate-affiliate-link.dto';
import { TrackAffiliateLinkConversionDto } from './dto/track-affiliate-link-conversion.dto';

@Controller('admin/affiliates')
@UseGuards(JwtGuard)
@Roles("admin")
export class ReferralsController {
    constructor(private referralsService: ReferralsService) {}

    @Get()
    async fetchAffiliateDashboard() {
        return this.referralsService.fetchAffiliateDashboard()
    }

    @Get('all')
    async fetchAllAffiliates(
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 20,
        @Query('status') status?: string
    ) {
        return this.referralsService.fetchAllAffiliates(Number(page), Number(limit), status);
    }

    @Put(':id/status')
    async updateAffiliateStatus(
        @Param('id') id: string,
        @Body('status') status: string
    ) {
        return this.referralsService.updateAffiliateStatus(id, status);
    }

    // Generate affiliate link
    @Post('link')
    async generateAffiliateLink(
        @Request() req,
        @Body() dto: GenerateAffiliateLinkDto
    ) {
        const userId = req.user.id;
        return this.referralsService.generateAffiliateLink(userId, dto.productId);
    }

    // Get all affiliate links for a user
    @Get(':userId/links')
    async getAffiliateLinksForUser(
        @Param('userId') userId: string
    ) {
        return this.referralsService.getAffiliateLinksForUser(userId);
    }

    // Track click on affiliate link
    @Post('link/:slug/click')
    async trackAffiliateLinkClick(
        @Param('slug') slug: string
    ) {
        return this.referralsService.trackAffiliateLinkClick(slug);
    }

    // Track conversion for affiliate link
    @Post('link/:slug/conversion') 
    async trackAffiliateLinkConversion(
        @Param('slug') slug: string,
        @Body() dto: TrackAffiliateLinkConversionDto
    ) {
        return this.referralsService.trackAffiliateLinkConversion(slug, dto.orderId, dto.commissionAmount);
    }

    // Get affiliate link for current user and product
    @Get('link/:productId')
    async getAffiliateLinkForUserAndProduct(
        @Request() req,
        @Param('productId') productId: string
    ) {
        const userId = req.user.id;
        return this.referralsService.getAffiliateLinkForUserAndProduct(userId, productId);
    } 
} 