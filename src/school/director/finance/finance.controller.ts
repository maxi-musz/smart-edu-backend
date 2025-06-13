import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { JwtGuard } from 'src/school/auth/guard';
import { GetUser } from 'src/school/auth/decorator';
import { User } from '@prisma/client';
import { FetchFinanceDashboardDto } from './finance.service';

@Controller('director/finance')
@UseGuards(JwtGuard)
export class FinanceController {
    constructor(private readonly financeService: FinanceService) {}

    @Get('dashboard')
    fetchFinanceDashboard(
        @GetUser() user: User,
        @Query() dto: FetchFinanceDashboardDto
    ) {
        return this.financeService.fetchFinanceDashboard(user.school_id, dto);
    }
} 