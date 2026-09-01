import { ComponentNode } from "../store/useEditorStore";

const styleToString = (style?: Record<string, any>): string => {
  if (!style || Object.keys(style).length === 0) return "";

  const stylePairs = Object.entries(style)
    .map(([k, v]) => `${k}: ${typeof v === "number" ? v : `'${v}'`}`)
    .join(", ");

  return ` style={{ ${stylePairs} }}`;
};

const parseDynamicExpr = (text: string): string => {
  if (!text) return "";
  if (!text.includes("{{")) return text;

  return text.replace(
    /\{\{\s*form\.([\w\.]+)\s*\}\}/g,
    (_, field) => `{formData['${field}'] || ''}`,
  );
};

const generateJSX = (node: ComponentNode | string, indentLevel = 3): string => {
  const indent = "  ".repeat(indentLevel);

  if (typeof node === "string") {
    const parsed = parseDynamicExpr(node);
    return parsed.startsWith("{")
      ? `${indent}${parsed}`
      : `${indent}"${parsed}"`;
  }

  const styleAttr = styleToString(node.style);

  switch (node.type) {
    case "Container":
    case "View": {
      const childrenJSX =
        node.children && node.children.length > 0
          ? node.children.map((c) => generateJSX(c, indentLevel + 1)).join("\n")
          : `${indent}  {/* Empty Container */}`;

      return `${indent}<div${styleAttr}>\n${childrenJSX}\n${indent}</div>`;
    }

    case "Text": {
      const textContent =
        node.children && node.children.length > 0
          ? node.children
              .map((c) =>
                typeof c === "string" ? parseDynamicExpr(c) : generateJSX(c, 0),
              )
              .join("")
          : "";

      return `${indent}<span${styleAttr}>${textContent}</span>`;
    }

    case "Button": {
      const btnText =
        node.children && node.children.length > 0
          ? node.children
              .map((c) =>
                typeof c === "string" ? parseDynamicExpr(c) : generateJSX(c, 0),
              )
              .join("")
          : "Button";

      const hasWorkflow =
        node.props?.onClickWorkflow && node.props.onClickWorkflow.length > 0;
      const onClickAttr = hasWorkflow
        ? ` onClick={() => handleButtonClick('${node.id}')}`
        : "";

      return `${indent}<button${styleAttr}${onClickAttr}>\n${indent}  ${btnText}\n${indent}</button>`;
    }

    case "TextInput": {
      const fieldName = node.props?.fieldName || node.id;
      const placeholder = node.props?.placeholder || "입력하세요";

      return `${indent}<input\n${indent}  type="text"\n${indent}  placeholder="${placeholder}"\n${indent}  value={formData['${fieldName}'] || ''}\n${indent}  onChange={(e) => handleInputChange('${fieldName}', e.target.value)}${styleAttr}\n${indent}/>`;
    }

    default:
      return `${indent}<div>{/* Unknown Component: ${node.type} */}</div>`;
  }
};

export const generateReactCode = (rootNode: ComponentNode): string => {
  const jsxCode = generateJSX(rootNode, 2);

  return `import React, { useState } from 'react';

export default function GeneratedScreen() {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [workflowResults, setWorkflowResults] = useState<Record<string, any>>({});

  const handleInputChange = (fieldName: string, value: string) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
  };

  const handleButtonClick = async (nodeId: string) => {
    console.log('[Workflow] Action Triggered from Node:', nodeId);
    
    /*
    try {
      const response = await fetch('/api/workflow/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodeId, formData }),
      });
      const result = await response.json();
      setWorkflowResults((prev) => ({ ...prev, [nodeId]: result }));
    } catch (err) {
      console.error(err);
    }
    */
  };

  return (
${jsxCode}
  );
}
`;
};
