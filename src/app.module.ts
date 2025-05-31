import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HelloModule } from './hello/hello.module';
import { AdminModule } from './admin/admin.module';
import { SchoolModule } from './school/school.module';

@Module({
  imports: [HelloModule, AdminModule, SchoolModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
