import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { AuditService } from "./audit.service";

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;

    if (["GET", "OPTIONS", "HEAD"].includes(method)) {
      return next.handle();
    }

    const user = request.user;
    const params = request.params;
    const body = request.body;
    const ip = request.ip || request.headers["x-forwarded-for"];

    const projectId = params?.projectId;
    const tableName = params?.tableName;
    const recordId = params?.id;

    let action = "UNKNOWN";
    if (method === "POST") action = "CREATE";
    else if (method === "PATCH" || method === "PUT") action = "UPDATE";
    else if (method === "DELETE") action = "DELETE";

    return next.handle().pipe(
      tap({
        next: async (res) => {
          try {
            await this.auditService.log({
              projectId,
              userId: user?.id,
              action,
              targetTable: tableName,
              recordId: recordId || res?.id,
              changes: { body, responseSummary: res?.success ?? true },
              ipAddress: ip,
            });
          } catch (err) {
            console.error("감사 로그 기록 실패:", err);
          }
        },
      }),
    );
  }
}
