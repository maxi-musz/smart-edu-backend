import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtGuard } from '../../auth/guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@Controller('admin/dashboard')
@UseGuards(JwtGuard, RolesGuard)
export class DashboardController {
    constructor(private dashboardService: DashboardService) {}

    @Get('stats')
    @Roles('admin')
    async getDashboardStats() {
        return this.dashboardService.getDashboardStats();
    }

    @Get('revenue-analytics')
    @Roles('admin')
    async getRevenueAnalytics(@Query('period') period: 'daily' | 'weekly' | 'monthly' = 'monthly') {
        return this.dashboardService.getRevenueAnalytics(period);
    }

    @Get('top-performing-stores')
    @Roles('admin')
    async getTopPerformingStores(@Query('limit') limit: number = 10) {
        return this.dashboardService.getTopPerformingStores(limit);
    }
} 