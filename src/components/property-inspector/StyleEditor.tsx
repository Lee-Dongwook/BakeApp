import { Type as TypeIcon } from "lucide-react";
import type { TableMeta } from "../../api/schema";
import type { SelectedNodeEditorProps } from "./types";

interface StyleEditorProps extends SelectedNodeEditorProps {
  tables: TableMeta[];
  loadingSchema: boolean;
}

const controlClassName = "control text-xs";

export function StyleEditor({
  page,
  node,
  tables,
  loadingSchema,
  updateNodeStyle,
  updateNodeProps,
  updateNodeTextContent,
}: StyleEditorProps) {
  const isTextType = node.type === "Text";
  const textValue =
    isTextType && typeof node.children?.[0] === "string"
      ? node.children[0]
      : "";
  const currentTableName = (node.props?.tableName as string) || "";
  const currentDisplayFieldName = (node.props?.displayField as string) || "";
  const availableColumns =
    tables.find((table) => table.table_name === currentTableName)?.columns ||
    [];

  const updateStyle = (style: Record<string, unknown>) =>
    updateNodeStyle(page.id, node.id, style);
  const updateProps = (props: Record<string, unknown>) =>
    updateNodeProps(page.id, node.id, props);

  return (
    <>
      {isTextType && (
        <div className="space-y-2">
          <label className="field-label flex items-center space-x-1">
            <TypeIcon className="w-3.5 h-3.5" />
            <span>텍스트 내용</span>
          </label>
          <input
            type="text"
            value={textValue}
            onChange={(event) =>
              updateNodeTextContent(page.id, node.id, event.target.value)
            }
            className={controlClassName}
          />
        </div>
      )}

      {node.type === "TextInput" && (
        <div className="space-y-2">
          <label className="field-label">Placeholder (안내 문구)</label>
          <input
            type="text"
            value={node.props?.placeholder || ""}
            onChange={(event) =>
              updateProps({ placeholder: event.target.value })
            }
            className={controlClassName}
          />
        </div>
      )}

      {node.type === "DataList" && (
        <div className="space-y-3">
          <SelectField
            label="대상 테이블"
            value={currentTableName}
            disabled={loadingSchema}
            onChange={(value) =>
              updateProps({ tableName: value, displayField: "" })
            }
          >
            <option value="">-- 테이블 선택 --</option>
            {tables.map((table) => (
              <option key={table.table_name} value={table.table_name}>
                {table.table_name}
              </option>
            ))}
          </SelectField>
          <SelectField
            label="목록에 표시할 컬럼"
            value={currentDisplayFieldName}
            disabled={!currentTableName || loadingSchema}
            onChange={(value) => updateProps({ displayField: value })}
          >
            <option value="">-- 컬럼 선택 --</option>
            {availableColumns.map((column) => (
              <option key={column.column_name} value={column.column_name}>
                {column.column_name} ({column.data_type})
              </option>
            ))}
          </SelectField>
        </div>
      )}

      <div className="space-y-4">
        <div className="eyebrow flex items-center space-x-1">
          <span>Visual Controls</span>
        </div>
        <ColorField
          label="배경색 (Background Color)"
          value={node.style?.backgroundColor || ""}
          fallback="#ffffff"
          onChange={(backgroundColor) => updateStyle({ backgroundColor })}
        />
        {isTextType && (
          <ColorField
            label="글자색 (Text Color)"
            value={node.style?.color || ""}
            fallback="#000000"
            onChange={(color) => updateStyle({ color })}
          />
        )}
        {isTextType && (
          <NumberField
            label="폰트 크기 (Font Size)"
            value={node.style?.fontSize || 14}
            onChange={(fontSize) => updateStyle({ fontSize })}
          />
        )}
        <NumberField
          label="패딩 (Padding)"
          value={node.style?.padding || 0}
          onChange={(padding) => updateStyle({ padding })}
        />
        <NumberField
          label="모서리 곡률 (Border Radius)"
          value={node.style?.borderRadius || 0}
          onChange={(borderRadius) => updateStyle({ borderRadius })}
        />
      </div>
    </>
  );
}

function SelectField({
  label,
  value,
  disabled,
  onChange,
  children,
}: React.PropsWithChildren<{
  label: string;
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}>) {
  return (
    <div className="space-y-1">
      <label className="field-label">{label}</label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className={`${controlClassName} disabled:opacity-50`}
      >
        {children}
      </select>
    </div>
  );
}

function ColorField({
  label,
  value,
  fallback,
  onChange,
}: {
  label: string;
  value: string;
  fallback: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1">
      <label className="field-label">{label}</label>
      <div className="flex items-center space-x-2">
        <input
          type="color"
          value={value || fallback}
          onChange={(event) => onChange(event.target.value)}
          className="h-7 w-7 cursor-pointer rounded border-0 bg-transparent"
        />
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="control flex-1 py-1 font-mono text-xs"
        />
      </div>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-1">
      <label className="field-label">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className={controlClassName}
      />
    </div>
  );
}
