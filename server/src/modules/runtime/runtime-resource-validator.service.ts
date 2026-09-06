import { Injectable, HttpStatus } from "@nestjs/common";
import { RuntimeException } from "./runtime.exception";

@Injectable()
export class RuntimeResourceValidatorService {
  validateResourceInRelease(
    snapshot: any,
    resourceType: "queries" | "workflows" | "pages",
    resourceId: string,
  ): any {
    const resourceList =
      snapshot[resourceType] || snapshot.document?.[resourceType] || [];
    const foundResource = resourceList.some(
      (item: any) => item.id === resourceId,
    );

    if (!foundResource) {
      const errorCodeMap = {
        queries: "RUNTIME_QUERY_NOT_FOUND",
        workflows: "RUNTIME_WORKFLOW_NOT_FOUND",
        pages: "RUNTIME_PAGE_NOT_FOUND",
      } as const;

      throw new RuntimeException(
        errorCodeMap[resourceType] || "RUNTIME_RESOURCE_NOT_IN_RELEASE",
        `요청한 ${resourceType} (${resourceId}) 항목은 현재 배포된 Production Release에 존재하지 않습니다.`,
        HttpStatus.BAD_REQUEST,
      );
    }
    return foundResource;
  }
}
