import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as colors from "colors"
import { ApiResponse } from '../shared/helper-functions/response';
import { formatDate } from 'src/shared/helper-functions/formatter';
import { CreatePromoCodeDto } from './create-promo-code.dto';
import { IssueCommisionDto } from './issue-commission.dto';

@Injectable()
export class DiscountService {
  constructor(private readonly prisma: PrismaService) {}

  async addPromoCode({ code, description = '', discountPercent, createdBy, productId }: CreatePromoCodeDto & { createdBy: string }) {
    try {
      const promo = await this.prisma.promoCode.create({
        data: {
          code,
          description,
          discountPercent,
          createdBy,
          productId,
        },
      });

      // Fetch creator's name
      const user = await this.prisma.user.findUnique({
        where: { email: createdBy },
        select: { first_name: true, last_name: true }
      });
      const createdByName = user ? `${user.first_name} ${user.last_name}` : null;

      // Format response
      const formattedPromo = {
        id: promo.id,
        code: promo.code,
        description: promo.description,
        discountPercent: promo.discountPercent,
        createdByEmail: promo.createdBy,
        createdByName,
        productId: promo.productId,
        createdAt: formatDate(promo.createdAt),
      };

      return new ApiResponse(
        true,
        'Promo code created successfully',
        formattedPromo
      );
    } catch (error) {
      console.log(colors.red('Error creating promo code'), error);
      return new ApiResponse(
        false,
        'Error creating promo code',
        undefined
      );
    }
  }

  async getAllBenefitCodes() {
    console.log(colors.cyan("Fetching all benefit codes"))
    try {
        // Fetch all active promo codes
        const promoCodes = await this.prisma.promoCode.findMany({
            where: { isActive: true }
        });

        // Get all unique creator emails
        const creatorEmails = [...new Set(promoCodes.map(p => p.createdBy))];

        // Fetch user details for all creators
        const users = await this.prisma.user.findMany({
            where: { email: { in: creatorEmails } },
            select: { email: true, first_name: true, last_name: true }
        });

        // Map email to name
        const emailToName = Object.fromEntries(
          users.map(u => [u.email, `${u.first_name} ${u.last_name}`])
        );

        // Format promo codes
        const formattedPromoCodes = promoCodes.map((promoCode) => ({
            id: promoCode.id,
            code: promoCode.code,
            description: promoCode.description,
            discountPercent: promoCode.discountPercent,
            createdByEmail: promoCode.createdBy,
            createdByName: emailToName[promoCode.createdBy] || null,
            createdAt: formatDate(promoCode.createdAt),
        }));

        return new ApiResponse(
            true,
            "Benefit promo codes fetched successfully",
            formattedPromoCodes
        );
    } catch (error) {
        console.log(colors.red("Error fetching benefit codes"), error)
        return new ApiResponse(
            false,
            "Error fetching benefit codes",
            undefined
        )
    }
  }

  async verifyPromoCode({ code, productId }: { code: string; productId?: string }) {
    try {
      const orArray = productId
        ? [{ productId: null }, { productId }]
        : [{ productId: null }];

      // Find promo code: either global or specific to the product
      const promo = await this.prisma.promoCode.findFirst({
        where: {
          code,
          isActive: true,
          OR: orArray,
        },
      });

      if (!promo) {
        console.log(colors.red("promo code is invalid"))
        return new ApiResponse(false, 'Invalid or inactive promo code', undefined);
      }

      // Fetch creator's name
      const user = await this.prisma.user.findUnique({
        where: { email: promo.createdBy },
        select: { first_name: true, last_name: true }
      });
      const createdByName = user ? `${user.first_name} ${user.last_name}` : null;

      // Format response
      const formattedPromo = {
        id: promo.id,
        code: promo.code,
        description: promo.description,
        discountPercent: promo.discountPercent,
        createdByEmail: promo.createdBy,
        createdByName,
        productId: promo.productId,
        createdAt: formatDate(promo.createdAt),
      };

      return new ApiResponse(true, 'Promo code is valid', formattedPromo);
    } catch (error) {
      console.log(colors.red('Error verifying promo code'), error);
      return new ApiResponse(false, 'Error verifying promo code', undefined);
    }
  }

  async issueCommissionToMarketers(dto: IssueCommisionDto, payload: any) {

    console.log(colors.cyan("Issuing commission to marketers"))

    try {
        
    } catch (error) {
        
    }
  }
}
