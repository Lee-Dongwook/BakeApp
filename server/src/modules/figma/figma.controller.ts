import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UseGuards,
} from "@nestjs/common";
import { FigmaService } from "./figma.service";
import { AuthGuard } from "../auth/auth.guard";
import { ConvertFigmaDto } from "./interfaces/figma.interface";

@Controller("api/figma")
export class FigmaController {
  constructor(private readonly figmaService: FigmaService) {}

  @Post("import")
  @UseGuards(AuthGuard)
  async importFigmaDesign(@Body() body: ConvertFigmaDto) {
    const { fileKey, nodeId } = this.resolveTarget(body);
    const rawFigmaNode = await this.figmaService.fetchFigmaNode(
      fileKey,
      nodeId,
    );

    const canvasNode =
      this.figmaService.transformFigmaToCanvasNode(rawFigmaNode);

    return {
      success: true,
      data: canvasNode,
    };
  }

  private resolveTarget(body: ConvertFigmaDto) {
    const directFileKey = body.fileKey?.trim();
    if (directFileKey) {
      return { fileKey: directFileKey, nodeId: body.nodeId?.trim() || undefined };
    }

    if (!body.figmaUrl?.trim()) {
      throw new BadRequestException("Figma 링크 또는 fileKey가 필요합니다.");
    }

    let url: URL;
    try {
      url = new URL(body.figmaUrl.trim());
    } catch {
      throw new BadRequestException("올바른 Figma 링크 형식이 아닙니다.");
    }

    if (!/(^|\.)figma\.com$/i.test(url.hostname)) {
      throw new BadRequestException("figma.com 링크만 사용할 수 있습니다.");
    }

    const segments = url.pathname.split("/").filter(Boolean);
    const targetIndex = segments.findIndex(
      (segment) => segment === "file" || segment === "design",
    );
    const fileKey = targetIndex >= 0 ? segments[targetIndex + 1] : undefined;
    if (!fileKey) {
      throw new BadRequestException("링크에서 Figma fileKey를 찾지 못했습니다.");
    }

    return {
      fileKey,
      nodeId: url.searchParams.get("node-id") || body.nodeId?.trim() || undefined,
    };
  }
}
