const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
import { tokenStorage } from "../auth/tokenStorage";

export interface ApiRequestOptions extends Omit<
  RequestInit,
  "body" | "headers"
> {
  body?: unknown;
  headers?: HeadersInit;
  /** 현재 로그인 토큰을 Authorization 헤더에 포함합니다. */
  auth?: boolean;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly data: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const isBodyInit = (body: unknown): body is BodyInit =>
  typeof body === "string" ||
  body instanceof Blob ||
  body instanceof FormData ||
  body instanceof URLSearchParams ||
  body instanceof ArrayBuffer ||
  ArrayBuffer.isView(body);

const getErrorMessage = (data: unknown, fallback: string) => {
  if (!data || typeof data !== "object") return fallback;
  const message = (data as { message?: unknown }).message;
  if (Array.isArray(message)) return message.join(", ");
  return typeof message === "string" ? message : fallback;
};

class ApiClient {
  private toUrl(path: string) {
    return /^https?:\/\//i.test(path) ? path : `${API_BASE_URL}${path}`;
  }

  async request<TResponse>(
    path: string,
    {
      body,
      headers: requestHeaders,
      auth = false,
      ...options
    }: ApiRequestOptions = {},
  ): Promise<TResponse> {
    const headers = new Headers(requestHeaders);
    let requestBody: BodyInit | undefined;

    if (body !== undefined) {
      if (isBodyInit(body)) {
        requestBody = body;
      } else {
        if (!headers.has("Content-Type")) {
          headers.set("Content-Type", "application/json");
        }
        requestBody = JSON.stringify(body);
      }
    }

    if (auth) {
      const accessToken = tokenStorage.get();
      if (!accessToken) throw new Error("로그인이 필요합니다.");
      headers.set("Authorization", `Bearer ${accessToken}`);
    }

    const response = await fetch(this.toUrl(path), {
      ...options,
      headers,
      body: requestBody,
    });
    const text = await response.text();
    const data: unknown = text
      ? (() => {
          try {
            return JSON.parse(text);
          } catch {
            return text;
          }
        })()
      : undefined;

    if (!response.ok) {
      throw new ApiError(
        getErrorMessage(data, `요청에 실패했습니다. (${response.status})`),
        response.status,
        data,
      );
    }

    return data as TResponse;
  }

  get<TResponse>(path: string, options?: ApiRequestOptions) {
    return this.request<TResponse>(path, { ...options, method: "GET" });
  }

  post<TResponse>(path: string, body?: unknown, options?: ApiRequestOptions) {
    return this.request<TResponse>(path, { ...options, method: "POST", body });
  }

  put<TResponse>(path: string, body?: unknown, options?: ApiRequestOptions) {
    return this.request<TResponse>(path, { ...options, method: "PUT", body });
  }

  patch<TResponse>(path: string, body?: unknown, options?: ApiRequestOptions) {
    return this.request<TResponse>(path, { ...options, method: "PATCH", body });
  }

  delete<TResponse>(path: string, options?: ApiRequestOptions) {
    return this.request<TResponse>(path, { ...options, method: "DELETE" });
  }
}

/** 앱 전체에서 공유하는 fetch 기반 API 클라이언트입니다. */
export const apiClient = new ApiClient();
