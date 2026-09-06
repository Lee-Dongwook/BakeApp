import { ConflictException, Injectable, HttpStatus } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { DatabaseService } from "../database/database.service";
import { RuntimeException } from "../runtime/runtime.exception";
import {
  RegisterRuntimeUserDto,
  RuntimeLoginDto,
} from "./dto/runtime-auth.dto";

export interface RuntimeJwtPayload {
  id?: string;
  sub: string;
  projectId: string;
  email: string;
  role: string;
  metadata?: Record<string, any>;
  type: "RUNTIME_USER";
}

@Injectable()
export class RuntimeAuthService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly jwtService: JwtService,
  ) {}

  async resolveProjectIdBySlug(slug: string): Promise<string> {
    const res = await this.databaseService.query(
      `SELECT project_id FROM project_runtime_settings WHERE slug = $1`,
      [slug],
    );
    if (res.rows.length === 0) {
      throw new RuntimeException(
        "RUNTIME_APP_NOT_FOUND",
        `Slug '${slug}'에 해당하는 Runtime App을 찾을 수 없습니다.`,
        HttpStatus.NOT_FOUND,
      );
    }
    return res.rows[0].project_id;
  }

  async register(projectId: string, dto: RegisterRuntimeUserDto) {
    const existing = await this.databaseService.query(
      `SELECT id FROM runtime_users WHERE project_id = $1 AND email = $2`,
      [projectId, dto.email],
    );

    if (existing.rows.length > 0) {
      throw new ConflictException("이미 존재하는 사용자 이메일입니다.");
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(dto.password, saltRounds);

    const result = await this.databaseService.query<{
      id: string;
      email: string;
      role: string;
      created_at: Date;
    }>(
      `INSERT INTO runtime_users (project_id, email, password_hash, role, metadata)
        VALUES($1, $2, $3, $4, $5::jsonb)
        RETURNING id, email, role, created_at`,
      [
        projectId,
        dto.email,
        passwordHash,
        dto.role || "user",
        JSON.stringify(dto.metadata || {}),
      ],
    );

    return result.rows[0];
  }

  async login(projectId: string, dto: RuntimeLoginDto) {
    const result = await this.databaseService.query<{
      id: string;
      email: string;
      password_hash: string;
      role: string;
      metadata: Record<string, any>;
    }>(
      `SELECT id, email, password_hash, role, metadata
       FROM runtime_users
       WHERE project_id = $1 AND email = $2`,
      [projectId, dto.email],
    );

    const user = result.rows[0];
    if (!user) {
      throw new RuntimeException(
        "RUNTIME_AUTH_REQUIRED",
        "이메일 또는 비밀번호가 올바르지 않습니다.",
        HttpStatus.UNAUTHORIZED,
      );
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.password_hash,
    );
    if (!isPasswordValid) {
      throw new RuntimeException(
        "RUNTIME_AUTH_REQUIRED",
        "이메일 또는 비밀번호가 올바르지 않습니다.",
        HttpStatus.UNAUTHORIZED,
      );
    }

    const payload: RuntimeJwtPayload = {
      sub: user.id,
      projectId,
      email: user.email,
      role: user.role,
      metadata: user.metadata || {},
      type: "RUNTIME_USER",
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: "7d",
      secret: this.getJwtSecret(),
    });

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        metadata: user.metadata,
      },
    };
  }

  async validateToken(token: string): Promise<RuntimeJwtPayload> {
    try {
      const payload = this.jwtService.verify<RuntimeJwtPayload>(token, {
        secret: this.getJwtSecret(),
      });
      if (payload.type !== "RUNTIME_USER") {
        throw new RuntimeException(
          "RUNTIME_AUTH_REQUIRED",
          "유효하지 않은 Runtime 토큰 타입입니다.",
          HttpStatus.UNAUTHORIZED,
        );
      }
      return payload;
    } catch (error) {
      if (error instanceof RuntimeException) throw error;
      throw new RuntimeException(
        "RUNTIME_AUTH_REQUIRED",
        "토큰 인증 실패 또는 만료되었습니다.",
        HttpStatus.UNAUTHORIZED,
      );
    }
  }

  private getJwtSecret(): string {
    const secret = process.env.JWT_SECRET;
    if (!secret || secret.length < 32) {
      throw new RuntimeException(
        "RUNTIME_ACCESS_DENIED",
        "Runtime JWT를 사용하려면 32자 이상의 JWT_SECRET이 필요합니다.",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    return secret;
  }
}
