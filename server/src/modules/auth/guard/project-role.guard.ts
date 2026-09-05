import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthService } from "../auth.service";
import { ProjectRole } from "../interfaces/auth.interface";
import { ROLES_KEY } from "../decorators/roles.decorator";

@Injectable()
export class ProjectRoleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<ProjectRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const projectId = request.params.projectId || request.body.projectId;

    if (!user) {
      throw new UnauthorizedException("인증 정보가 없습니다.");
    }

    if (!projectId) {
      throw new ForbiddenException("프로젝트 식별자(projectId)가 필요합니다");
    }

    const hasAccess = await this.authService.validateProjectAccess(
      user.id,
      projectId,
      requiredRoles,
    );

    if (!hasAccess) {
      throw new ForbiddenException("해당 프로젝트에 대한 권한이 부족합니다.");
    }

    return true;
  }
}
