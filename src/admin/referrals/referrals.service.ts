import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as colors from 'colors';
import { ApiResponse } from 'src/shared/helper-functions/response';

@Injectable()
export class ReferralsService {
    constructor(private prisma: PrismaService) {}

    async getAllReferrals(page: number = 1, limit: number = 10, isUsed?: boolean) {
        console.log(colors.cyan('Fetching all referrals...'));

        try {
            const skip = (page - 1) * limit;
            
            const whereClause = isUsed !== undefined ? { isUsed } : {};

            const [referrals, total] = await Promise.all([
                this.prisma.referral.findMany({
                    skip,
                    take: limit,
                    where: whereClause,
                    include: {
                        referrer: {
                            select: {
                                id: true,
                                first_name: true,
                                last_name: true,
                                email: true
                            }
                        },
                        referred: {
                            select: {
                                id: true,
                                first_name: true,
                                last_name: true,
                                email: true
                            }
                        }
                    },
                    orderBy: { createdAt: 'desc' }
                }),
                this.prisma.referral.count({ where: whereClause })
            ]);

            const totalPages = Math.ceil(total / limit);

            console.log(colors.magenta(`Referrals retrieved successfully. Page ${page} of ${totalPages}`));
            return {
                referrals,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalItems: total,
                    itemsPerPage: limit
                }
            };

        } catch (error) {
            console.log(colors.red('Error fetching referrals:'), error);
            throw error;
        }
    }

    async getReferralById(id: string) {
        console.log(colors.cyan(`Fetching referral with ID: ${id}`));

        try {
            const referral = await this.prisma.referral.findUnique({
                where: { id },
                include: {
                    referrer: {
                        select: {
                            id: true,
                            first_name: true,
                            last_name: true,
                            email: true,
                            phone_number: true
                        }
                    },
                    referred: {
                        select: {
                            id: true,
                            first_name: true,
                            last_name: true,
                            email: true,
                            phone_number: true,
                            createdAt: true
                        }
                    }
                }
            });

            if (!referral) {
                throw new NotFoundException('Referral not found');
            }

            console.log(colors.magenta('Referral retrieved successfully'));
            return referral;

        } catch (error) {
            console.log(colors.red('Error fetching referral:'), error);
            throw error;
        }
    }

    async updateReferralUsage(id: string, isUsed: boolean) {
        console.log(colors.cyan(`Updating referral usage to: ${isUsed}`));

        try {
            const referral = await this.prisma.referral.findUnique({
                where: { id }
            });

            if (!referral) {
                throw new NotFoundException('Referral not found');
            }

            const updatedReferral = await this.prisma.referral.update({
                where: { id },
                data: { isUsed },
                include: {
                    referrer: {
                        select: {
                            id: true,
                            first_name: true,
                            last_name: true,
                            email: true
                        }
                    },
                    referred: {
                        select: {
                            id: true,
                            first_name: true,
                            last_name: true,
                            email: true
                        }
                    }
                }
            });

            console.log(colors.magenta(`Referral usage updated to: ${isUsed}`));
            return updatedReferral;

        } catch (error) {
            console.log(colors.red('Error updating referral usage:'), error);
            throw error;
        }
    }

    async getReferralsByUser(userId: string, page: number = 1, limit: number = 10) {
        console.log(colors.cyan(`Fetching referrals for user: ${userId}`));

        try {
            const skip = (page - 1) * limit;

            const [referrals, total] = await Promise.all([
                this.prisma.referral.findMany({
                    skip,
                    take: limit,
                    where: { referrerId: userId },
                    include: {
                        referred: {
                            select: {
                                id: true,
                                first_name: true,
                                last_name: true,
                                email: true,
                                createdAt: true
                            }
                        }
                    },
                    orderBy: { createdAt: 'desc' }
                }),
                this.prisma.referral.count({ where: { referrerId: userId } })
            ]);

            const totalPages = Math.ceil(total / limit);

            console.log(colors.magenta(`User referrals retrieved successfully. Page ${page} of ${totalPages}`));
            return {
                referrals,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalItems: total,
                    itemsPerPage: limit
                }
            };

        } catch (error) {
            console.log(colors.red('Error fetching user referrals:'), error);
            throw error;
        }
    }

    async getReferralAnalytics() {
        console.log(colors.cyan('Fetching comprehensive referral analytics...'));

        try {
            // 1. Get referral analytics with detailed information
            const referralAnalytics = await this.prisma.referral.findMany({
                include: {
                    referrer: {
                        select: {
                            id: true,
                            first_name: true,
                            last_name: true,
                            email: true,
                            phone_number: true,
                            display_picture: true
                        }
                    },
                    referred: {
                        select: {
                            id: true,
                            first_name: true,
                            last_name: true,
                            email: true,
                            phone_number: true,
                            display_picture: true
                        }
                    },
                    product: {
                        select: {
                            id: true,
                            name: true,
                            sellingPrice: true,
                            commission: true
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                }
            });

            // 2. Get top referrers with aggregated data
            const topReferrers = await this.prisma.user.findMany({
                where: {
                    referrals_made: {
                        some: {}
                    }
                },
                include: {
                    _count: {
                        select: {
                            referrals_made: true
                        }
                    },
                    referrals_made: {
                        include: {
                            product: true
                        }
                    },
                    commissions: {
                        where: {
                            status: 'paid'
                        }
                    }
                },
                orderBy: {
                    referrals_made: {
                        _count: 'desc'
                    }
                },
                take: 5
            });

            // 3. Get commission payouts data
            const commissionPayouts = await this.prisma.user.findMany({
                where: {
                    commissions: {
                        some: {}
                    }
                },
                include: {
                    commissions: {
                        include: {
                            order: true
                        }
                    }
                },
                orderBy: {
                    commissions: {
                        _count: 'desc'
                    }
                },
                take: 3
            });

            // 4. Get recent referral events
            const referralEvents = await this.prisma.referral.findMany({
                take: 10,
                include: {
                    referrer: {
                        select: {
                            first_name: true,
                            last_name: true
                        }
                    },
                    referred: {
                        select: {
                            first_name: true,
                            last_name: true
                        }
                    },
                    product: true
                },
                orderBy: {
                    createdAt: 'desc'
                }
            });

            // 5. Generate performance data (last 6 months)
            const performanceData = await this.generatePerformanceData();

            // 6. Generate source breakdown (mock data based on referral codes)
            const sourceBreakdown = this.generateSourceBreakdown(referralAnalytics);

            // 7. Generate regional data (mock data)
            const regionalData = this.generateRegionalData();

            // Transform the data to match the desired format
            const transformedReferralAnalytics = referralAnalytics.map((referral, index) => ({
                id: referral.id,
                referrer: {
                    id: referral.referrer.id,
                    name: `${referral.referrer.first_name} ${referral.referrer.last_name}`,
                    email: referral.referrer.email,
                    phone: referral.referrer.phone_number,
                    referralCode: referral.code,
                    avatar: referral.referrer.display_picture
                },
                referred: {
                    id: referral.referred.id,
                    name: `${referral.referred.first_name} ${referral.referred.last_name}`,
                    email: referral.referred.email,
                    phone: referral.referred.phone_number,
                    avatar: referral.referred.display_picture
                },
                date: referral.createdAt.toISOString().split('T')[0],
                status: this.mapReferralStatus(referral.status),
                reward: referral.product.commission || 5000,
                rewardStatus: this.mapRewardStatus(referral.status),
                conversionDate: referral.isUsed ? referral.updatedAt.toISOString().split('T')[0] : null,
                source: this.determineSource(referral.code),
                region: this.determineRegion(referral.referred.phone_number || ""),
                orderAmount: referral.product.sellingPrice || 50000,
                commissionRate: referral.product.commission || 10
            }));

            const transformedTopReferrers = topReferrers.map((referrer, index) => {
                const totalRevenue = referrer.referrals_made.reduce((sum, ref) => {
                    return sum + (ref.product?.sellingPrice || 0);
                }, 0);
                
                const totalCommission = referrer.commissions.reduce((sum, comm) => {
                    return sum + comm.amount;
                }, 0);

                return {
                    id: referrer.id,
                    name: `${referrer.first_name} ${referrer.last_name}`,
                    referralCode: referrer.referrals_made[0]?.code || 'N/A',
                    referredUsers: referrer._count.referrals_made,
                    referralOrders: referrer.referrals_made.filter(ref => ref.isUsed).length,
                    revenueGenerated: totalRevenue,
                    commission: totalCommission,
                    avatar: referrer.display_picture,
                    rank: index + 1
                };
            });

            const transformedCommissionPayouts = commissionPayouts.map(payout => {
                const totalEarned = payout.commissions.reduce((sum, comm) => sum + comm.amount, 0);
                const totalPaid = payout.commissions
                    .filter(comm => comm.status === 'paid')
                    .reduce((sum, comm) => sum + comm.amount, 0);
                const pending = totalEarned - totalPaid;

                return {
                    referrerId: payout.id,
                    referrerName: `${payout.first_name} ${payout.last_name}`,
                    commissionEarned: totalEarned,
                    paid: totalPaid,
                    pending: pending,
                    lastPayout: payout.commissions.length > 0 
                        ? payout.commissions[0].updatedAt.toISOString().split('T')[0] 
                        : null,
                    payoutMethod: 'Bank Transfer', // Mock data
                    avatar: payout.display_picture
                };
            });

            const transformedReferralEvents = referralEvents.map(event => ({
                date: event.createdAt.toISOString().split('T')[0],
                referrer: `${event.referrer.first_name} ${event.referrer.last_name}`,
                referredUser: `${event.referred.first_name} ${event.referred.last_name}`,
                action: event.isUsed ? 'Purchase' : 'Signup',
                commission: event.isUsed ? (event.product?.commission || 0) : 0,
                orderAmount: event.isUsed ? (event.product?.sellingPrice || 0) : 0
            }));

            const result = {
                referralAnalytics: transformedReferralAnalytics,
                topReferrers: transformedTopReferrers,
                commissionPayouts: transformedCommissionPayouts,
                referralEvents: transformedReferralEvents,
                performanceData,
                sourceBreakdown,
                regionalData
            };

            console.log(colors.magenta('Referral analytics retrieved successfully'));
            return new ApiResponse(
                true,
                "Referral analytics retrieved successfully",
                result
            );

        } catch (error) {
            console.log(colors.red('Error fetching referral analytics:'), error);
            throw error;
        }
    }

    private mapReferralStatus(status: string): string {
        switch (status) {
            case 'pending':
                return 'Pending';
            case 'completed':
                return 'Completed';
            case 'cancelled':
                return 'Expired';
            default:
                return 'Pending';
        }
    }

    private mapRewardStatus(status: string): string {
        switch (status) {
            case 'completed':
                return 'Paid';
            case 'pending':
                return 'Pending';
            case 'cancelled':
                return 'Pending';
            default:
                return 'Pending';
        }
    }

    private determineSource(code: string): string {
        // Mock logic to determine source based on referral code
        const sources = ['WhatsApp', 'Facebook', 'Instagram', 'Email', 'Direct'];
        const hash = code.split('').reduce((a, b) => {
            a = ((a << 5) - a) + b.charCodeAt(0);
            return a & a;
        }, 0);
        return sources[Math.abs(hash) % sources.length];
    }

    private determineRegion(phone: string): string {
        // Mock logic to determine region based on phone number
        const regions = ['Lagos', 'Abuja', 'Port Harcourt', 'Kano', 'Others'];
        const hash = phone.split('').reduce((a, b) => {
            a = ((a << 5) - a) + b.charCodeAt(0);
            return a & a;
        }, 0);
        return regions[Math.abs(hash) % regions.length];
    }

    private async generatePerformanceData() {
        // Generate mock performance data for last 6 months
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
        const referredUsers = [120, 150, 180, 220, 280, 320];
        const referralOrders = [85, 110, 130, 160, 200, 240];
        const revenue = [850000, 1100000, 1300000, 1600000, 2000000, 2400000];
        const commissions = [85000, 110000, 130000, 160000, 200000, 240000];

        return {
            labels: months,
            referredUsers,
            referralOrders,
            revenue,
            commissions
        };
    }

    private generateSourceBreakdown(referrals: any[]) {
        const sources = ['WhatsApp', 'Facebook', 'Instagram', 'Email', 'Direct'];
        const total = referrals.length;
        
        return sources.map(source => {
            const count = Math.floor(Math.random() * (total / sources.length)) + 1;
            const percentage = Math.round((count / total) * 100);
            return { source, count, percentage };
        });
    }

    private generateRegionalData() {
        const regions = [
            { region: 'Lagos', referrals: 45, revenue: 2250000 },
            { region: 'Abuja', referrals: 32, revenue: 1600000 },
            { region: 'Port Harcourt', referrals: 28, revenue: 1400000 },
            { region: 'Kano', referrals: 22, revenue: 1100000 },
            { region: 'Others', referrals: 15, revenue: 750000 }
        ];
        return regions;
    }

    async getReferralConversionRate() {
        console.log(colors.cyan('Calculating referral conversion rate...'));

        try {
            const totalReferrals = await this.prisma.referral.count();
            const usedReferrals = await this.prisma.referral.count({
                where: { isUsed: true }
            });

            const conversionRate = totalReferrals > 0 ? (usedReferrals / totalReferrals) * 100 : 0;

            console.log(colors.magenta(`Referral conversion rate: ${conversionRate.toFixed(2)}%`));
            return {
                totalReferrals,
                usedReferrals,
                conversionRate: parseFloat(conversionRate.toFixed(2))
            };

        } catch (error) {
            console.log(colors.red('Error calculating referral conversion rate:'), error);
            throw error;
        }
    }
} 