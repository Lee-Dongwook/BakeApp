import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { DatabaseService } from "../database/database.service";
import {
  RegisterRuntimeUserDto,
  RuntimeLoginDto,
} from "./dto/runtime-auth.dto";

export interface RuntimeJwtPayload {
  sub: string;
  projectId: string;
  email: string;
  role: string;
  type: "RUNTIME_USER";
}

@Injectable()
export class RuntimeAuthService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly jwtService: JwtService,
  ) {}

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
      created_Date: Date;
    }>(
      `INSERT INTO runtime_users (project_id, email, password_hash, role, metadata)
        VALUES($1, $2, $3, $4, $5:jsonb)
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
      throw new UnauthorizedException(
        "이메일 또는 비밀번호가 올바르지 않습니다.",
      );
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.password_hash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException(
        "이메일 또는 비밀번호가 올바르지 않습니다.",
      );
    }

    const payload: RuntimeJwtPayload = {
      sub: user.id,
      projectId,
      email: user.email,
      role: user.role,
      type: "RUNTIME_USER",
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: "7d",
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
      const payload = this.jwtService.verify<RuntimeJwtPayload>(token);
      if (payload.type !== "RUNTIME_USER") {
        throw new UnauthorizedException("유효하지 않은 Runtime 토큰입니다.");
      }
      return payload;
    } catch {
      throw new UnauthorizedException("토큰 인증 실패 또는 만료되었습니다.");
    }
  }
}
