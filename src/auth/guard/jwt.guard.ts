import { AuthGuard } from "@nestjs/passport";
import { Injectable, ExecutionContext } from "@nestjs/common";
import * as colors from 'colors';

@Injectable()
export class JwtGuard extends AuthGuard("jwt1") {
    constructor() {
        super();
    }

    canActivate(context: ExecutionContext) {
        // console.log(colors.cyan('JWT Guard - Attempting to authenticate request'));
        
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers.authorization;
        
        // console.log(colors.yellow('JWT Guard - Auth header:'), authHeader);
        
        if (!authHeader) {
            console.log(colors.red('JWT Guard - No authorization header found'));
            return false;
        }

        if (!authHeader.startsWith('Bearer ')) {
            console.log(colors.red('JWT Guard - Invalid authorization header format'));
            return false;
        }

        return super.canActivate(context);
    }
}