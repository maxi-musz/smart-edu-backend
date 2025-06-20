import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as colors from 'colors';
import { Prisma } from '@prisma/client';
import { GetCustomersDto } from './dto/get-customers.dto';
import { CustomersDashboardResponseDto, CustomerResponseDto, CustomerStatsResponseDto } from './dto/customer-response.dto';
import { ApiResponse } from 'src/shared/helper-functions/response';

@Injectable()
export class CustomersService {
    constructor(private prisma: PrismaService) {}

    async getCustomersDashboard(query: GetCustomersDto, userId: string): Promise<ApiResponse<CustomersDashboardResponseDto>> {
        console.log(colors.cyan('Fetching customers dashboard data...'));

        try {
            const {
                page = 1,
                limit = 25,
                search,
                email,
                phone,
                status,
                startDate,
                endDate,
                minTotalValue,
                maxTotalValue,
                sortBy = 'createdAt',
                sortOrder = 'desc'
            } = query;

            const skip = (page - 1) * limit;

            // Build where clause for customers
            const whereClause: any = {};

            if (search) {
                whereClause.OR = [
                    { email: { contains: search, mode: 'insensitive' } },
                    { first_name: { contains: search, mode: 'insensitive' } },
                    { last_name: { contains: search, mode: 'insensitive' } },
                    { phone_number: { contains: search, mode: 'insensitive' } }
                ];
            }

            if (email) {
                whereClause.email = { contains: email, mode: 'insensitive' };
            }

            if (phone) {
                whereClause.phone_number = { contains: phone, mode: 'insensitive' };
            }

            if (status) {
                whereClause.status = status;
            }

            if (startDate || endDate) {
                whereClause.createdAt = {};
                if (startDate) whereClause.createdAt.gte = new Date(startDate);
                if (endDate) whereClause.createdAt.lte = new Date(endDate);
            }

            // Get customers with their order statistics
            const customers = await this.prisma.user.findMany({
                skip,
                take: limit,
                where: whereClause,
                include: {
                    orders: {
                        select: {
                            id: true,
                            total: true,
                            createdAt: true,
                            status: true
                        },
                        orderBy: { createdAt: 'desc' }
                    }
                },
                orderBy: { [sortBy]: sortOrder }
            });

            // Map user level to allowed percentage (number)
            const levelToPercentage: Record<string, number> = {
                bronze: 25,
                silver: 50,
                gold: 75,
                platinum: 100,
                vip: 100
            };

            // Transform customers to include calculated fields
            const transformedCustomers = customers.map(customer => {
                // Calculate customer statistics
                const totalOrders = customer.orders.length;
                const totalValue = customer.orders.reduce((sum: number, order: any) => sum + order.total, 0);
                
                // Calculate total owed (orders that are pending or confirmed)
                const totalOwed = customer.orders
                    .filter((order: any) => ['pending', 'confirmed'].includes(order.status))
                    .reduce((sum: number, order: any) => sum + order.total, 0);

                // Get last order date
                const lastOrder = customer.orders[0];
                const lastOrderDate = lastOrder ? lastOrder.createdAt.toISOString().split('T')[0] : undefined;

                // Map user status
                const statusMap = {
                    'active': 'Active',
                    'suspended': 'Suspended',
                    'inactive': 'Inactive'
                };

                // Use the user's level from the DB
                const level = customer.level || 'bronze';
                const paymentPercentage = levelToPercentage[level] ?? 0;

                return {
                    id: customer.id,
                    name: `${customer.first_name} ${customer.last_name}`,
                    email: customer.email,
                    phone: customer.phone_number,
                    address: customer.address || 'N/A',
                    joinDate: customer.createdAt.toISOString().split('T')[0],
                    totalOrders,
                    totalValue: Math.round(totalValue),
                    totalOwed: Math.round(totalOwed),
                    level,
                    paymentPercentage,
                    lastOrderDate,
                    status: statusMap[customer.status] || customer.status
                };
            });

            // Apply value filters after transformation
            let filteredCustomers = transformedCustomers;
            if (minTotalValue || maxTotalValue) {
                filteredCustomers = transformedCustomers.filter(customer => {
                    if (minTotalValue && customer.totalValue < minTotalValue) return false;
                    if (maxTotalValue && customer.totalValue > maxTotalValue) return false;
                    return true;
                });
            }

            // Get stats
            const [
                totalAdmins,
                totalCustomers,
                activeCustomers,
                totalOrders,
                totalValue,
                totalOwed
            ] = await Promise.all([
                this.prisma.user.count({where: { role: "admin" }}),
                this.prisma.user.count({ where: { role: 'user' } }),
                this.prisma.user.count({ where: { role: 'user', status: 'active' } }),
                this.prisma.order.count(),
                this.prisma.order.aggregate({
                    _sum: { total: true }
                }),
                this.prisma.order.aggregate({
                    where: { status: { in: ['pending', 'confirmed'] } },
                    _sum: { total: true }
                })
            ]);

            const stats = {
                totalAdmins,
                totalCustomers,
                activeCustomers,
                totalOrders,
                totalValue: Math.round(totalValue._sum.total || 0),
                totalOwed: Math.round(totalOwed._sum.total || 0)
            };

            // Fetch the authenticated user's level
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
                select: { level: true }
            });
            const allowedPercentage = user && user.level ? levelToPercentage[user.level] : null;

            console.log(colors.green(`Customers dashboard data retrieved successfully. Found ${filteredCustomers.length} customers`));

            const formatted_response = {
                stats,
                customers: filteredCustomers,
            };

            return new ApiResponse(
                true,
                "Customers dashboard data retrieved successfully",
                formatted_response
            );

        } catch (error) {
            console.log(colors.red('Error fetching customers dashboard:'), error);
            throw error;
        }
    }
} 