import { Injectable } from "@nestjs/common";

@Injectable()
export class ValueResolverService {
  private getValueByPath(obj: Record<string, any>, path: string): any {
    if (!obj || !path) return undefined;

    const normalizedPath = path.replace(/\[(\d+)\]/g, ".$1");
    const keys = normalizedPath.split(".");

    return keys.reduce(
      (acc, key) => (acc?.[key] !== undefined ? acc[key] : undefined),
      obj,
    );
  }

  private resolveString(str: string, context: Record<string, any>): any {
    const exactMatch = str.match(/^\{\{\s*([a-zA-Z0-9_.[\]-]+)\s*\}\}$/);
    if (exactMatch) {
      const value = this.getValueByPath(context, exactMatch[1]);
      return value !== undefined ? value : str;
    }

    return str.replace(/\{\{\s*([a-zA-Z0-9_.[\]-]+)\s*\}\}/g, (match, path) => {
      const value = this.getValueByPath(context, path);
      if (value === undefined || value === null) {
        return "";
      }
      return typeof value === "object" ? JSON.stringify(value) : String(value);
    });
  }

  resolve<T = any>(input: T, context: Record<string, any>): T {
    if (typeof input === "string") {
      return this.resolveString(input, context) as T;
    }

    if (Array.isArray(input)) {
      return input.map((item) => this.resolve(item, context)) as T;
    }

    if (input !== null && typeof input === "object") {
      const resolvedObj: Record<string, any> = {};
      for (const [key, value] of Object.entries(input)) {
        resolvedObj[key] = this.resolve(value, context);
      }
      return resolvedObj as T;
    }
    return input;
  }
}
