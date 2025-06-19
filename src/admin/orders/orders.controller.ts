import { Controller, Get, Param, Query, Put, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtGuard } from '../../auth/guard';
import { OrderStatus } from '@prisma/client';
import { GetOrdersDto } from './dto/get-orders.dto';
import { OrdersDashboardResponseDto } from './dto/order-response.dto';
import { ApiResponse } from 'src/shared/helper-functions/response';

@Controller('admin/orders')
@UseGuards(JwtGuard)
export class OrdersController {
    constructor(private ordersService: OrdersService) {}

    @Get('dashboard')
    async getOrdersDashboard(@Query() query: GetOrdersDto): Promise<ApiResponse<OrdersDashboardResponseDto>> {
        return this.ordersService.getOrdersDashboard(query);
    }
} 