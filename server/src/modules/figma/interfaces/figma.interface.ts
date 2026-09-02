export interface FigmaNode {
  id: string;
  name: string;
  type: string;
  absoluteBoundingBox?: { x: number; y: number; width: number; height: number };
  fills?: any[];
  style?: Record<string, any>;
  children?: FigmaNode[];
  characters?: string;
}

export interface ConvertFigmaDto {
  fileKey: string;
  nodeId?: string;
  accessToken: string;
}
