import { Injectable } from "@nestjs/common";
import { EnvironmentService } from "../environment/environment.service";

@Injectable()
export class RuntimeEnvService {
  constructor(private readonly environmentService: EnvironmentService) {}

  private interpolate(target: any, envMap: Record<string, string>): any {
    if (typeof target === "string") {
      return target.replace(
        /\{\{\s*(?:env|secret)\.([a-zA-Z0-9_]+)\s*\}\}/g,
        (_, key) => {
          return envMap[key] ?? "";
        },
      );
    }

    if (Array.isArray(target)) {
      return target.map((item) => this.interpolate(item, envMap));
    }

    if (typeof target === "object" && target !== null) {
      const result: Record<string, any> = {};
      for (const [key, value] of Object.entries(target)) {
        result[key] = this.interpolate(value, envMap);
      }
      return result;
    }

    return target;
  }

  /**
   * Secret 값은 EnvironmentService가 복호화한 뒤 반환합니다.
   */
  async getProjectEnvMap(projectId: string): Promise<Record<string, string>> {
    return this.environmentService.getResolvedEnvironmentMap(projectId);
  }

  async resolveEnvironmentVariables<T>(
    projectId: string,
    target: T,
  ): Promise<T> {
    if (!target) return target;

    const envMap = await this.getProjectEnvMap(projectId);
    return this.interpolate(target, envMap);
  }
}
