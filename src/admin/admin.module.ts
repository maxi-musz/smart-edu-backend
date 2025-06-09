import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { SchoolManagementModule } from './school-management/school-management.module';
import { AuthAdminModule } from './auth-admin/auth-admin.module';

@Module({
  controllers: [AdminController],
  providers: [AdminService],
  imports: [SchoolManagementModule, AuthAdminModule]
})
export class AdminModule {}
