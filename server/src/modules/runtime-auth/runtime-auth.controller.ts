import { Body, Controller, Param, Post } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import {
  RegisterRuntimeUserDto,
  RuntimeLoginDto,
} from "./dto/runtime-auth.dto";
import { RuntimeAuthService } from "./runtime-auth.service";

@ApiTags("Runtime End-User Auth (최종 앱 사용자 인증 API)")
@Controller("api/runtime/apps/:slug/auth")
export class RuntimeAuthController {
  constructor(private readonly runtimeAuthService: RuntimeAuthService) {}

  @Post("signup")
  @ApiOperation({ summary: "최종 사용자 회원가입" })
  async signup(
    @Param("slug") slug: string,
    @Body() dto: RegisterRuntimeUserDto,
  ) {
    const projectId =
      await this.runtimeAuthService.resolveProjectIdBySlug(slug);
    return this.runtimeAuthService.register(projectId, dto);
  }

  @Post("login")
  @ApiOperation({ summary: "최종 사용자 로그인 (Runtime JWT 발급)" })
  async login(@Param("slug") slug: string, @Body() dto: RuntimeLoginDto) {
    const projectId =
      await this.runtimeAuthService.resolveProjectIdBySlug(slug);
    return this.runtimeAuthService.login(projectId, dto);
  }
}
