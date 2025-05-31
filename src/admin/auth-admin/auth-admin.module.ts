import { Module } from '@nestjs/common';
import { AuthAdminService } from './auth-admin.service';
import { AuthAdminController } from './auth-admin.controller';

@Module({
  providers: [AuthAdminService],
  controllers: [AuthAdminController]
})
export class AuthAdminModule {}
