import { Controller, Get, Param, Query, Put, UseGuards } from '@nestjs/common';
import { ReferralsService } from './referrals.service';
import { JwtGuard } from '../../auth/guard';

@Controller('admin/referrals')
@UseGuards(JwtGuard)
export class ReferralsController {
    constructor(private referralsService: ReferralsService) {}

    @Get()
    async getAllReferrals(
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 10,
        @Query('isUsed') isUsed?: boolean
    ) {
        return this.referralsService.getAllReferrals(page, limit, isUsed);
    }

    @Get(':id')
    async getReferralById(@Param('id') id: string) {
        return this.referralsService.getReferralById(id);
    }

    @Put(':id/usage')
    async updateReferralUsage(
        @Param('id') id: string,
        @Query('isUsed') isUsed: boolean
    ) {
        return this.referralsService.updateReferralUsage(id, isUsed);
    }

    @Get('user/:userId')
    async getReferralsByUser(
        @Param('userId') userId: string,
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 10
    ) {
        return this.referralsService.getReferralsByUser(userId, page, limit);
    }

    @Get('analytics/overview')
    async getReferralAnalytics() {
        return this.referralsService.getReferralAnalytics();
    }

    @Get('analytics/conversion-rate')
    async getReferralConversionRate() {
        return this.referralsService.getReferralConversionRate();
    }
} 