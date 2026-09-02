import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import {
  AuthService,
  AuthCredentialsDto,
  REFRESH_TOKEN_COOKIE,
  REFRESH_TOKEN_TTL_MS,
} from "./auth.service";
import { AuthGuard } from "./auth.guard";

@ApiTags("Auth & Security (인증 및 접근 제어)")
@Controller("api/auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("signup")
  @ApiOperation({ summary: "BakeApp 회원가입" })
  async signUp(@Body() dto: AuthCredentialsDto) {
    return this.authService.signUp(dto);
  }

  @Post("signin")
  @ApiOperation({ summary: "BakeApp 로그인 (Access Token 발급)" })
  async signIn(@Body() dto: AuthCredentialsDto, @Res({ passthrough: true }) response: any) {
    const session = await this.authService.signIn(dto);
    this.setRefreshTokenCookie(response, session.refreshToken);
    return { accessToken: session.accessToken, user: session.user };
  }

  @Post("refresh")
  @HttpCode(200)
  @ApiOperation({ summary: "HttpOnly refresh token으로 access token 갱신" })
  async refresh(@Req() request: any, @Res({ passthrough: true }) response: any) {
    const refreshToken = this.readCookie(request.headers.cookie, REFRESH_TOKEN_COOKIE);
    if (!refreshToken) {
      throw new UnauthorizedException("Refresh token cookie가 없습니다.");
    }
    const session = await this.authService.refresh(refreshToken);
    this.setRefreshTokenCookie(response, session.refreshToken);
    return { accessToken: session.accessToken, user: session.user };
  }

  @Post("logout")
  @HttpCode(204)
  @ApiOperation({ summary: "현재 refresh token을 폐기하고 로그아웃" })
  async logout(@Req() request: any, @Res({ passthrough: true }) response: any) {
    await this.authService.revokeRefreshToken(
      this.readCookie(request.headers.cookie, REFRESH_TOKEN_COOKIE),
    );
    response.clearCookie(REFRESH_TOKEN_COOKIE, this.cookieOptions());
  }

  @Get("me")
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "현재 로그인한 사용자 프로필 조회 (인증 테스트용)" })
  async getProfile(@Req() req: any) {
    return { user: req.user };
  }

  private setRefreshTokenCookie(response: any, refreshToken: string) {
    response.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
      ...this.cookieOptions(),
      maxAge: REFRESH_TOKEN_TTL_MS,
    });
  }

  private cookieOptions() {
    return {
      httpOnly: true,
      path: "/api/auth",
      sameSite: "lax" as const,
      secure: process.env.NODE_ENV === "production",
    };
  }

  private readCookie(cookieHeader: string | undefined, name: string) {
    const prefix = `${name}=`;
    const cookie = cookieHeader
      ?.split(";")
      .map((value) => value.trim())
      .find((value) => value.startsWith(prefix));
    return cookie ? decodeURIComponent(cookie.slice(prefix.length)) : undefined;
  }
}
