import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";

@Injectable()
export class RuntimeEnvService {
  constructor(private readonly databaseService: DatabaseService) {}

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

  async getProjectEnvMap(projectId: string): Promise<Record<string, string>> {
    const query = `
      SELECT key, value, is_secret
      FROM project_environment_variables
      WHERE project_id = $1;
    `;

    const res = await this.databaseService.query(query, [projectId]);
    const envMap: Record<string, string> = {};

    for (const row of res.rows) {
      envMap[row.key] = row.value;
    }

    return envMap;
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
