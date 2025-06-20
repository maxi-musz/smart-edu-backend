import { Controller, Post, Body, UsePipes, ValidationPipe, UseGuards } from '@nestjs/common';
import { PaystackService } from './paystack.service';
import { PaymentDataDto } from '../shared/dto/payment.dto';
import { JwtGuard } from 'src/auth/guard';
import { Request } from 'express';

@Controller('paystack')
@UseGuards(JwtGuard)
export class PaystackController {
  constructor(private readonly paystackService: PaystackService) {}

  @Post('initiate')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async initiatePayment(@Body() paymentData: PaymentDataDto, req: Request) {
    return this.paystackService.initiatePayment(paymentData, req);
  }
}
