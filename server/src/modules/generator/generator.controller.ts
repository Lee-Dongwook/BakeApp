import { Controller, Post, Body, Query } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiQuery } from "@nestjs/swagger";
import { GeneratorService, ComponentNode } from "./generator.service";

class GenerateCodeDto {
  pageName: string;
  ast: ComponentNode;
}

@ApiTags("Code Generator (RN & React 코드 컴파일러)")
@Controller("api/generator")
export class GeneratorController {
  constructor(private readonly generatorService: GeneratorService) {}

  @Post("compile")
  @ApiOperation({
    summary: "JSON AST를 React Native / React Web 코드(.tsx)로 컴파일",
    description:
      "target 쿼리로 rn(React Native) 또는 react(React Web)을 지정하여 소스코드를 생성합니다.",
  })
  @ApiQuery({
    name: "target",
    enum: ["rn", "react"],
    required: true,
    example: "rn",
  })
  async compileCode(
    @Query("target") target: "rn" | "react",
    @Body() dto: GenerateCodeDto,
  ) {
    const { pageName, ast } = dto;

    if (target === "react") {
      const code = this.generatorService.generateReactWeb(pageName, ast);
      return { target: "react", code };
    } else {
      const code = this.generatorService.generateReactNative(pageName, ast);
      return { target: "rn", code };
    }
  }
}
