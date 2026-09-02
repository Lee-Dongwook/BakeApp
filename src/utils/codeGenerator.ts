import type { ComponentNode } from "../store/useCanvasStore";

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

    case "Card": {
      const childrenJSX =
        node.children && node.children.length > 0
          ? node.children.map((c) => generateJSX(c, indentLevel + 1)).join("\n")
          : `${indent}  {/* Empty Card */}`;

      return `${indent}<div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col gap-2"${styleAttr}>\n${childrenJSX}\n${indent}</div>`;
    }

    case "Form": {
      const childrenJSX =
        node.children && node.children.length > 0
          ? node.children.map((c) => generateJSX(c, indentLevel + 1)).join("\n")
          : `${indent}  {/* Empty Form */}`;

      return `${indent}<form onSubmit={(e) => { e.preventDefault(); handleButtonClick('${node.id}'); }} className="flex flex-col gap-3"${styleAttr}>\n${childrenJSX}\n${indent}</form>`;
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
          : "버튼";

      const hasWorkflow =
        node.props?.onClickWorkflow && node.props.onClickWorkflow.length > 0;
      const onClickAttr = hasWorkflow
        ? ` onClick={() => handleButtonClick('${node.id}')}`
        : "";

      const variant = node.props?.variant || "primary";
      const variantClass =
        variant === "secondary"
          ? "px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold"
          : variant === "danger"
            ? "px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold"
            : variant === "outline"
              ? "px-4 py-2 border border-amber-500 text-amber-600 hover:bg-amber-50 rounded-lg text-xs font-semibold"
              : "px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg text-xs font-bold";

      return `${indent}<button type="button" className="${variantClass}"${styleAttr}${onClickAttr}>\n${indent}  ${btnText}\n${indent}</button>`;
    }

    case "TextInput": {
      const fieldName = node.props?.fieldName || node.id;
      const placeholder = node.props?.placeholder || "입력하세요";
      const inputType = node.props?.inputType || "text";

      return `${indent}<input\n${indent}  type="${inputType}"\n${indent}  placeholder="${placeholder}"\n${indent}  value={formData['${fieldName}'] || ''}\n${indent}  onChange={(e) => handleInputChange('${fieldName}', e.target.value)}\n${indent}  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"${styleAttr}\n${indent}/>`;
    }

    case "Select": {
      const fieldName = node.props?.fieldName || node.id;
      const rawOptions = node.props?.options || "옵션 1, 옵션 2, 옵션 3";
      const options = Array.isArray(rawOptions)
        ? rawOptions
        : String(rawOptions)
            .split(",")
            .map((opt) => opt.trim())
            .filter(Boolean);

      const optionsJSX = options
        .map(
          (opt: string) =>
            `${indent}  <option value="${opt}">${opt}</option>`,
        )
        .join("\n");

      return `${indent}<select\n${indent}  value={formData['${fieldName}'] || ''}\n${indent}  onChange={(e) => handleInputChange('${fieldName}', e.target.value)}\n${indent}  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"${styleAttr}>\n${indent}  <option value="">${node.props?.placeholder || "-- 선택 --"}</option>\n${optionsJSX}\n${indent}</select>`;
    }

    case "Checkbox": {
      const fieldName = node.props?.fieldName || node.id;
      const label = node.props?.label || "동의합니다";

      return `${indent}<label className="inline-flex items-center gap-2 text-xs text-slate-800 cursor-pointer"${styleAttr}>\n${indent}  <input\n${indent}    type="checkbox"\n${indent}    checked={Boolean(formData['${fieldName}'] || false)}\n${indent}    onChange={(e) => handleInputChange('${fieldName}', e.target.checked)}\n${indent}    className="rounded border-slate-300 text-amber-500 focus:ring-amber-500"\n${indent}  />\n${indent}  <span>${label}</span>\n${indent}</label>`;
    }

    case "Image": {
      const src =
        node.props?.src ||
        "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500";
      const alt = node.props?.alt || "이미지";

      return `${indent}<img src="${src}" alt="${alt}" className="w-full h-40 object-cover rounded-lg"${styleAttr} />`;
    }

    case "Badge": {
      const text = node.props?.text || "Badge";
      const variant = node.props?.variant || "neutral";
      const badgeClass =
        variant === "success"
          ? "bg-emerald-100 text-emerald-800"
          : variant === "warning"
            ? "bg-amber-100 text-amber-800"
            : variant === "danger"
              ? "bg-rose-100 text-rose-800"
              : "bg-slate-100 text-slate-800";

      return `${indent}<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${badgeClass}"${styleAttr}>${text}</span>`;
    }

    case "Divider":
      return `${indent}<hr className="my-2 border-slate-200"${styleAttr} />`;

    case "DataList":
    case "Table": {
      const tableName = node.props?.tableName || "items";
      const displayField = node.props?.displayField || "title";
      return `${indent}<div className="rounded-lg border border-slate-200 bg-white p-3"${styleAttr}>\n${indent}  <div className="font-semibold text-xs mb-2 text-slate-800">📋 ${tableName} 데이터 목록</div>\n${indent}  {/* Dynamic Database Table Data Bindings */}\n${indent}  <div className="text-xs text-slate-500">테이블 [${tableName}]의 [${displayField}] 필드가 런타임에 로드됩니다.</div>\n${indent}</div>`;
    }

    default:
      return `${indent}<div>{/* Component: ${node.type} */}</div>`;
  }
};

export const generateReactCode = (rootNode: ComponentNode): string => {
  const jsxCode = generateJSX(rootNode, 2);

  return `import React, { useState } from 'react';

export default function GeneratedScreen() {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [workflowResults, setWorkflowResults] = useState<Record<string, any>>({});

  const handleInputChange = (fieldName: string, value: any) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
  };

  const handleButtonClick = async (nodeId: string) => {
    console.log('[Workflow] Action Triggered from Node:', nodeId);
    
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
  };

  return (
${jsxCode}
  );
}
`;
};
