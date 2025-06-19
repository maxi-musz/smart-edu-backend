import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as colors from 'colors';
import { ApiResponse } from 'src/shared/helper-functions/response';

@Injectable()
export class DashboardService {
    constructor(private prisma: PrismaService) {}

    async getDashboardStats() {
        console.log(colors.cyan('Fetching comprehensive dashboard statistics...'));

        try {
            // Get current date and previous month for calculations
            const now = new Date();
            const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
            const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, now.getDate());

            // 1. Calculate KPIs with change percentages
            const kpis = await this.calculateKPIs(now, previousMonth, twoMonthsAgo);

            // 2. Get sales data for charts
            const salesData = await this.getSalesData();

            // 3. Get revenue breakdown by category
            const revenueBreakdown = await this.getRevenueBreakdown();

            // 4. Get recent orders
            const recentOrders = await this.getRecentOrders();

            // 5. Get top performing products
            const topProducts = await this.getTopProducts();

            // 6. Get notifications
            const notifications = await this.getNotifications();

            // 7. Get recent customers
            const recentCustomers = await this.getRecentCustomers();

            const dashboardData = {
                dashboard: {
                    kpis,
                    salesData,
                    revenueBreakdown,
                    recentOrders,
                    topBooks: topProducts, // Using topProducts as topBooks
                    notifications,
                    recentCustomers
                },
                metadata: {
                    lastUpdated: now.toISOString(),
                    timezone: "Africa/Lagos",
                    currency: "NGN",
                    currencySymbol: "₦"
                }
            };

            console.log(colors.magenta('Dashboard statistics retrieved successfully'));
            return new ApiResponse(
                true,
                "Dashboard statistics retrieved successfully",
                dashboardData
            );

        } catch (error) {
            console.log(colors.red('Error fetching dashboard statistics:'), error);
            throw error;
        }
    }

    private async calculateKPIs(currentDate: Date, previousMonth: Date, twoMonthsAgo: Date) {
        // Get current month data
        const currentMonthRevenue = await this.prisma.order.aggregate({
            _sum: { total: true },
            where: {
                status: 'delivered',
                createdAt: {
                    gte: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
                }
            }
        });

        const currentMonthOrders = await this.prisma.order.count({
            where: {
                status: 'delivered',
                createdAt: {
                    gte: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
                }
            }
        });

        const currentMonthCustomers = await this.prisma.user.count({
            where: {
                role: 'user',
                createdAt: {
                    gte: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
                }
            }
        });

        // Get previous month data for comparison
        const previousMonthRevenue = await this.prisma.order.aggregate({
            _sum: { total: true },
            where: {
                status: 'delivered',
                createdAt: {
                    gte: previousMonth,
                    lt: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
                }
            }
        });

        const previousMonthOrders = await this.prisma.order.count({
            where: {
                status: 'delivered',
                createdAt: {
                    gte: previousMonth,
                    lt: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
                }
            }
        });

        const previousMonthCustomers = await this.prisma.user.count({
            where: {
                role: 'user',
                createdAt: {
                    gte: previousMonth,
                    lt: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
                }
            }
        });

        // Calculate changes
        const revenueChange = this.calculatePercentageChange(
            previousMonthRevenue._sum.total || 0,
            currentMonthRevenue._sum.total || 0
        );

        const ordersChange = this.calculatePercentageChange(
            previousMonthOrders,
            currentMonthOrders
        );

        const customersChange = this.calculatePercentageChange(
            previousMonthCustomers,
            currentMonthCustomers
        );

        // Calculate average order value
        const totalRevenue = currentMonthRevenue._sum.total || 0;
        const totalOrders = currentMonthOrders;
        const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        // Get previous month average for comparison
        const previousMonthAvg = previousMonthOrders > 0 ? (previousMonthRevenue._sum.total || 0) / previousMonthOrders : 0;
        const avgOrderValueChange = this.calculatePercentageChange(previousMonthAvg, averageOrderValue);

        // Get active customers (users with orders in last 30 days)
        const activeCustomers = await this.prisma.user.count({
            where: {
                role: 'user',
                orders: {
                    some: {
                        createdAt: {
                            gte: new Date(currentDate.getTime() - 30 * 24 * 60 * 60 * 1000)
                        }
                    }
                }
            }
        });

        return [
            {
                title: "Total Revenue",
                value: Math.round(totalRevenue),
                change: Math.abs(revenueChange),
                changeType: revenueChange >= 0 ? "increase" : "decrease",
                icon: "DollarSign",
                color: "purple",
                format: "currency"
            },
            {
                title: "Total Orders",
                value: totalOrders,
                change: Math.abs(ordersChange),
                changeType: ordersChange >= 0 ? "increase" : "decrease",
                icon: "ShoppingCart",
                color: "blue",
                format: "number"
            },
            {
                title: "Active Customers",
                value: activeCustomers,
                change: Math.abs(customersChange),
                changeType: customersChange >= 0 ? "increase" : "decrease",
                icon: "Users",
                color: "green",
                format: "number"
            },
            {
                title: "Average Order Value",
                value: Math.round(averageOrderValue),
                change: Math.abs(avgOrderValueChange),
                changeType: avgOrderValueChange >= 0 ? "increase" : "decrease",
                icon: "BarChart3",
                color: "indigo",
                format: "currency"
            }
        ];
    }

    private async getSalesData() {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
        const currentYear = new Date().getFullYear();
        
        const salesData = await Promise.all(
            months.map(async (month, index) => {
                const monthStart = new Date(currentYear, index, 1);
                const monthEnd = new Date(currentYear, index + 1, 0);

                const monthOrders = await this.prisma.order.findMany({
                    where: {
                        status: 'delivered',
                        createdAt: {
                            gte: monthStart,
                            lte: monthEnd
                        }
                    },
                    include: {
                        items: true
                    }
                });

                const sales = monthOrders.length;
                const revenue = monthOrders.reduce((sum, order) => sum + order.total, 0);
                const orders = monthOrders.length;

                return { sales, revenue, orders };
            })
        );

        return {
            labels: months,
            sales: salesData.map(d => d.sales),
            revenue: salesData.map(d => Math.round(d.revenue)),
            orders: salesData.map(d => d.orders)
        };
    }

    private async getRevenueBreakdown() {
        const categories = await this.prisma.category.findMany({
            include: {
                products: {
                    include: {
                        orderItems: {
                            include: {
                                order: true
                            }
                        }
                    }
                }
            }
        });

        const totalRevenue = await this.prisma.order.aggregate({
            _sum: { total: true },
            where: { status: 'delivered' }
        });

        const categoryColors = [
            "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6",
            "#06B6D4", "#84CC16", "#F97316", "#EC4899", "#6366F1"
        ];

        const breakdown = categories.map((category, index) => {
            const categoryRevenue = category.products.reduce((sum, product) => {
                return sum + product.orderItems.reduce((itemSum, item) => {
                    return itemSum + (item.order && item.order.status === 'delivered' ? item.price * item.quantity : 0);
                }, 0);
            }, 0);

            const percentage = totalRevenue._sum.total ? (categoryRevenue / totalRevenue._sum.total) * 100 : 0;

            return {
                category: category.name,
                amount: Math.round(categoryRevenue),
                percentage: Math.round(percentage),
                color: categoryColors[index % categoryColors.length]
            };
        });

        // Sort by amount descending and take top 5
        return breakdown
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 5);
    }

    private async getRecentOrders() {
        const orders = await this.prisma.order.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: {
                        id: true,
                        first_name: true,
                        last_name: true,
                        email: true
                    }
                },
                items: {
                    select: {
                        quantity: true
                    }
                }
            }
        });

        return orders.map((order, index) => ({
            id: order.id,
            customerName: `${order.user.first_name} ${order.user.last_name}`,
            customerEmail: order.user.email,
            orderNumber: `#ORD-${order.id.slice(-8).toUpperCase()}`,
            amount: Math.round(order.total),
            status: order.status,
            date: order.createdAt.toISOString().split('T')[0],
            items: order.items.reduce((sum, item) => sum + item.quantity, 0)
        }));
    }

    private async getTopProducts() {
        const products = await this.prisma.product.findMany({
            include: {
                category: true,
                orderItems: {
                    include: {
                        order: true
                    }
                }
            },
            orderBy: {
                orderItems: {
                    _count: 'desc'
                }
            },
            take: 4
        });

        return products.map(product => {
            const sales = product.orderItems.reduce((sum, item) => {
                return sum + (item.order && item.order.status === 'delivered' ? item.quantity : 0);
            }, 0);

            const revenue = product.orderItems.reduce((sum, item) => {
                return sum + (item.order && item.order.status === 'delivered' ? item.price * item.quantity : 0);
            }, 0);

            // Mock rating (you can implement real rating system later)
            const rating = 4.5 + Math.random() * 0.5;

            return {
                id: product.id,
                name: product.name,
                category: product.category.name,
                image: product.images.length > 0 ? product.images[0] : "/images/books/default.jpg",
                sales,
                revenue: Math.round(revenue),
                stock: product.stock,
                rating: Math.round(rating * 10) / 10
            };
        });
    }

    private async getNotifications() {
        const notifications = await this.prisma.notification.findMany({
            take: 4,
            orderBy: { createdAt: 'desc' }
        });

        const notificationTypes = ['order', 'customer', 'system', 'alert'];
        const priorities = ['low', 'medium', 'high'];

        return notifications.map((notification, index) => ({
            id: notification.id,
            type: notificationTypes[index % notificationTypes.length],
            title: notification.title,
            message: notification.description,
            time: this.getTimeAgo(notification.createdAt),
            read: index > 1, // Mock read status
            priority: priorities[index % priorities.length]
        }));
    }

    private async getRecentCustomers() {
        const customers = await this.prisma.user.findMany({
            where: { role: 'user' },
            take: 4,
            orderBy: { createdAt: 'desc' },
            include: {
                orders: {
                    where: { status: 'delivered' }
                }
            }
        });

        return customers.map(customer => {
            const totalOrders = customer.orders.length;
            const totalSpent = customer.orders.reduce((sum, order) => sum + order.total, 0);
            
            // Determine status based on order count and recency
            let status = 'new';
            if (totalOrders > 5) status = 'active';
            else if (totalOrders > 0) status = 'active';

            return {
                id: customer.id,
                name: `${customer.first_name} ${customer.last_name}`,
                email: customer.email,
                avatar: customer.display_picture || "/images/avatars/default.jpg",
                joinDate: customer.createdAt.toISOString().split('T')[0],
                totalOrders,
                totalSpent: Math.round(totalSpent),
                status
            };
        });
    }

    private calculatePercentageChange(previous: number, current: number): number {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
    }

    private getTimeAgo(date: Date): string {
        const now = new Date();
        const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
        
        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
        
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours} hours ago`;
        
        const diffInDays = Math.floor(diffInHours / 24);
        return `${diffInDays} days ago`;
    }

    async getRevenueAnalytics(period: 'daily' | 'weekly' | 'monthly' = 'monthly') {
        console.log(colors.cyan(`Fetching revenue analytics for period: ${period}`));

        try {
            const now = new Date();
            let startDate: Date;

            switch (period) {
                case 'daily':
                    startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                    break;
                case 'weekly':
                    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    break;
                case 'monthly':
                    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                    break;
                default:
                    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            }

            const revenueData = await this.prisma.order.groupBy({
                by: ['createdAt'],
                _sum: {
                    total: true
                },
                where: {
                    status: 'delivered',
                    createdAt: {
                        gte: startDate
                    }
                },
                orderBy: {
                    createdAt: 'asc'
                }
            });

            console.log(colors.magenta('Revenue analytics retrieved successfully'));
            return revenueData;

        } catch (error) {
            console.log(colors.red('Error fetching revenue analytics:'), error);
            throw error;
        }
    }

    async getTopPerformingStores(limit: number = 10) {
        console.log(colors.cyan(`Fetching top performing stores (limit: ${limit})`));

        try {
            const topStores = await this.prisma.store.findMany({
                take: limit,
                include: {
                    _count: {
                        select: {
                            products: true,
                            orders: true
                        }
                    },
                    orders: {
                        where: {
                            status: 'delivered'
                        },
                        select: {
                            total: true
                        }
                    }
                },
                orderBy: {
                    orders: {
                        _count: 'desc'
                    }
                }
            });

            // Calculate total revenue for each store
            const storesWithRevenue = topStores.map(store => ({
                ...store,
                totalRevenue: store.orders.reduce((sum, order) => sum + order.total, 0)
            }));

            console.log(colors.magenta('Top performing stores retrieved successfully'));
            return storesWithRevenue;

        } catch (error) {
            console.log(colors.red('Error fetching top performing stores:'), error);
            throw error;
        }
    }
} 