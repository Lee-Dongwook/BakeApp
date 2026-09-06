import {
  CanActivate,
  ExecutionContext,
  Injectable,
  HttpStatus,
} from "@nestjs/common";
import { RuntimeAuthService } from "./runtime-auth.service";
import { RuntimeException } from "../runtime/runtime.exception";

@Injectable()
export class RuntimeGuard implements CanActivate {
  constructor(private readonly runtimeAuthService: RuntimeAuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      throw new RuntimeException(
        "RUNTIME_AUTH_REQUIRED",
        "Runtime 인증 토큰이 필요합니다.",
        HttpStatus.UNAUTHORIZED,
      );
    }

    const token = authHeader.split(" ")[1];
    try {
      const payload = await this.runtimeAuthService.validateToken(token);

      request.runtimeUser = {
        id: payload.sub || payload.id,
        email: payload.email,
        role: payload.role || "USER",
        metadata: payload.metadata || {},
      };

      return true;
    } catch {
      throw new RuntimeException(
        "RUNTIME_AUTH_REQUIRED",
        "유효하지 않거나 만료된 Runtime 토큰입니다.",
        HttpStatus.UNAUTHORIZED,
      );
    }
  }
}
