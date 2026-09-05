import { Injectable } from "@nestjs/common";

export interface ComponentNode {
  type: string;
  id?: string;
  name?: string;
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

    if (node.type === "Select") {
      context.usesFormState = true;
      const fieldName = String(props.fieldName ?? node.id ?? "select");
      const options = Array.isArray(props.options)
        ? props.options
        : String(props.options || "선택 1, 선택 2, 선택 3")
            .split(",")
            .map((opt) => opt.trim())
            .filter(Boolean);

      if (target === "rn") {
        context.imports.add("View");
        context.imports.add("Text");
        return `${indent}<View${styleAttribute}>\n${indent}  <Text>{formData[${JSON.stringify(fieldName)}] || "옵션 선택"}</Text>\n${indent}</View>`;
      }
      const optionsJsx = options
        .map(
          (opt: string) =>
            `${indent}  <option value={${JSON.stringify(opt)}}>${opt}</option>`,
        )
        .join("\n");
      return `${indent}<select\n${indent}  value={formData[${JSON.stringify(fieldName)}] ?? ''}\n${indent}  onChange={(event) => handleInputChange(${JSON.stringify(fieldName)}, event.target.value)}${styleAttribute}>\n${optionsJsx}\n${indent}</select>`;
    }

    if (node.type === "Checkbox") {
      context.usesFormState = true;
      const fieldName = String(props.fieldName ?? node.id ?? "checkbox");
      const label = String(props.label ?? "체크박스");
      if (target === "rn") {
        context.imports.add("Switch");
        context.imports.add("View");
        context.imports.add("Text");
        return `${indent}<View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>\n${indent}  <Switch value={Boolean(formData[${JSON.stringify(fieldName)}])} onValueChange={(val) => handleInputChange(${JSON.stringify(fieldName)}, String(val))} />\n${indent}  <Text>${label}</Text>\n${indent}</View>`;
      }
      return `${indent}<label className="flex items-center gap-2 cursor-pointer"${styleAttribute}>\n${indent}  <input type="checkbox" checked={Boolean(formData[${JSON.stringify(fieldName)}])} onChange={(e) => handleInputChange(${JSON.stringify(fieldName)}, String(e.target.checked))} />\n${indent}  <span>${label}</span>\n${indent}</label>`;
    }

    if (node.type === "Image") {
      const src = String(props.src || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500");
      const alt = String(props.alt || "이미지");
      if (target === "rn") {
        context.imports.add("Image");
        return `${indent}<Image source={{ uri: ${JSON.stringify(src)} }}${styleAttribute} />`;
      }
      return `${indent}<img src={${JSON.stringify(src)}} alt={${JSON.stringify(alt)}}${styleAttribute} />`;
    }

    if (node.type === "Badge") {
      const text = String(props.text || "뱃지");
      if (target === "rn") {
        context.imports.add("View");
        context.imports.add("Text");
        return `${indent}<View${styleAttribute}>\n${indent}  <Text>${text}</Text>\n${indent}</View>`;
      }
      return `${indent}<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"${styleAttribute}>${text}</span>`;
    }

    if (node.type === "Divider") {
      if (target === "rn") {
        context.imports.add("View");
        return `${indent}<View style={{ height: 1, backgroundColor: '#e2e8f0', marginVertical: 8, ...${JSON.stringify(style)} }} />`;
      }
      return `${indent}<hr className="my-3 border-slate-200"${styleAttribute} />`;
    }

    if (node.type === "Button") {
      const tag = target === "rn" ? "Pressable" : "button";
      if (target === "rn") context.imports.add("Pressable");
      const typeAttribute = target === "react" ? ' type="button"' : "";
      return `${indent}<${tag}${typeAttribute}${styleAttribute}>${this.renderChildren(children, target, context, depth)}</${tag}>`;
    }

    if (node.type === "DataList" || node.type === "Table") {
      const tag = target === "rn" ? "View" : "section";
      if (target === "rn") context.imports.add("View");
      const description = String(props.displayField || props.tableName || "데이터 목록");
      if (target === "rn") context.imports.add("Text");
      const label = target === "rn" ? `<Text>${this.textValue(description)}</Text>` : this.textValue(description);
      return `${indent}<${tag}${styleAttribute}>${label}</${tag}>`;
    }

    if (node.type === "Form" || node.type === "Card") {
      const tag = target === "rn" ? "View" : node.type === "Form" ? "form" : "div";
      if (target === "rn") context.imports.add("View");
      return `${indent}<${tag}${styleAttribute}>${this.renderChildren(children, target, context, depth)}</${tag}>`;
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
