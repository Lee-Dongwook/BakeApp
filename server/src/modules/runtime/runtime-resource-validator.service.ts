import { Injectable, HttpStatus } from "@nestjs/common";
import { RuntimeException } from "./runtime.exception";

@Injectable()
export class RuntimeResourceValidatorService {
  /**
   * 배포된 릴리즈 스냅샷에 존재하는 리소스만 실행하도록 막고, 해당 정의를 반환합니다.
   */
  validateResourceInRelease(
    snapshot: any,
    resourceType: "queries" | "workflows" | "pages",
    resourceId: string,
  ): any {
    const resourceList =
      snapshot?.[resourceType] || snapshot?.document?.[resourceType] || [];
    const foundResource = Array.isArray(resourceList)
      ? resourceList.find((item: any) => item?.id === resourceId)
      : undefined;

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
