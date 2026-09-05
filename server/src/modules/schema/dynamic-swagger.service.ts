import { INestApplication, Injectable } from "@nestjs/common";
import { OpenAPIObject, ParameterObject, SwaggerModule } from "@nestjs/swagger";
import { ColumnMeta } from "./interfaces/schema-registry.interface";
import { SchemaRegistryService } from "./schema-registry.service";

@Injectable()
export class DynamicSwaggerService {
  private document?: OpenAPIObject;
  private basePaths: OpenAPIObject["paths"] = {};
  private baseSchemas: Record<string, any> = {};

  constructor(private readonly schemaRegistry: SchemaRegistryService) {}

  public async setupSwagger(
    app: INestApplication,
    baseDocument: OpenAPIObject,
  ): Promise<void> {
    this.document = baseDocument;
    this.basePaths = { ...baseDocument.paths };
    this.baseSchemas = { ...(baseDocument.components?.schemas ?? {}) };

    await this.refreshSwaggerDoc();

    SwaggerModule.setup("api-docs", app, () => this.document!, {
      patchDocumentOnRequest: (_request, _response, document) => document,
    });
  }

  public async refreshSwaggerDoc(): Promise<void> {
    if (!this.document) return;

    const dynamicPaths: OpenAPIObject["paths"] = {};
    const dynamicSchemas: Record<string, any> = {};

    for (const table of this.schemaRegistry.getAllSchemas()) {
      const componentPrefix = this.toComponentName(
        `${table.projectId}_${table.tableName}`,
      );
      const recordSchemaName = `${componentPrefix}Record`;
      const createSchemaName = `${componentPrefix}CreateInput`;
      const updateSchemaName = `${componentPrefix}UpdateInput`;
      const operationSuffix = this.toOperationId(
        `${table.projectId}_${table.tableName}`,
      );
      const tag = `Dynamic Data: ${table.tableName} (${table.projectId})`;

      const inputProperties = Object.fromEntries(
        table.columns.map((column) => [
          column.name,
          this.createPropertySchema(column),
        ]),
      );
      const required = table.columns
        .filter((column) => column.isRequired)
        .map((column) => column.name);

      dynamicSchemas[recordSchemaName] = {
        type: "object",
        required: ["id", "created_at", ...required],
        properties: {
          id: { type: "string", format: "uuid", readOnly: true },
          ...inputProperties,
          created_at: { type: "string", format: "date-time", readOnly: true },
        },
      };
      dynamicSchemas[createSchemaName] = {
        type: "object",
        ...(required.length > 0 ? { required } : {}),
        properties: inputProperties,
      };
      dynamicSchemas[updateSchemaName] = {
        type: "object",
        properties: inputProperties,
      };

      const basePath = `/api/dynamic-data/${encodeURIComponent(
        table.projectId,
      )}/${encodeURIComponent(table.tableName)}`;
      const recordRef = { $ref: `#/components/schemas/${recordSchemaName}` };

      dynamicPaths[basePath] = {
        get: {
          tags: [tag],
          operationId: `findAll_${operationSuffix}`,
          summary: `${table.tableName} 목록 조회`,
          parameters: [
            this.queryParameter("page", 1),
            this.queryParameter("limit", 20),
          ],
          responses: {
            200: {
              description: "목록 조회 성공",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["data", "meta"],
                    properties: {
                      data: { type: "array", items: recordRef },
                      meta: {
                        type: "object",
                        required: ["total", "page", "limit", "totalPages"],
                        properties: {
                          total: { type: "integer" },
                          page: { type: "integer" },
                          limit: { type: "integer" },
                          totalPages: { type: "integer" },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        post: {
          tags: [tag],
          operationId: `create_${operationSuffix}`,
          summary: `${table.tableName} 데이터 생성`,
          requestBody: this.requestBody(createSchemaName, true),
          responses: {
            201: this.jsonResponse("생성 성공", recordRef),
            400: { description: "잘못된 요청" },
          },
        },
      };

      dynamicPaths[`${basePath}/{id}`] = {
        parameters: [this.idParameter()],
        get: {
          tags: [tag],
          operationId: `findOne_${operationSuffix}`,
          summary: `${table.tableName} 단일 데이터 조회`,
          responses: {
            200: this.jsonResponse("조회 성공", recordRef),
            404: { description: "데이터를 찾을 수 없음" },
          },
        },
        patch: {
          tags: [tag],
          operationId: `update_${operationSuffix}`,
          summary: `${table.tableName} 데이터 수정`,
          requestBody: this.requestBody(updateSchemaName, true),
          responses: {
            200: this.jsonResponse("수정 성공", recordRef),
            404: { description: "데이터를 찾을 수 없음" },
          },
        },
        delete: {
          tags: [tag],
          operationId: `remove_${operationSuffix}`,
          summary: `${table.tableName} 데이터 삭제`,
          responses: {
            200: this.jsonResponse("삭제 성공", {
              type: "object",
              required: ["success", "id"],
              properties: {
                success: { type: "boolean", example: true },
                id: { type: "string", format: "uuid" },
              },
            }),
            404: { description: "데이터를 찾을 수 없음" },
          },
        },
      };
    }

    this.document.paths = { ...this.basePaths, ...dynamicPaths };
    this.document.components = {
      ...this.document.components,
      schemas: { ...this.baseSchemas, ...dynamicSchemas },
    };
  }

  private createPropertySchema(column: ColumnMeta): Record<string, any> {
    const schema: Record<string, any> = {
      description: column.description ?? `${column.name} 필드`,
    };

    switch (column.type) {
      case "number":
        schema.type = "number";
        break;
      case "boolean":
        schema.type = "boolean";
        break;
      case "datetime":
        schema.type = "string";
        schema.format = "date-time";
        break;
      case "relation":
        schema.type = "string";
        schema.format = "uuid";
        schema.description = `${column.description ?? column.name} (Relation: ${column.relation?.targetTable}.${column.relation?.targetColumn || "id"})`;
        break;
      default:
        schema.type = "string";
    }

    return schema;
  }

  private toComponentName(value: string): string {
    return value
      .split(/[^a-zA-Z0-9]+/)
      .filter(Boolean)
      .map((part) => part[0].toUpperCase() + part.slice(1))
      .join("");
  }

  private toOperationId(value: string): string {
    return value.replace(/[^a-zA-Z0-9_]/g, "_");
  }

  private queryParameter(name: string, example: number): ParameterObject {
    return {
      name,
      in: "query",
      required: false,
      schema: { type: "integer", minimum: 1, example },
    };
  }

  private idParameter(): ParameterObject {
    return {
      name: "id",
      in: "path",
      required: true,
      schema: { type: "string", format: "uuid" },
    };
  }

  private requestBody(schemaName: string, required: boolean) {
    return {
      required,
      content: {
        "application/json": {
          schema: { $ref: `#/components/schemas/${schemaName}` },
        },
      },
    };
  }

  private jsonResponse(description: string, schema: Record<string, any>) {
    return {
      description,
      content: { "application/json": { schema } },
    };
  }
}
