import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { DashboardService } from './dashboard.service';
import { JwtGuard } from 'src/school/auth/guard';
import { GetUser } from 'src/school/auth/decorator';
import { User } from '@prisma/client';

@Controller('director/dashboard')
export class DashboardController {

    constructor(private readonly dashboardService: DashboardService) {}
    
    // get director dashboard
    @UseGuards(JwtGuard)
    @Get('fetch-dashboard-data')
    getDirectorDashboard(@GetUser() user: User) {
        return this.dashboardService.getDirectorDashboard(user);
    }
}