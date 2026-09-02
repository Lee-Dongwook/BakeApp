import { Controller, Post, Body, UseGuards } from "@nestjs/common";
import { FigmaService } from "./figma.service";
import { AuthGuard } from "../auth/auth.guard";

@Controller("figma")
export class FigmaController {
  constructor(private readonly figmaService: FigmaService) {}

  @Post("import")
  @UseGuards(AuthGuard)
  async importFigmaDesign(
    @Body() body: { fileKey: string; nodeId?: string; accessToken: string },
  ) {
    const rawFigmaNode = await this.figmaService.fetchFigmaNode(
      body.fileKey,
      body.nodeId,
      body.accessToken,
    );

    const canvasNode =
      this.figmaService.transformFigmaToCanvasNode(rawFigmaNode);

    return {
      success: true,
      data: canvasNode,
    };
  }
}
