import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class HelloService {

    constructor(private configService: ConfigService) {}

    getHello(): string {
        const appName = this.configService.get<string>('APP_NAME', 'DefaultAppName');
        console.log(`Application Name: ${appName}`);
        return `Hello, World, ${appName} service is running!`;
    }
}
