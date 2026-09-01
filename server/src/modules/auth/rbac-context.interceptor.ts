import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { DatabaseService } from "../../config/database.service";

@Injectable()
export class RbacContextInterceptor implements NestInterceptor {
  constructor(private readonly dbService: DatabaseService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();

    const userRole =
      request.headers["x-user-role"] || request.user?.role || "GUEST";
    const userId =
      request.headers["x-user-id"] ||
      request.user?.id ||
      "00000000-0000-0000-0000-000000000000";

    await this.dbService.query(
      `SELECT set_config('app.current_user_role', '${userRole}', false);`,
    );
    await this.dbService.query(
      `SELECT set_config('app.current_user_id', '${userId}', false);`,
    );

    return next.handle();
  }
}
