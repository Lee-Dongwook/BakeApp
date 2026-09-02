import { Injectable } from "@nestjs/common";

export interface ComponentNode {
  type: string;
  id?: string;
  props?: Record<string, unknown>;
  style?: Record<string, unknown>;
  children?: (ComponentNode | string)[];
}

type Target = "rn" | "react";

interface GenerationContext {
  imports: Set<string>;
  usesFormState: boolean;
}

@Injectable()
export class GeneratorService {
  private styleAttribute(style: Record<string, unknown>) {
    return Object.keys(style).length ? ` style={${JSON.stringify(style)}}` : "";
  }

  private textValue(value: string) {
    return `{${JSON.stringify(value)}}`;
  }

  private renderChildren(
    children: (ComponentNode | string)[],
    target: Target,
    context: GenerationContext,
    depth: number,
  ) {
    if (!children.length) return "";
    const indent = "  ".repeat(depth);
    return `\n${children
      .map((child) => this.renderNode(child, target, context, depth + 1))
      .join("\n")}\n${indent}`;
  }

  private renderNode(
    node: ComponentNode | string,
    target: Target,
    context: GenerationContext,
    depth = 2,
  ): string {
    const indent = "  ".repeat(depth);
    if (typeof node === "string") return `${indent}${this.textValue(node)}`;

    const style = node.style ?? {};
    const props = node.props ?? {};
    const children = node.children ?? [];
    const styleAttribute = this.styleAttribute(style);

    if (node.type === "Text") {
      const tag = target === "rn" ? "Text" : "span";
      if (target === "rn") context.imports.add("Text");
      return `${indent}<${tag}${styleAttribute}>${this.renderChildren(children, target, context, depth)}</${tag}>`;
    }

    if (node.type === "TextInput") {
      context.usesFormState = true;
      const fieldName = String(props.fieldName ?? node.id ?? "input");
      const placeholder = String(props.placeholder ?? "내용을 입력하세요");
      if (target === "rn") {
        context.imports.add("TextInput");
        return `${indent}<TextInput\n${indent}  placeholder={${JSON.stringify(placeholder)}}\n${indent}  value={formData[${JSON.stringify(fieldName)}] ?? ''}\n${indent}  onChangeText={(value) => handleInputChange(${JSON.stringify(fieldName)}, value)}${styleAttribute}\n${indent}/>`;
      }
      return `${indent}<input\n${indent}  type="text"\n${indent}  placeholder={${JSON.stringify(placeholder)}}\n${indent}  value={formData[${JSON.stringify(fieldName)}] ?? ''}\n${indent}  onChange={(event) => handleInputChange(${JSON.stringify(fieldName)}, event.target.value)}${styleAttribute}\n${indent}/>`;
    }

    if (node.type === "Button") {
      const tag = target === "rn" ? "Pressable" : "button";
      if (target === "rn") context.imports.add("Pressable");
      const typeAttribute = target === "react" ? ' type="button"' : "";
      return `${indent}<${tag}${typeAttribute}${styleAttribute}>${this.renderChildren(children, target, context, depth)}</${tag}>`;
    }

    if (node.type === "DataList") {
      const tag = target === "rn" ? "View" : "section";
      if (target === "rn") context.imports.add("View");
      const description = String(props.displayField || props.tableName || "데이터 목록");
      if (target === "rn") context.imports.add("Text");
      const label = target === "rn" ? `<Text>${this.textValue(description)}</Text>` : this.textValue(description);
      return `${indent}<${tag}${styleAttribute}>${label}</${tag}>`;
    }

    const tag = target === "rn" ? "View" : "div";
    if (target === "rn") context.imports.add("View");
    return `${indent}<${tag}${styleAttribute}>${this.renderChildren(children, target, context, depth)}</${tag}>`;
  }

  private componentName(pageName: string) {
    const name = pageName
      .replace(/[^a-zA-Z0-9]+/g, " ")
      .trim()
      .split(" ")
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join("");
    return `${name || "Generated"}Page`;
  }

  private generate(pageName: string, ast: ComponentNode, target: Target) {
    const context: GenerationContext = { imports: new Set(), usesFormState: false };
    const body = this.renderNode(ast, target, context);
    const reactImport = context.usesFormState
      ? "import { useState } from 'react';"
      : "import React from 'react';";
    const nativeImport =
      target === "rn" && context.imports.size
        ? `\nimport { ${[...context.imports].sort().join(", ")} } from 'react-native';`
        : "";
    const state = context.usesFormState
      ? `\n  const [formData, setFormData] = useState<Record<string, string>>({});

  const handleInputChange = (fieldName: string, value: string) => {
    setFormData((current) => ({ ...current, [fieldName]: value }));
  };
`
      : "";

    return `${reactImport}${nativeImport}

export default function ${this.componentName(pageName)}() {${state}
  return (
${body}
  );
}
`;
  }

  generateReactNative(pageName: string, ast: ComponentNode) {
    return this.generate(pageName, ast, "rn");
  }

  generateReactWeb(pageName: string, ast: ComponentNode) {
    return this.generate(pageName, ast, "react");
  }
}
