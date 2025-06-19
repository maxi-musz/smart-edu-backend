import { Controller, Get, Param, Query, Put, UseGuards } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { JwtGuard } from '../../auth/guard';
import { GetCustomersDto } from './dto/get-customers.dto';
import { CustomersDashboardResponseDto } from './dto/customer-response.dto';
import { ApiResponse } from 'src/shared/helper-functions/response';

@Controller('admin/customers')
@UseGuards(JwtGuard)
export class CustomersController {
    constructor(private customersService: CustomersService) {}

    @Get('dashboard')
    async getCustomersDashboard(@Query() query: GetCustomersDto): Promise<ApiResponse<CustomersDashboardResponseDto>> {
        return this.customersService.getCustomersDashboard(query);
    }
} 