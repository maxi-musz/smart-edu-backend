import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { DashboardModule } from './dashboard/dashboard.module';
import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module';
import { CustomersModule } from './customers/customers.module';
import { ReferralsModule } from './referrals/referrals.module';
import { RolesGuard } from '../common/guards/roles.guard';
import { Reflector } from '@nestjs/core';
import { CategoryModule } from './category/category.module';

@Module({
    imports: [
        DashboardModule,
        ProductsModule,
        OrdersModule,
        CustomersModule,
        ReferralsModule,
        CategoryModule
    ],
    controllers: [AdminController],
    providers: [AdminService, RolesGuard, Reflector],
    exports: [
        DashboardModule,
        ProductsModule,
        OrdersModule,
        CustomersModule,
        ReferralsModule
    ]
})
export class AdminModule {}
