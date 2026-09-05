import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import { ComponentNode } from "../generator/generator.service";
import { FigmaNode, FigmaPaint } from "./interfaces/figma.interface";

@Injectable()
export class FigmaService {
  async fetchFigmaNode(
    fileKey: string,
    nodeId: string | undefined,
  ): Promise<FigmaNode> {
    const token = process.env.FIGMA_ACCESS_TOKEN;
    if (!token) {
      throw new HttpException(
        "서버에 FIGMA_ACCESS_TOKEN이 설정되어 있지 않습니다.",
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    const baseUrl = "https://api.figma.com/v1/files";
    const encodedFileKey = encodeURIComponent(fileKey);

    const url = nodeId
      ? `${baseUrl}/${encodedFileKey}/nodes?ids=${encodeURIComponent(nodeId)}`
      : `${baseUrl}/${encodedFileKey}`;

    let response: Response;
    try {
      response = await fetch(url, { headers: { "X-Figma-Token": token } });
    } catch {
      throw new HttpException(
        "Figma 서버에 연결하지 못했습니다.",
        HttpStatus.BAD_GATEWAY,
      );
    }

    if (!response.ok) {
      const message =
        response.status === 401 || response.status === 403
          ? "Figma 접근 권한이 없거나 토큰이 유효하지 않습니다."
          : response.status === 404
            ? "Figma 파일 또는 노드를 찾지 못했습니다."
            : response.status === 429
              ? "Figma API 요청 한도를 초과했습니다. 잠시 후 다시 시도해 주세요."
              : "Figma API 호출에 실패했습니다.";
      throw new HttpException(
        message,
        response.status === 429
          ? HttpStatus.TOO_MANY_REQUESTS
          : HttpStatus.BAD_GATEWAY,
      );
    }

    const data = (await response.json()) as {
      document?: FigmaNode;
      nodes?: Record<string, { document?: FigmaNode }>;
    };
    const document = nodeId ? data.nodes?.[nodeId]?.document : data.document;
    if (!document) {
      throw new HttpException(
        "Figma 응답에서 가져올 노드를 찾지 못했습니다.",
        HttpStatus.NOT_FOUND,
      );
    }
    return document;
  }

  transformFigmaToCanvasNode(figmaNode: FigmaNode): ComponentNode {
    const id = `node_${Math.random().toString(36).substr(2, 9)}`;

    const style: Record<string, unknown> = {
      width: figmaNode.absoluteBoundingBox
        ? `${figmaNode.absoluteBoundingBox.width}px`
        : "auto",
      height: figmaNode.absoluteBoundingBox
        ? `${figmaNode.absoluteBoundingBox.height}px`
        : "auto",
    };

    const fillColor = this.toCssColor(figmaNode.fills);
    if (fillColor) style.backgroundColor = fillColor;
    const borderColor = this.toCssColor(figmaNode.strokes);
    if (borderColor) style.border = `1px solid ${borderColor}`;
    if (typeof figmaNode.cornerRadius === "number") {
      style.borderRadius = `${figmaNode.cornerRadius}px`;
    }

    switch (figmaNode.type) {
      case "TEXT":
        return {
          id,
          type: "Text",
          name: figmaNode.name || "텍스트",
          style: {
            ...style,
            ...this.textStyle(figmaNode),
            color: fillColor || "#1e293b",
            backgroundColor: undefined,
          },
          children: [figmaNode.characters || "Text"],
        };

      case "FRAME":
      case "GROUP":
      case "COMPONENT":
      case "INSTANCE":
        return {
          id,
          type: "Container",
          name: figmaNode.name || "컨테이너",
          style: {
            ...style,
            display: "flex",
            flexDirection:
              figmaNode.layoutMode === "HORIZONTAL" ? "row" : "column",
            padding: this.padding(figmaNode),
            gap: typeof figmaNode.itemSpacing === "number"
              ? `${figmaNode.itemSpacing}px`
              : undefined,
          },
          children: (figmaNode.children || []).map((child) =>
            this.transformFigmaToCanvasNode(child),
          ),
        };

      case "RECTANGLE":
        return {
          id,
          type: "Container",
          name: figmaNode.name || "사각형",
          style: { ...style, backgroundColor: fillColor || "#f1f5f9" },
          children: [],
        };

      default:
        return {
          id,
          type: "View",
          name: figmaNode.name || figmaNode.type,
          style,
          children: (figmaNode.children || []).map((child) =>
            this.transformFigmaToCanvasNode(child),
          ),
        };
    }
  }

  private toCssColor(paints?: FigmaPaint[]) {
    const paint = paints?.find(
      (candidate) =>
        candidate.type === "SOLID" &&
        candidate.visible !== false &&
        candidate.color,
    );
    if (!paint?.color) return undefined;

    const channel = (value: number) => Math.round(Math.max(0, Math.min(1, value)) * 255);
    const { r, g, b, a = 1 } = paint.color;
    const opacity = (paint.opacity ?? 1) * a;
    return opacity < 1
      ? `rgba(${channel(r)}, ${channel(g)}, ${channel(b)}, ${opacity})`
      : `rgb(${channel(r)}, ${channel(g)}, ${channel(b)})`;
  }

  private textStyle(node: FigmaNode): Record<string, unknown> {
    const source = node.style;
    if (!source) return {};

    return {
      fontFamily: source.fontFamily,
      fontSize: source.fontSize ? `${source.fontSize}px` : undefined,
      fontWeight: source.fontWeight,
      textAlign: source.textAlignHorizontal?.toLowerCase(),
      lineHeight: source.lineHeightPx ? `${source.lineHeightPx}px` : undefined,
      letterSpacing: source.letterSpacing ? `${source.letterSpacing}px` : undefined,
    };
  }

  private padding(node: FigmaNode) {
    const values = [node.paddingTop, node.paddingRight, node.paddingBottom, node.paddingLeft];
    if (!values.some((value) => typeof value === "number")) return "0px";
    return values.map((value) => `${value ?? 0}px`).join(" ");
  }
}
