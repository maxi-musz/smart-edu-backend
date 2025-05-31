import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HelloModule } from './hello/hello.module';
import { AdminModule } from './admin/admin.module';
import { SchoolModule } from './school/school.module';
import { ConfigModule } from '@nestjs/config';
import * as joi from 'joi';
import appConfig from './config/app.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Makes the configuration available globally
      envFilePath: '.env', // Path to your environment variables file
      load: [appConfig],
    }),
    HelloModule, 
    AdminModule, 
    SchoolModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
