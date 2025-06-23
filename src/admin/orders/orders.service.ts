import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as colors from 'colors';
import { OrderStatus } from '@prisma/client';
import { GetOrdersDto } from './dto/get-orders.dto';
import { OrdersDashboardResponseDto, OrderResponseDto, OrderStatsResponseDto, OrderPaginationResponseDto, OrderFiltersResponseDto } from './dto/order-response.dto';
import { ApiResponse } from 'src/shared/helper-functions/response';

@Injectable()
export class OrdersService {
    constructor(private prisma: PrismaService) {}

    async getOrdersDashboard(query: GetOrdersDto): Promise<ApiResponse<OrdersDashboardResponseDto>> {
        console.log(colors.cyan('Fetching orders dashboard data...'));

        try {
            const {
                page = 1,
                limit = 25,
                search,
                status,
                customerEmail,
                orderNumber,
                startDate,
                endDate,
                minAmount,
                maxAmount,
                sortBy = 'createdAt',
                sortOrder = 'desc'
            } = query;

            const skip = (page - 1) * limit;

            // Build where clause
            const whereClause: any = {};

            if (search) {
                whereClause.OR = [
                    { id: { contains: search, mode: 'insensitive' } },
                    { user: { email: { contains: search, mode: 'insensitive' } } },
                    { user: { first_name: { contains: search, mode: 'insensitive' } } },
                    { user: { last_name: { contains: search, mode: 'insensitive' } } },
                    { trackingNumber: { contains: search, mode: 'insensitive' } }
                ];
            }

            if (status) {
                whereClause.status = status;
            }

            if (customerEmail) {
                whereClause.user = { email: { contains: customerEmail, mode: 'insensitive' } };
            }

            if (orderNumber) {
                whereClause.id = { contains: orderNumber, mode: 'insensitive' };
            }

            if (startDate || endDate) {
                whereClause.createdAt = {};
                if (startDate) whereClause.createdAt.gte = new Date(startDate);
                if (endDate) whereClause.createdAt.lte = new Date(endDate);
            }

            if (minAmount || maxAmount) {
                whereClause.total = {};
                if (minAmount) whereClause.total.gte = minAmount;
                if (maxAmount) whereClause.total.lte = maxAmount;
            }

            // Get orders with pagination
            const [orders, total] = await Promise.all([
                this.prisma.order.findMany({
                    skip,
                    take: limit,
                    where: whereClause,
                    include: {
                        user: {
                            select: {
                                id: true,
                                first_name: true,
                                last_name: true,
                                email: true,
                                phone_number: true
                            }
                        },
                        items: {
                            include: {
                                product: {
                                    select: {
                                        id: true,
                                        name: true,
                                        isbn: true,
                                        publisher: true,
                                        formats: { select: { id: true, name: true } },
                                    }
                                }
                            }
                        }
                    },
                    orderBy: { [sortBy]: sortOrder }
                }),
                this.prisma.order.count({ where: whereClause })
            ]);

            // Get stats
            const stats = await this.getOrderStats();

            // Get filters
            const filters = await this.getOrderFilters();

            // Transform orders to match response format
            const transformedOrders = orders.map(order => this.transformOrder(order));

            const totalPages = Math.ceil(total / limit);

            console.log(colors.green(`Orders dashboard data retrieved successfully. Page ${page} of ${totalPages}`));

            const formatted_response = {
                pagination: {
                    currentPage: page,
                    totalPages,
                    perPage: limit,
                    totalItems: total
                },
                filters,
                stats,
                orders: transformedOrders,
            };

            return new ApiResponse(
                true,
                "Orders dashboard data retrieved successfully",
                formatted_response
            );

        } catch (error) {
            console.log(colors.red('Error fetching orders dashboard:'), error);
            throw error;
        }
    }

    private async getOrderStats(): Promise<OrderStatsResponseDto> {
        const [
            totalOrders,
            processing,
            shipped,
            delivered,
            cancelled,
            totalRevenue
        ] = await Promise.all([
            this.prisma.order.count(),
            this.prisma.order.count({ where: { status: 'pending' } }),
            this.prisma.order.count({ where: { status: { in: ['shipped', 'in_transit'] } } }),
            this.prisma.order.count({ where: { status: 'delivered' } }),
            this.prisma.order.count({ where: { status: 'cancelled' } }),
            this.prisma.order.aggregate({
                _sum: { total: true }
            })
        ]);

        const totalRevenueValue = totalRevenue._sum.total || 0;
        const averageOrderValue = totalOrders > 0 ? Math.round(totalRevenueValue / totalOrders) : 0;

        return {
            totalOrders,
            processing,
            shipped,
            delivered,
            cancelled,
            totalRevenue: Math.round(totalRevenueValue),
            averageOrderValue
        };
    }

    private async getOrderFilters(): Promise<OrderFiltersResponseDto> {
        return {
            statuses: ['pending', 'confirmed', 'shipped', 'in_transit', 'delivered', 'cancelled'],
            paymentStatuses: ['Paid', 'Pending', 'Refunded'],
            paymentMethods: ['Card', 'Transfer', 'Cash']
        };
    }

    private transformOrder(order: any): OrderResponseDto {
        // Generate order number
        const orderNumber = `#ORD-${order.id.slice(-8).toUpperCase()}`;
        
        // Generate estimated delivery (mock - 3 days from order date)
        const estimatedDelivery = new Date(order.createdAt);
        estimatedDelivery.setDate(estimatedDelivery.getDate() + 3);

        // Mock payment status and method (in real app, these would come from payment system)
        const paymentStatuses = ['Paid', 'Pending', 'Refunded'];
        const paymentMethods = ['Card', 'Transfer', 'Cash'];
        const paymentStatus = paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)];
        const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];

        return {
            id: order.id,
            customer: {
                name: `${order.user.first_name} ${order.user.last_name}`,
                email: order.user.email,
                phone: order.user.phone_number
            },
            date: order.createdAt.toISOString().split('T')[0],
            items: order.items.map(item => ({
                id: item.id,
                name: item.product.name,
                quantity: item.quantity,
                price: item.price,
                isbn: item.product.isbn,
                publisher: item.product.publisher,
                format: item.product.formats && item.product.formats.length > 0
                    ? item.product.formats.map(f => f.name).join(', ')
                    : 'N/A',
            })),
            total: order.total,
            status: this.mapOrderStatus(order.status),
            paymentStatus,
            paymentMethod,
            shippingAddress: order.shippingAddress,
            trackingNumber: order.trackingNumber,
            estimatedDelivery: estimatedDelivery.toISOString().split('T')[0],
            orderNumber,
            createdAt: order.createdAt.toISOString(),
            updatedAt: order.updatedAt.toISOString()
        };
    }

    private mapOrderStatus(status: OrderStatus): string {
        const statusMap = {
            'pending': 'Processing',
            'confirmed': 'Processing',
            'shipped': 'Shipped',
            'in_transit': 'Shipped',
            'delivered': 'Delivered',
            'cancelled': 'Cancelled'
        };
        return statusMap[status] || status;
    }
} 