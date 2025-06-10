import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CloudinaryService } from 'src/shared/services/cloudinary.service';
import { JwtStrategy } from './strategy/jwt.strategy';
import * as colors from 'colors';

@Module({
  imports: [
    PrismaModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => {
        const secret = config.get('JWT_SECRET');
        const expiresIn = config.get('JWT_EXPIRES_IN') || '7d';
        
        console.log(colors.cyan('JWT Module Config:'), { secret, expiresIn });
        
        return {
          secret,
          signOptions: {
            expiresIn,
          },
        };
      },
      inject: [ConfigService]
    })
  ],
  controllers: [AuthController],
  providers: [AuthService, CloudinaryService, JwtStrategy],
  exports: [AuthService]
})
export class AuthModule {}
