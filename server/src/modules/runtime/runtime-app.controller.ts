import { Controller, Get, HttpStatus, Param, Req, Res } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { Response, Request } from "express";
import { RuntimeAppResolverService } from "./runtime-app-resolver.service";
import { RuntimeAuthService } from "../runtime-auth/runtime-auth.service";
import { RuntimeException } from "./runtime.exception";

@ApiTags("Runtime App")
@Controller("api/runtime/apps")
export class RuntimeAppController {
  constructor(
    private readonly resolverService: RuntimeAppResolverService,
    private readonly runtimeAuthService: RuntimeAuthService,
  ) {}

  @Get(":slug")
  @ApiOperation({ summary: "Runtime App Manifest 조회" })
  async getManifest(
    @Param("slug") slug: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const { manifest, releaseVersion } =
      await this.resolverService.resolveBySlug(slug);

    res.setHeader("X-BakeApp-Release", String(releaseVersion));

    if (manifest.runtime.authRequired && !manifest.runtime.isPublic) {
      const authHeader = req.headers.authorization;

      if (!authHeader?.startsWith("Bearer ")) {
        throw new RuntimeException(
          "RUNTIME_AUTH_REQUIRED",
          "해당 애플리케이션에 접근하려면 Runtime 로그인 인증이 필요합니다.",
          HttpStatus.UNAUTHORIZED,
        );
      }
      const token = authHeader.split(" ")[1];
      await this.runtimeAuthService.validateToken(token);
    }

    return res.status(HttpStatus.OK).json(manifest);
  }
}
