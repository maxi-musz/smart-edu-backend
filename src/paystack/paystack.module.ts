import { Module } from '@nestjs/common';
import { PaystackController } from './paystack.controller';
import { PaystackService } from './paystack.service';
import { ProductsModule } from '../admin/products/products.module';

@Module({
  imports: [ProductsModule],
  controllers: [PaystackController],
  providers: [PaystackService]
})
export class PaystackModule {}
