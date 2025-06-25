import { Body, Controller, Get, Post, Query, Request, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtGuard } from 'src/auth/guard';
import { requestAffiliatePermissionDto } from './dto/afiliate.dto';

@Controller('user')
@UseGuards(JwtGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('user-checkout-profile')
  async getUserAllowedPartialpayment(@Request() req) {
    return this.userService.getUserAllowedPartialpayment(req.user);
  }

  @Post('request-affiliate-access')
  async requestToBecomeAnAffiliate(@Body() dto: requestAffiliatePermissionDto, @Request() req) {
    return this.userService.requestToBecomeAnAffiliate(dto, req.user);
  }

  @Get('affiliate-dashboard')
  async fetchAffiliateDashboard(@Request() req) {
    return this.userService.fetchAffiliateDashboard(req.user);
  }
}
