import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as colors from "colors";
import { ApiResponse } from 'src/shared/helper-functions/response';
import { requestAffiliatePermissionDto } from './dto/afiliate.dto';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserAllowedPartialpayment(payload) {

    console.log(colors.cyan("Fetching user details for payment"))

    try {
        
        const existingUser = await this.prisma.user.findFirst({
            where: { email: payload.email },
            select: { id: true, allowedPartialPayment: true }
        });

        const formattedUser = {
            id: existingUser?.id,
            allowedPartialPayment: existingUser?.allowedPartialPayment
        }

        console.log(colors.magenta("Users partial payment details retrieved"))
        return new ApiResponse(
            true,
            "User partial opayment details successfully fetched",
            formattedUser
        )

    } catch (error) {
        console.log(colors.red("Error fetching details: "), error)
        return new ApiResponse(
            false,
            "Error fetching partial payment details "
        )
    }
  }

  async requestToBecomeAnAffiliate(dto: requestAffiliatePermissionDto, payload: any) {

    console.log(colors.cyan("requesting to become an affiliate"), dto)

    try {
      // Fetch user
      const user = await this.prisma.user.findFirst({ where: { email: payload.email } });
      if (!user) {
        return new ApiResponse(false, 'User not found.');
      }
      if (user.isAffiliate) {
        console.log(colors.red("User is already an affiliate"))
        return new ApiResponse(false, 'You are already an affiliate.');
      }
      if (user.affiliateStatus === 'pending') {
        console.log(colors.red("You already have a pending affiliate request."))
        return new ApiResponse(false, 'You already have a pending affiliate request.');
      }
      // Check if there is already a pending Affiliate
      const existingRequest = await this.prisma.affiliate.findFirst({
        where: { userId: user.id, status: 'pending' }
      });
      if (existingRequest) {
        console.log(colors.red("You already have a pending affiliate request."))
        return new ApiResponse(false, 'You already have a pending affiliate request.');
      }
      // Create Affiliate record (request)
      const newAffiliate = await this.prisma.affiliate.create({
        data: {
          userId: user.id,
          userName: user.first_name + ' ' + user.last_name,
          userEmail: user.email,
          status: 'pending',
          requestedAt: new Date(),
          category: dto.niche,
          reason: dto.reason || "",
          reviewedAt: null,
          reviewedByName: null,
          reviewedByEmail: null,
          notes: null
        }
      });

      //   also update the is affiliate and affiliate status in the user model to true and awaiting approval respectively 
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          isAffiliate: false,
          affiliateStatus: 'awaiting_approval',
        },
      });

      const formattedResponse = {
        id: user.id,
        userName: user.first_name + ' ' + user.last_name,
        userEmail: user.email,
        status: newAffiliate.status,
        requestedAt: new Date(),
        category: newAffiliate.category,
        reason: newAffiliate.reason || "",
      };

      console.log(colors.magenta("Successfully requested for affiliate permission"))
      return new ApiResponse(
        true,
        'Affiliate request submitted and is awaiting approval.',
        formattedResponse
      );
    } catch (error) {
      console.log(colors.red('Error requesting affiliate status'), error);
      return new ApiResponse(
        false,
        'Failed to submit affiliate request.'
      );
    }
  }

  async fetchAffiliateDashboard(payload: any) {
    console.log(colors.cyan("Fetching affiliate dashboard"));
    try {
      // 1. Fetch user
      const user = await this.prisma.user.findFirst({ where: { email: payload.email } });
      if (!user) {
        return new ApiResponse(false, 'User not found.');
      }

      // 2. Fetch affiliate record
      const affiliate = await this.prisma.affiliate.findUnique({ where: { userId: user.id } });

      // 3. Fetch stats and recent orders
      const [totalPurchases, totalEarned, totalWithdrawn, pendingWithdrawals, recentOrders] = await Promise.all([
        this.prisma.order.count({
          where: {
            commissions: { some: { userId: user.id } }
          }
        }),
        this.prisma.commission.aggregate({
          _sum: { amount: true },
          where: { userId: user.id }
        }),
        this.prisma.commission.aggregate({
          _sum: { amount: true },
          where: { userId: user.id, status: 'paid' }
        }),
        this.prisma.commission.aggregate({
          _sum: { amount: true },
          where: { userId: user.id, status: 'pending' }
        }),
        this.prisma.order.findMany({
          where: {
            commissions: { some: { userId: user.id } }
          },
          include: {
            user: { select: { first_name: true, last_name: true, email: true } },
            commissions: true
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        })
      ]);

      // 4. Format table analysis
      const tableAnalysis = recentOrders.map(order => ({
        orderId: order.id,
        buyerName: order.user.first_name + ' ' + order.user.last_name,
        buyerEmail: order.user.email,
        orderAmount: order.total,
        commissionEarned: order.commissions
          .filter(c => c.userId === user.id)
          .reduce((sum, c) => sum + c.amount, 0),
        orderDate: order.createdAt,
        status: order.status
      }));

      // 5. Build response
      const dashboard = {
        is_affiliate: user.isAffiliate,
        affiliate_status: user.affiliateStatus,
        createdAt: affiliate?.createdAt || null,
        affiliate,
        stats: {
          totalPurchases,
          totalEarned: totalEarned._sum.amount || 0,
          totalWithdrawn: totalWithdrawn._sum.amount || 0,
          pendingWithdrawals: pendingWithdrawals._sum.amount || 0
        },
        tableAnalysis,
        
      };

      return new ApiResponse(true, 'Affiliate dashboard fetched successfully.', dashboard);
    } catch (error) {
      console.log(colors.red('Error fetching affiliate dashboard'), error);
      return new ApiResponse(false, 'Failed to fetch affiliate dashboard.');
    }
  }
}
