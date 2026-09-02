import {
  Injectable,
  BadRequestException,
  OnModuleInit,
  UnauthorizedException,
} from "@nestjs/common";
import {
  createHash,
  createHmac,
  randomBytes,
  scrypt,
  timingSafeEqual,
} from "crypto";
import { promisify } from "util";
import { DatabaseService } from "../database/database.service";

export interface AuthCredentialsDto {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  email: string;
  role: string;
}

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  exp: number;
}

const scryptAsync = promisify(scrypt);
const ACCESS_TOKEN_TTL_SECONDS = 60 * 15;
export const REFRESH_TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 30;
export const REFRESH_TOKEN_COOKIE = "bakeapp_refresh_token";

interface RefreshTokenRow {
  id: string;
  userId: string;
  email: string;
  role: string;
}

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(private readonly databaseService: DatabaseService) {}

  onModuleInit() {
    this.getJwtSecret();
  }

  async signUp(dto: AuthCredentialsDto) {
    const { email, password } = this.validateCredentials(dto);
    const passwordHash = await this.hashPassword(password);

    try {
      const result = await this.databaseService.query<AuthUser>(
        `INSERT INTO users (email, password_hash)
         VALUES ($1, $2)
         RETURNING id, email, role`,
        [email, passwordHash],
      );

      return {
        message: "회원가입 성공",
        user: result.rows[0],
      };
    } catch (error: any) {
      if (error?.code === "23505") {
        throw new BadRequestException("이미 등록된 이메일입니다.");
      }
      throw error;
    }
  }

  async signIn(dto: AuthCredentialsDto) {
    const { email, password } = this.validateCredentials(dto);
    const result = await this.databaseService.query<
      AuthUser & { passwordHash: string }
    >(
      `SELECT id, email, role, password_hash AS "passwordHash"
       FROM users
       WHERE email = $1`,
      [email],
    );
    const user = result.rows[0];

    if (!user || !(await this.verifyPassword(password, user.passwordHash))) {
      throw new UnauthorizedException("이메일 또는 비밀번호가 올바르지 않습니다.");
    }

    return this.createSession(user);
  }

  async refresh(refreshToken: string) {
    const tokenHash = this.hashRefreshToken(refreshToken);
    const result = await this.databaseService.query<RefreshTokenRow>(
      `SELECT rt.id, u.id AS "userId", u.email, u.role
       FROM refresh_tokens rt
       JOIN users u ON u.id = rt.user_id
       WHERE rt.token_hash = $1
         AND rt.revoked_at IS NULL
         AND rt.expires_at > CURRENT_TIMESTAMP`,
      [tokenHash],
    );
    const session = result.rows[0];
    if (!session) {
      throw new UnauthorizedException("유효하지 않거나 만료된 refresh token입니다.");
    }

    return this.databaseService.runInTransaction(async (client) => {
      const revoked = await client.query(
        `UPDATE refresh_tokens
         SET revoked_at = CURRENT_TIMESTAMP
         WHERE id = $1 AND revoked_at IS NULL`,
        [session.id],
      );
      if (revoked.rowCount !== 1) {
        throw new UnauthorizedException("이미 사용된 refresh token입니다.");
      }

      return this.createSession(
        { id: session.userId, email: session.email, role: session.role },
        client,
      );
    });
  }

  async revokeRefreshToken(refreshToken?: string) {
    if (!refreshToken) return;
    await this.databaseService.query(
      `UPDATE refresh_tokens
       SET revoked_at = CURRENT_TIMESTAMP
       WHERE token_hash = $1 AND revoked_at IS NULL`,
      [this.hashRefreshToken(refreshToken)],
    );
  }

  async validateUser(accessToken: string) {
    const [encodedHeader, encodedPayload, signature] = accessToken.split(".");
    if (!encodedHeader || !encodedPayload || !signature) {
      throw new UnauthorizedException("유효하지 않거나 만료된 토큰입니다.");
    }

    const expectedSignature = this.sign(`${encodedHeader}.${encodedPayload}`);
    const receivedSignature = Buffer.from(signature);
    const expectedSignatureBuffer = Buffer.from(expectedSignature);
    if (
      receivedSignature.length !== expectedSignatureBuffer.length ||
      !timingSafeEqual(receivedSignature, expectedSignatureBuffer)
    ) {
      throw new UnauthorizedException("유효하지 않거나 만료된 토큰입니다.");
    }

    try {
      const payload = JSON.parse(
        Buffer.from(encodedPayload, "base64url").toString("utf8"),
      ) as JwtPayload;
      if (!payload.sub || !payload.email || payload.exp <= Math.floor(Date.now() / 1000)) {
        throw new Error("Invalid token payload");
      }

      const result = await this.databaseService.query<AuthUser>(
        `SELECT id, email, role FROM users WHERE id = $1`,
        [payload.sub],
      );
      const user = result.rows[0];
      if (!user) throw new Error("User not found");
      return user;
    } catch {
      throw new UnauthorizedException("유효하지 않거나 만료된 토큰입니다.");
    }
  }

  private validateCredentials(dto: AuthCredentialsDto) {
    const email = dto.email?.trim().toLowerCase();
    const password = dto.password;
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      throw new BadRequestException("올바른 이메일 주소를 입력해 주세요.");
    }
    if (!password || password.length < 8) {
      throw new BadRequestException("비밀번호는 8자 이상이어야 합니다.");
    }
    return { email, password };
  }

  private async hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16).toString("base64url");
    const hash = (await scryptAsync(password, salt, 64)) as Buffer;
    return `scrypt$${salt}$${hash.toString("base64url")}`;
  }

  private async verifyPassword(password: string, storedValue: string) {
    const [algorithm, salt, storedHash] = storedValue.split("$");
    if (algorithm !== "scrypt" || !salt || !storedHash) return false;
    const derivedHash = (await scryptAsync(password, salt, 64)) as Buffer;
    const expectedHash = Buffer.from(storedHash, "base64url");
    return (
      derivedHash.length === expectedHash.length &&
      timingSafeEqual(derivedHash, expectedHash)
    );
  }

  private issueAccessToken(user: AuthUser) {
    const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString(
      "base64url",
    );
    const payload = Buffer.from(
      JSON.stringify({
        sub: user.id,
        email: user.email,
        role: user.role,
        exp: Math.floor(Date.now() / 1000) + ACCESS_TOKEN_TTL_SECONDS,
      } satisfies JwtPayload),
    ).toString("base64url");
    return `${header}.${payload}.${this.sign(`${header}.${payload}`)}`;
  }

  private sign(value: string) {
    return createHmac("sha256", this.getJwtSecret())
      .update(value)
      .digest("base64url");
  }

  private async createSession(
    user: AuthUser,
    client?: { query: (text: string, params?: unknown[]) => Promise<unknown> },
  ) {
    const refreshToken = randomBytes(48).toString("base64url");
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
    const query = client ?? this.databaseService;
    await query.query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)`,
      [user.id, this.hashRefreshToken(refreshToken), expiresAt],
    );

    return {
      accessToken: this.issueAccessToken(user),
      refreshToken,
      user: this.toPublicUser(user),
    };
  }

  private hashRefreshToken(refreshToken: string) {
    return createHash("sha256").update(refreshToken).digest("hex");
  }

  private getJwtSecret() {
    const secret = process.env.JWT_SECRET;
    if (!secret || secret.length < 32) {
      throw new Error("JWT_SECRET은 32자 이상의 값으로 설정해야 합니다.");
    }
    return secret;
  }

  private toPublicUser(user: AuthUser) {
    return { id: user.id, email: user.email, role: user.role };
  }
}
