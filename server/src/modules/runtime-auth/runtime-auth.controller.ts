import { Body, Controller, Param, Post } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import {
  RegisterRuntimeUserDto,
  RuntimeLoginDto,
} from "./dto/runtime-auth.dto";
import { RuntimeAuthService } from "./runtime-auth.service";

@ApiTags("Runtime End-User Auth (최종 앱 사용자 인증 API)")
@Controller("api/runtime/:projectId/auth")
export class RuntimeAuthController {
  constructor(private readonly runtimeAuthService: RuntimeAuthService) {}

  @Post("signup")
  @ApiOperation({ summary: "최종 사용자 회원가입" })
  async signup(
    @Param("projectId") projectId: string,
    @Body() dto: RegisterRuntimeUserDto,
  ) {
    return this.runtimeAuthService.register(projectId, dto);
  }

  @Post("login")
  @ApiOperation({ summary: "최종 사용자 로그인 (Runtime JWT 발급)" })
  async login(
    @Param("projectId") projectId: string,
    @Body() dto: RuntimeLoginDto,
  ) {
    return this.runtimeAuthService.login(projectId, dto);
  }
}
