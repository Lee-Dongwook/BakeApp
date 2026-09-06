export interface WorkflowExecutionError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  retryable?: boolean;
}

export class WorkflowSanitizer {
  private static readonly SENSITIVE_KEYS = [
    "authorization",
    "cookie",
    "set-cookie",
    "password",
    "secret",
    "token",
    "accesstoken",
    "refreshtoken",
    "apikey",
    "datasource_password",
    "project_secret",
  ];

  static sanitize(data: any): any {
    if (!data || typeof data !== "object") {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map((item) => WorkflowSanitizer.sanitize(item));
    }

    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();

      if (this.SENSITIVE_KEYS.some((sk) => lowerKey.includes(sk))) {
        sanitized[key] = "******";
      } else if (value && typeof value === "object") {
        sanitized[key] = WorkflowSanitizer.sanitize(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  static standardizeError(error: any): WorkflowExecutionError {
    const message = error instanceof Error ? error.message : String(error);
    let code = "UNKNOWN_ERROR";
    let retryable = false;

    if (message.includes("HTTP")) {
      code = "HTTP_REQUEST_FAILED";
      retryable = true;
    } else if (message.includes("DB") || message.includes("relation")) {
      code = "DATABASE_ERROR";
      retryable = false;
    } else if (message.includes("TIMEOUT")) {
      code = "TIMED_OUT";
      retryable = true;
    }

    return {
      code,
      message,
      details: error.details
        ? WorkflowSanitizer.sanitize(error.details)
        : undefined,
      retryable,
    };
  }
}
