import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtGuard } from '../../auth/guard';

@Controller('admin/dashboard')
@UseGuards(JwtGuard)
export class DashboardController {
    constructor(private dashboardService: DashboardService) {}

    @Get('stats')
    async getDashboardStats() {
        return this.dashboardService.getDashboardStats();
    }

    @Get('revenue-analytics')
    async getRevenueAnalytics(@Query('period') period: 'daily' | 'weekly' | 'monthly' = 'monthly') {
        return this.dashboardService.getRevenueAnalytics(period);
    }

    @Get('top-performing-stores')
    async getTopPerformingStores(@Query('limit') limit: number = 10) {
        return this.dashboardService.getTopPerformingStores(limit);
    }
} 