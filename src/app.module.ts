import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HelloModule } from './hello/hello.module';
import { AdminModule } from './admin/admin.module';
import { SchoolModule } from './school/school.module';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import * as joi from 'joi';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Makes the configuration available globally
      envFilePath: '.env', // Path to your environment variables file
      load: [appConfig, databaseConfig],
      // validationSchema: joi.object({
      //   NODE_ENV: joi.string().valid('development', 'staging', 'production').required(),
      //   DATABASE_URL: joi.string().required(),
      //   DATABASE_URL_STAGING: joi.string().required(),
      //   DATABASE_URL_PRODUCTION: joi.string().required(),
      // }),
    }),
    MulterModule.register({
      storage: memoryStorage(),
    }),
    HelloModule, 
    AdminModule, 
    SchoolModule, PrismaModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
