import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { RuntimeAuthService } from "./runtime-auth.service";

@Injectable()
export class RuntimeGuard implements CanActivate {
  constructor(private readonly runtimeAuthService: RuntimeAuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      throw new UnauthorizedException("Runtime 인증 토큰이 필요합니다.");
    }

    const token = authHeader.split(" ")[1];
    const payload = await this.runtimeAuthService.validateToken(token);

    request.runtimeUser = payload;
    return true;
  }
}
