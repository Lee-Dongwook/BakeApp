import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import { ComponentNode } from "../generator/generator.service";
import { FigmaNode } from "./interfaces/figma.interface";

@Injectable()
export class FigmaService {
  async fetchFigmaNode(
    fileKey: string,
    nodeId: string | undefined,
    token: string,
  ): Promise<FigmaNode> {
    const baseUrl = "https://api.figma.com/v1/files/";

    const url = nodeId
      ? `${baseUrl}${fileKey}/nodes?ids=${nodeId}`
      : `${baseUrl}${fileKey}`;

    const response = await fetch(url, {
      headers: { "X-Figma-Token": token },
    });

    if (!response.ok) {
      throw new HttpException(
        "Figma API 호출에 실패했습니다.",
        HttpStatus.BAD_REQUEST,
      );
    }

    const data = await response.json();
    return nodeId ? data.nodes[nodeId].document : data.document;
  }

  transformFigmaToCanvasNode(figmaNode: FigmaNode): ComponentNode {
    const id = `node_${Math.random().toString(36).substr(2, 9)}`;

    const style: Record<string, any> = {
      width: figmaNode.absoluteBoundingBox
        ? `${figmaNode.absoluteBoundingBox.width}px`
        : "auto",
      height: figmaNode.absoluteBoundingBox
        ? `${figmaNode.absoluteBoundingBox.height}px`
        : "auto",
    };

    switch (figmaNode.type) {
      case "TEXT":
        return {
          id,
          type: "Text",
          style: { ...style, color: "#1e293b" },
          children: [figmaNode.characters || "Text"],
        };

      case "FRAME":
      case "GROUP":
      case "COMPONENT":
      case "INSTANCE":
        return {
          id,
          type: "Container",
          style: {
            ...style,
            display: "flex",
            flexDirection: "column",
            padding: "12px",
          },
          children: (figmaNode.children || []).map((child) =>
            this.transformFigmaToCanvasNode(child),
          ),
        };

      case "RECTANGLE":
        return {
          id,
          type: "Container",
          style: { ...style, backgroundColor: "#f1f5f9" },
          children: [],
        };

      default:
        return {
          id,
          type: "View",
          style,
          children: (figmaNode.children || []).map((child) =>
            this.transformFigmaToCanvasNode(child),
          ),
        };
    }
  }
}
