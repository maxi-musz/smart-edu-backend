import { Controller, Post, Body, Request, UseGuards, Get } from '@nestjs/common';
import { DiscountService } from './discount.service';
import { JwtGuard } from '../auth/guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreatePromoCodeDto } from './create-promo-code.dto';
import { IssueCommisionDto } from './issue-commission.dto';

@Controller('discount')
@UseGuards(JwtGuard, RolesGuard)
export class DiscountController {
  constructor(private readonly discountService: DiscountService) {}

  @Get("fetch-benefits")
  @Roles("admin")
  async getAllBenefitCodes() {
    return this.discountService.getAllBenefitCodes()
  }

  @Post('add-promo-code')
  @Roles('admin')
  async addPromoCode(@Body() body: CreatePromoCodeDto, @Request() req) {
    const createdBy = req.user.email;
    return this.discountService.addPromoCode({ ...body, createdBy });
  }

  @Post('verify-promocode')
  async verifyPromoCode(@Body() body: { code: string; productId?: string }) {
  return this.discountService.verifyPromoCode(body);
  }

  @Post('issue-commission') 
  async issueCommissionToMarketers(@Body() dto: IssueCommisionDto, @Request() req: any) {
    return this.discountService.issueCommissionToMarketers(dto, req.user)
  }
}
