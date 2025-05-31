import { Injectable } from '@nestjs/common';

@Injectable()
export class HelloService {

    getHello(): string {
        return 'Hello, World, smart edu hub api service is running!';
    }
}
