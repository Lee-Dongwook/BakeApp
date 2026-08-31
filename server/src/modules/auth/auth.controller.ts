import { Controller, Post, Body, Get, UseGuards, Req } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { AuthService, AuthCredentialsDto } from "./auth.service";
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
  async signIn(@Body() dto: AuthCredentialsDto) {
    return this.authService.signIn(dto);
  }

  @Get("me")
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "현재 로그인한 사용자 프로필 조회 (인증 테스트용)" })
  async getProfile(@Req() req: any) {
    return { user: req.user };
  }
}
