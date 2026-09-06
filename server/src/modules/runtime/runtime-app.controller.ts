import { Controller, Get, HttpStatus, Param, Res } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { Response } from "express";
import { RuntimeAppResolverService } from "./runtime-app-resolver.service";
import { RuntimeException } from "./runtime.exception";

@ApiTags("Runtime App")
@Controller("api/runtime/apps")
export class RuntimeAppController {
  constructor(private readonly resolverService: RuntimeAppResolverService) {}

  @Get(":slug")
  @ApiOperation({ summary: "Runtime App Manifest 조회" })
  async getManifest(@Param("slug") slug: string, @Res() res: Response) {
    const { manifest, releaseVersion } =
      await this.resolverService.resolveBySlug(slug);

    res.setHeader("X-BakeApp-Release", String(releaseVersion));

    if (manifest.runtime.authRequired && !manifest.runtime.isPublic) {
      //TODO: Phase 2
    }

    return res.status(HttpStatus.OK).json(manifest);
  }
}
