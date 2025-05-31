import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');
  
  await app.listen(process.env.PORT ?? 2000);

  console.log("Server is running on port", process.env.PORT ?? 2000);
}
bootstrap();
