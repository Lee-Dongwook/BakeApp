import { Injectable, NotFoundException } from "@nestjs/common";
import * as crypto from "crypto";
import { DatabaseService } from "../database/database.service";

@Injectable()
export class EnvironmentService {
  private readonly algorithm = "aes-256-cbc";
  private readonly secretKey = crypto
    .createHash("sha256")
    .update(
      process.env.ENCRYPTION_SECRET || "bakeapp-secret-key-32bytes-secure!",
    )
    .digest();

  constructor(private readonly databaseService: DatabaseService) {}

  private encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.secretKey, iv);
    let encrypted = cipher.update(text, "utf-8", "hex");
    encrypted += cipher.final("hex");
    return `${iv.toString("hex")}:${encrypted}`;
  }

  private decrypt(text: string): string {
    const [ivHex, encryptedHex] = text.split(":");
    if (!ivHex || !encryptedHex) return text;

    const iv = Buffer.from(ivHex, "hex");
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      this.secretKey,
      iv,
    );
    let decrypted = decipher.update(encryptedHex, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  }

  async setVariable(
    projectId: string,
    key: string,
    value: string,
    isSecret: boolean = false,
  ) {
    const storedValue = isSecret ? this.encrypt(value) : value;

    await this.databaseService.query(
      `INSERT INTO project_environments (project_id, key, value, is_secret)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (project_id, key)
       DO UPDATE SET value = EXCLUDED.value, is_secret = EXCLUDED.is_secret, updated_at = CURRENT_TIMESTAMP`,
      [projectId, key.trim().toUpperCase(), storedValue, isSecret],
    );

    return { key, isSecret, success: true };
  }

  async getVariablesForStudio(projectId: string) {
    const result = await this.databaseService.query<{
      key: string;
      value: string;
      is_secret: boolean;
    }>(
      `SELECT key, value, is_secret FROM project_environments WHERE project_id = $1 ORDER BY key ASC`,
      [projectId],
    );

    return result.rows.map((row) => ({
      key: row.key,
      value: row.is_secret ? "********" : row.value,
      isSecret: row.is_secret,
    }));
  }

  async getResolvedEnvironmentMap(
    projectId: string,
  ): Promise<Record<string, string>> {
    const result = await this.databaseService.query<{
      key: string;
      value: string;
      is_secret: boolean;
    }>(
      `SELECT key, value, is_secret FROM project_environments WHERE project_id = $1`,
      [projectId],
    );

    const envMap: Record<string, string> = {};
    for (const row of result.rows) {
      envMap[row.key] = row.is_secret ? this.decrypt(row.value) : row.value;
    }

    return envMap;
  }

  async deleteVariable(projectId: string, key: string) {
    const result = await this.databaseService.query(
      `DELETE FROM project_environments WHERE project_id = $1 AND key = $2`,
      [projectId, key.toUpperCase()],
    );

    if (result.rowCount === 0) {
      throw new NotFoundException("해당 환경변수를 찾을 수 없습니다.");
    }
  }
}
