import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as colors from 'colors';
import { ApiResponse } from 'src/shared/helper-functions/response';
import { AffiliateStatus } from '@prisma/client';
import slugify from 'slugify';

@Injectable()
export class ReferralsService {
    constructor(private prisma: PrismaService) {}

   

    async fetchAffiliateDashboard(page: number = 1, limit: number = 10, isUsed?: boolean) {
        console.log(colors.cyan('Fetching affiliate dashboard...'));
        try {
            // 1. KPI Cards
            const [
                totalRevenueAgg,
                totalAffiliates,
                totalClicks,
                totalConversions,
                pendingPayoutsAgg
            ] = await Promise.all([
                this.prisma.commission.aggregate({ _sum: { amount: true } }),
                this.prisma.affiliate.count({}),
                this.prisma.referral.count(),
                this.prisma.referral.count({ where: { isUsed: true } }),
                this.prisma.commission.aggregate({ _sum: { amount: true }, where: { status: 'pending' } })
            ]);

            const kpiCards = {
                totalRevenue: Number(totalRevenueAgg._sum.amount || 0),
                totalAffiliates: totalAffiliates,
                totalClicks: totalClicks,
                totalConversions: totalConversions,
                pendingPayouts: Number(pendingPayoutsAgg._sum.amount || 0)
            };

            // 2. Affiliate Settings (mocked or configurable)
            const affiliateSettings = {
                affiliatePercentage: 10, // %
                minimumAffiliates: 1,
                rewardThreshold: 50, // ₦
                expirationDays: 30
            };

            // 3. Leaderboard (top affiliates by revenue)
            const leaderboardUsersRaw = await this.prisma.affiliate.findMany({
                take: 20, // fetch more to allow filtering
                orderBy: { requestedAt: 'asc' },
                include: {
                    user: true
                }
            });
            // Only include affiliates with status 'approved' or 'active'
            const leaderboardUsers = leaderboardUsersRaw.filter(
                aff => aff.status === AffiliateStatus.approved || aff.status === AffiliateStatus.active
            ).slice(0, 10); // limit to top 10 after filtering
            // For each affiliate, calculate revenue, clicks, conversions
            const leaderboard = await Promise.all(leaderboardUsers.map(async (aff) => {
                const revenueAgg = await this.prisma.commission.aggregate({
                    _sum: { amount: true },
                    where: { userId: aff.userId }
                });
                const clicks = await this.prisma.referral.count({ where: { referrerId: aff.userId } });
                const conversions = await this.prisma.referral.count({ where: { referrerId: aff.userId, isUsed: true } });
                return {
                    id: aff.userId,
                    name: aff.userName,
                    email: aff.userEmail,
                    revenue: Number(revenueAgg._sum.amount || 0),
                    clicks,
                    conversions,
                    status: aff.status,
                    joinedAt: aff.createdAt.toISOString()
                };
            }));

            // 4. Overview (summary and trends)
            // For demo, use 'This Month' as selected timeframe
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            const [
                monthRevenueAgg,
                monthClicks,
                monthConversions,
                monthNewAffiliates
            ] = await Promise.all([
                this.prisma.commission.aggregate({ _sum: { amount: true }, where: { createdAt: { gte: startOfMonth, lte: endOfMonth } } }),
                this.prisma.referral.count({ where: { createdAt: { gte: startOfMonth, lte: endOfMonth } } }),
                this.prisma.referral.count({ where: { isUsed: true, createdAt: { gte: startOfMonth, lte: endOfMonth } } }),
                this.prisma.affiliate.count({ where: { createdAt: { gte: startOfMonth, lte: endOfMonth } } })
            ]);
            // Trend data: last 7 days
            const trendData = await Promise.all(Array.from({ length: 7 }).map(async (_, i) => {
                const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
                const nextDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i + 1);
                const revenueAgg = await this.prisma.commission.aggregate({ _sum: { amount: true }, where: { createdAt: { gte: date, lt: nextDate } } });
                const clicks = await this.prisma.referral.count({ where: { createdAt: { gte: date, lt: nextDate } } });
                const conversions = await this.prisma.referral.count({ where: { isUsed: true, createdAt: { gte: date, lt: nextDate } } });
                return {
                    date: date.toISOString().split('T')[0],
                    revenue: Number(revenueAgg._sum.amount || 0),
                    clicks,
                    conversions
                };
            }));
            trendData.reverse(); // Chronological order
            const overview = {
                timeframes: ['Today', 'This Week', 'This Month', 'This Year'],
                selectedTimeframe: 'This Month',
                summary: {
                    revenue: Number(monthRevenueAgg._sum.amount || 0),
                    clicks: monthClicks,
                    conversions: monthConversions,
                    newAffiliates: monthNewAffiliates
                },
                trendData
            };

            // 5. Payouts (pending and completed commissions)
            const payoutsRaw = await this.prisma.commission.findMany({
                orderBy: { createdAt: 'desc' },
                take: 10
            });
            const payouts = await Promise.all(payoutsRaw.map(async (p) => {
                const affiliate = await this.prisma.affiliate.findUnique({ where: { userId: p.userId } });
                return {
                    payoutId: p.id,
                    affiliateId: p.userId,
                    affiliateName: affiliate?.userName || '',
                    amount: Number(p.amount),
                    status: p.status,
                    requestedAt: p.createdAt.toISOString(),
                    paidAt: p.status === 'paid' ? p.updatedAt.toISOString() : null
                };
            }));

            // 6. Events (recent affiliate-related events)
            const eventsRaw = await this.prisma.referral.findMany({
                orderBy: { createdAt: 'desc' },
                take: 10
            });
            const events = await Promise.all(eventsRaw.map(async (evt) => {
                const affiliate = await this.prisma.affiliate.findUnique({ where: { userId: evt.referrerId } });
                return {
                    eventId: evt.id,
                    type: evt.isUsed ? 'conversion' : 'click',
                    affiliateId: evt.referrerId,
                    affiliateName: affiliate?.userName || '',
                    timestamp: evt.createdAt.toISOString(),
                    details: evt.isUsed ? 'User signed up via referral link' : 'Referral link clicked'
                };
            }));

            // 7. Analytics (conversion rate, avg order value, top sources, geo)
            const [totalReferrals, usedReferrals, avgOrderAgg] = await Promise.all([
                this.prisma.referral.count(),
                this.prisma.referral.count({ where: { isUsed: true } }),
                this.prisma.order.aggregate({ _avg: { total: true } })
            ]);
            const conversionRate = totalReferrals > 0 ? (usedReferrals / totalReferrals) * 100 : 0;
            // Top sources (mocked, as no source field in schema)
            const topSources = [
                { source: 'Facebook', clicks: 5000, conversions: 120 },
                { source: 'Twitter', clicks: 3000, conversions: 60 }
            ];
            // Geo distribution (mocked, as no geo field in schema)
            const geoDistribution = [
                { country: 'Nigeria', clicks: 7000, conversions: 150 },
                { country: 'Ghana', clicks: 3000, conversions: 60 }
            ];
            const analytics = {
                conversionRate: Number(conversionRate.toFixed(2)),
                averageOrderValue: Number(avgOrderAgg._avg.total || 0),
                topSources,
                geoDistribution
            };

            // Final formatted response
            const formattedResponse = {
                kpiCards,
                affiliateSettings,
                leaderboard,
                overview,
                payouts,
                events,
                analytics
            };

            console.log(colors.magenta("Affiliate dashboard successfully returned"))
            return {
                success: true,
                message: 'Affiliate dashboard fetched successfully.',
                data: formattedResponse
            };
        } catch (error) {
            console.log(colors.red('Error fetching affiliate dashboard:'), error);
            return {
                success: false,
                message: 'Failed to fetch affiliate dashboard.',
                data: null
            };
        }
    }

    async fetchAllAffiliates(page: number = 1, limit: number = 20, status?: string) {
        console.log(colors.cyan('Fetching all affiliates...'), status);
        try {
            const skip = (page - 1) * limit;
            // Allowed statuses from AffiliateStatus enum
            const allowedStatuses = [
                AffiliateStatus.not_affiliate,
                AffiliateStatus.awaiting_approval,
                AffiliateStatus.pending,
                AffiliateStatus.approved,
                AffiliateStatus.rejected,
                AffiliateStatus.active,
                AffiliateStatus.inactive
            ];
            let whereClause;
            if (status) {
                if (!allowedStatuses.includes(status as AffiliateStatus)) {
                    return {
                        success: false,
                        message: `Invalid status. Allowed statuses: ${allowedStatuses.join(', ')}`,
                        data: null
                    };
                }
                whereClause = { status: status as AffiliateStatus };
            } else {
                whereClause = {
                    OR: [
                        { status: AffiliateStatus.approved },
                        { status: AffiliateStatus.active }
                    ]
                };
            }
            const [affiliates, total] = await Promise.all([
                this.prisma.affiliate.findMany({
                    skip,
                    take: limit,
                    where: whereClause,
                    orderBy: { createdAt: 'desc' },
                    include: {
                        user: {
                            select: {
                                id: true,
                                first_name: true,
                                last_name: true,
                                email: true,
                                phone_number: true,
                                isAffiliate: true,
                                affiliateStatus: true,
                                createdAt: true
                            }
                        }
                    }
                }),
                this.prisma.affiliate.count({ where: whereClause })
            ]);
            const totalPages = Math.ceil(total / limit);
            const formattedAffiliates = affiliates.map(aff => ({
                id: aff.id,
                userId: aff.userId,
                name: aff.userName,
                email: aff.userEmail,
                status: aff.status,
                requestedAt: aff.requestedAt,
                category: aff.category,
                reason: aff.reason,
                reviewedAt: aff.reviewedAt,
                reviewedByName: aff.reviewedByName,
                reviewedByEmail: aff.reviewedByEmail,
                notes: aff.notes,
                user: aff.user
            }));
            return {
                success: true,
                message: 'Affiliates fetched successfully.',
                data: {
                    pagination: {
                        currentPage: page,
                        totalPages,
                        totalItems: total,
                        itemsPerPage: limit
                    },
                    affiliates: formattedAffiliates,
                }
            };
        } catch (error) {
            console.log(colors.red('Error fetching affiliates:'), error);
            return {
                success: false,
                message: 'Failed to fetch affiliates.',
                data: null
            };
        }
    }

    async updateAffiliateStatus(affiliateId: string, newStatus: string) {

        console.log(colors.cyan(`Updating affiliate status for ${affiliateId} to ${newStatus}`));
        // List of allowed statuses from schema.prisma AffiliateStatus enum
        const allowedStatuses = [
            'not_affiliate',
            'awaiting_approval',
            'pending',
            'approved',
            'rejected',
            'active',
            'inactive'
        ];
        if (!allowedStatuses.includes(newStatus.toLowerCase())) {
            console.log(colors.red(`Invalid status. Allowed statuses: ${allowedStatuses.join(', ')}`))
            return {
                success: false,
                message: `Invalid status. Allowed statuses: ${allowedStatuses.join(', ')}`,
                data: null
            };
        }
        try {
            // Check if affiliate record exists
            const affiliateRecord = await this.prisma.affiliate.findFirst({ where: { id: affiliateId } });
            if (!affiliateRecord) {
                console.log(colors.red('Affiliate record not found.'))
                return {
                    success: false,
                    message: 'Affiliate record not found.',
                    data: null
                };
            }
            // Update affiliate record
            const updated = await this.prisma.affiliate.update({
                where: { id: affiliateId },
                data: { status: newStatus as AffiliateStatus }
            });
            // Determine isAffiliate value
            const isAffiliate = (newStatus === 'approved' || newStatus === 'active');
            // Update the affiliateStatus and isAffiliate in the related use r record
            await this.prisma.user.update({
                where: { id: updated.userId },
                data: {
                    affiliateStatus: newStatus as AffiliateStatus,
                    isAffiliate: isAffiliate
                }
            });

            console.log(colors.magenta(`Affiliate status updated to ${newStatus}`))
            return {
                success: true,
                message: `Affiliate status updated to ${newStatus}`,
                data: updated
            };
        } catch (error) {
            console.log(colors.red('Error updating affiliate status:'), error);
            return {
                success: false,
                message: 'Failed to update affiliate status.',
                data: null
            };
        }
    }

    /**
     * Generate a unique affiliate link for a user and product
     */
    async generateAffiliateLink(userId: string, productId: string) {
        console.log(colors.cyan("generating affiliate link"));
        try {
            // Check if user is an approved/active affiliate
            const affiliate = await this.prisma.affiliate.findUnique({ where: { userId } });
            if (!affiliate || !(affiliate.status === AffiliateStatus.approved || affiliate.status === AffiliateStatus.active)) {
                console.log(colors.red('User is not an approved or active affiliate.'));
                return {
                    success: false,
                    message: 'User is not an approved or active affiliate.',
                    data: null
                };
            } 
            // Check if product exists
            const product = await this.prisma.product.findUnique({ where: { id: productId } });
            if (!product) {
                console.log(colors.red('Product not found.'));
                return {
                    success: false,
                    message: 'Product not found.',
                    data: null
                };
            }
            // Check if link already exists for this user-product
            const existing = await this.prisma.affiliateLink.findUnique({ where: { userId_productId: { userId, productId } } });
            if (existing) {
                console.log(colors.yellow('Affiliate link already exists.'));
                return {
                    success: true,
                    message: 'Affiliate link already exists.', 
                    data: existing 
                };
            }
            // Generate a unique slug
            let baseSlug = slugify(`${affiliate.userName}-${product.name}`, { lower: true, strict: true });
            let slug = baseSlug;
            let i = 1;
            while (await this.prisma.affiliateLink.findUnique({ where: { slug } })) {
                slug = `${baseSlug}-${i++}`;
            }
            // Create the link
            const link = await this.prisma.affiliateLink.create({
                data: {
                    userId,
                    productId,
                    slug
                }
            });
            // Construct shareable link
            const baseUrl = process.env.BASE_URL?.replace(/\/$/, '') || 'http://localhost:3000';
            const productSlug = product.id;
            const shareableLink = `${baseUrl}/product/${productSlug}?ref=${link.slug}`;
            console.log(colors.green('Affiliate link generated successfully.'));
            return {
                success: true,
                message: 'Affiliate link generated successfully.',
                data: {
                    ...link,
                    shareableLink
                }
            };
        } catch (error) {
            console.log(colors.red('Error generating affiliate link:'), error);
            return {
                success: false, 
                message: 'Failed to generate affiliate link.',
                data: null,
                error: error?.message || error
            };
        }
    }

    /**
     * Get all affiliate links for a user
     */
    async getAffiliateLinksForUser(userId: string) {
        console.log(colors.cyan('Fetching affiliate links for user...'));
        try {
            const links = await this.prisma.affiliateLink.findMany({
                where: { userId },
                include: {
                    product: true
                }
            });
            console.log(colors.green('Affiliate links fetched successfully.'));
            return {
                success: true,
                message: 'Affiliate links fetched successfully.',
                data: links
            };
        } catch (error) {
            console.log(colors.red('Error fetching affiliate links:'), error);
            return {
                success: false,
                message: 'Failed to fetch affiliate links.',
                data: null,
                error: error?.message || error
            };
        }
    }

    /**
     * Track a click on an affiliate link (by slug)
     */
    async trackAffiliateLinkClick(slug: string) {
        console.log(colors.cyan('Tracking click for affiliate link...'));
        try {
            const link = await this.prisma.affiliateLink.findUnique({ where: { slug } });
            if (!link) {
                console.log(colors.red('Affiliate link not found.'));
                return {
                    success: false,
                    message: 'Affiliate link not found.',
                    data: null
                };
            }
            await this.prisma.affiliateLink.update({
                where: { slug },
                data: { clicks: { increment: 1 } }
            });
            console.log(colors.green('Click tracked.'));
            return {
                success: true,
                message: 'Click tracked.',
                data: null
            };
        } catch (error) {
            console.log(colors.red('Error tracking click:'), error);
            return {
                success: false,
                message: 'Failed to track click.',
                data: null,
                error: error?.message || error
            };
        }
    }

    /**
     * Track a conversion/order for an affiliate link (by slug)
     * Optionally increment commission
     */
    async trackAffiliateLinkConversion(slug: string, orderId: string, commissionAmount: number = 0) {
        console.log(colors.cyan('Tracking conversion for affiliate link...'));
        try {
            const link = await this.prisma.affiliateLink.findUnique({ where: { slug } });
            if (!link) {
                console.log(colors.red('Affiliate link not found.'));
                return {
                    success: false,
                    message: 'Affiliate link not found.',
                    data: null
                };
            }
            await this.prisma.affiliateLink.update({
                where: { slug },
                data: {
                    orders: { increment: 1 },
                    commission: { increment: commissionAmount }
                }
            });
            // Optionally, you can also create a record in a conversion table or log
            console.log(colors.green('Conversion tracked.'));
            return {
                success: true,
                message: 'Conversion tracked.',
                data: null
            };
        } catch (error) {
            console.log(colors.red('Error tracking conversion:'), error);
            return {
                success: false,
                message: 'Failed to track conversion.',
                data: null,
                error: error?.message || error
            };
        }
    }

    /**
     * Get affiliate link for a user and product
     */
    async getAffiliateLinkForUserAndProduct(userId: string, productId: string) {
        console.log(colors.cyan('Fetching affiliate link for user and product...'));
        try {
            const link = await this.prisma.affiliateLink.findUnique({ where: { userId_productId: { userId, productId } } });
            if (!link) {
                return {
                    success: true,
                    message: 'No affiliate link found for this user and product.',
                    data: null
                };
            }
            // Get product for shareable link
            const product = await this.prisma.product.findUnique({ where: { id: productId } });
            const baseUrl = process.env.BASE_URL?.replace(/\/$/, '') || 'http://localhost:3000';
            const productSlug = product?.id;
            const shareableLink = `${baseUrl}/product/${productSlug}?ref=${link.slug}`;
            return {
                success: true,
                message: 'Affiliate link found.',
                data: {
                    ...link,
                    shareableLink
                }
            };
        } catch (error) {
            console.log(colors.red('Error fetching affiliate link for user and product:'), error);
            return {
                success: false,
                message: 'Failed to fetch affiliate link for user and product.',
                data: null,
                error: error?.message || error
            };
        }
    }

} 