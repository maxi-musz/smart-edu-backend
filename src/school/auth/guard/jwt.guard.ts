
import { AuthGuard } from "@nestjs/passport";

export class JwtGuard extends AuthGuard("jwt1") {
    constructor() {
        super();
    }
}