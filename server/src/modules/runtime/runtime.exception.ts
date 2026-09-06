import { HttpException, HttpStatus } from "@nestjs/common";

export type RuntimeErrorCode =
  | "RUNTIME_APP_NOT_FOUND"
  | "RUNTIME_APP_NOT_DEPLOYED"
  | "RUNTIME_AUTH_REQUIRED"
  | "RUNTIME_ACCESS_DENIED"
  | "RUNTIME_PAGE_NOT_FOUND"
  | "RUNTIME_QUERY_NOT_FOUND"
  | "RUNTIME_WORKFLOW_NOT_FOUND"
  | "RUNTIME_RESOURCE_NOT_IN_RELEASE";

export class RuntimeException extends HttpException {
  constructor(
    public readonly code: RuntimeErrorCode,
    message: string,
    status: HttpStatus = HttpStatus.BAD_REQUEST,
  ) {
    super(
      {
        error: {
          code,
          message,
          timestamp: new Date().toISOString(),
        },
      },
      status,
    );
  }
}
