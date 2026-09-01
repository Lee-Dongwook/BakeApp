import { Injectable, OnModuleInit } from "@nestjs/common";
import { OpenAPIObject, SwaggerModule } from "@nestjs/swagger";
import { INestApplication } from "@nestjs/common";
import { SchemaRegistryService } from "./schema-registry.service";

@Injectable()
export class DynamicSwaggerService implements OnModuleInit {
  private app: INestApplication;
  private baseDocument: OpenAPIObject;

  constructor(private readonly schemaRegistry: SchemaRegistryService) {}

  onModuleInit() {}

  private mapColumnTypeToSwagger(type: string): string {
    switch (type.toLowerCase()) {
      case "int":
      case "integer":
      case "number":
        return "integer";
      case "boolean":
      case "bool":
        return "boolean";
      default:
        return "string";
    }
  }

  public setupSwagger(app: INestApplication, baseDocument: OpenAPIObject) {
    this.app = app;
    this.baseDocument = baseDocument;
    this.refreshSwaggerDoc();
  }

  public async refreshSwaggerDoc() {
    if (!this.app || !this.baseDocument) return;

    const tables = await this.schemaRegistry.getAllSchemas();
    const dynamicPaths: Record<string, any> = {};
    const dynamicComponents: Record<string, any> = {};

    for (const table of tables) {
      const { tableName, columns } = table;
      const schemaName = `${tableName}Dto`;

      const properties: Record<string, any> = {};
      columns.forEach((col: any) => {
        properties[col.name] = {
          type: this.mapColumnTypeToSwagger(col.type),
          description: col.description || `${col.name} 필드`,
        };
      });

      dynamicComponents[schemaName] = {
        type: "object",
        properties,
      };

      const basePath = `/api/dynamic/${tableName}`;

      dynamicPaths[basePath] = {
        get: {
          tags: [`Dynamic DB : ${tableName}`],
          summary: `${tableName} 목록 조회`,
          responses: {
            200: {
              description: "성공",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: { $ref: `#/components/schemas/${schemaName}` },
                  },
                },
              },
            },
          },
        },
        post: {
          tags: [`Dynamic DB: ${tableName}`],
          summary: `${tableName} 단일 데이터 생성`,
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: `#/components/schemas/${schemaName}` },
              },
            },
          },
          responses: {
            201: { description: "생성 완료" },
          },
        },
      };

      dynamicPaths[`${basePath}/{id}`] = {
        delete: {
          tags: [`Dynamic DB: ${tableName}`],
          summary: `${tableName} 데이터 삭제`,
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            200: { description: "삭제 완료" },
          },
        },
      };
    }

    const updatedDocument: OpenAPIObject = {
      ...this.baseDocument,
      paths: {
        ...this.baseDocument.paths,
        ...dynamicPaths,
      },
      components: {
        ...this.baseDocument.components,
        schemas: {
          ...(this.baseDocument.components?.schemas || {}),
          ...dynamicComponents,
        },
      },
    };

    SwaggerModule.setup("api-docs", this.app, updatedDocument);
  }
}
