import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { ResponseHelper } from '../shared/helper-functions/response.helpers';
import * as colors from "colors"
import { PaymentDataDto } from '../shared/dto/payment.dto';
import { ProductsService } from '../admin/products/products.service';

@Injectable()
export class PaystackService {
  constructor(
    private readonly productsService: ProductsService,
  ) {}

  async initiatePayment(paymentData: PaymentDataDto, req: any) {
    console.log(colors.cyan("Initiating a new payment"));

    // Check product stock before proceeding
    for (const item of paymentData.items) {
      const productRes = await this.productsService.getProductById(item.productId);
      const product = productRes?.data;
      if (!product) {
        return ResponseHelper.error(`Product with ID ${item.productId} not found`, null, 404);
      }
      if (item.quantity > product.stock) {
        return ResponseHelper.error(
          `The available quantity for '${product.name}' is ${product.stock}, which is less than the quantity you want to purchase: (${item.quantity}). Please try reloading, check back later, or try again.`,
          null,
          400
        );
      }
    }

    try {
      const amount = Math.round(paymentData.payNow * 100);
      const email = req.email;
      const payload = {
        email,
        amount,
        metadata: {
          items: paymentData.items,
          paymentPercent: paymentData.paymentPercent,
          payLater: paymentData.payLater,
          total: paymentData.total,
        },
      };
      const response = await axios.post(
        'https://api.paystack.co/transaction/initialize',
        payload,
        {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_TEST_SECRET_KEY}`,
            'Content-Type': 'application/json',
          },
        },
      );
      console.log("Paystack response: ", response);
      console.log(colors.magenta("New payment successfully initiated"));
      return ResponseHelper.success('Payment initiated', response.data.data);
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to initiate payment';
      return ResponseHelper.error(message, error.response?.data, error.response?.status || 500);
    }
  }
}
