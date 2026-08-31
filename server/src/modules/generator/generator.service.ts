import { Injectable } from "@nestjs/common";

export interface ComponentNode {
  type: string;
  props?: Record<string, any>;
  style?: Record<string, any>;
  children?: (ComponentNode | string)[];
}

@Injectable()
export class GeneratorService {
  private renderNode(
    node: ComponentNode | string,
    target: "rn" | "react",
    imports: Set<string>,
    indentDepth = 2,
  ): string {
    const indent = " ".repeat(indentDepth * 2);

    if (typeof node === "string") {
      return `${indent}${node}`;
    }

    if (!node || !node.type) {
      return `${indent}/* Invalid Node */`;
    }

    const { type, props = {}, style = {}, children = [] } = node;

    let tagName = type;
    let mappedProps: Record<string, any> = { ...props };

    if (target == "rn") {
      if (
        [
          "View",
          "Text",
          "TextInput",
          "Image",
          "TouchableOpacity",
          "ScrollView",
        ].includes(type)
      ) {
        imports.add(type);
      } else if (type === "Container") {
        tagName = "View";
        imports.add("View");
      } else if (type === "Button") {
        tagName = "TouchableOpacity";
        imports.add("TouchableOpacity");
      }

      if (Object.keys(style).length > 0) {
        mappedProps["style"] = style;
      }
    } else {
      if (type === "View" || type === "Container") tagName = "div";
      else if (type === "Text") tagName = "span";
      else if (type === "Button") tagName = "button";
      else if (type === "TextInput") tagName = "input";
      else if (type === "Image") tagName = "img";

      if (Object.keys(style).length > 0) {
        mappedProps["style"] = style;
      }
    }

    const propsString = Object.keys(mappedProps)
      .map((key) => {
        const val = mappedProps[key];
        if (typeof val === "object") {
          return `${key}={${JSON.stringify(val)}`;
        }
        if (typeof val === "boolean" || typeof val === "number") {
          return `${key}={${val}}`;
        }
        return `${key}="${val}"`;
      })
      .join(" ");

    const openingTag = propsString
      ? `<${tagName} ${propsString}>`
      : `<${tagName}>`;

    if (children.length === 0) {
      return `${indent}<${tagName} ${propsString} />`;
    }

    const childrenCode = children
      .map((child) => this.renderNode(child, target, imports, indentDepth + 1))
      .join("\n");

    return `${indent}${openingTag}\n${childrenCode}\n${indent}</${tagName}>`;
  }

  private capitalize(str: string): string {
    if (!str) return "App";
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  generateReactNative(pageName: string, ast: ComponentNode): string {
    const importedComponents = new Set<string>();
    const codeBody = this.renderNode(ast, "rn", importedComponents);
    const imports = Array.from(importedComponents).join(", ");

    return `import React from 'react';
    import { ${imports ? imports + ", " : ""}StyleSheet } from 'react-native';
    export default function ${this.capitalize(pageName)}Page() {
        return (
            ${codeBody}
        );
    }
    `;
  }

  generateReactWeb(pageName: string, ast: ComponentNode): string {
    const codeBody = this.renderNode(ast, "react", new Set());

    return `import React from 'react';
        export default function ${this.capitalize(pageName)}Page() {
        return (
            ${codeBody}
        );
    }
    `;
  }
}
