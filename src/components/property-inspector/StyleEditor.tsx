import React from "react";
import {
  Type as TypeIcon,
  Layout,
  Palette,
  Sliders,
  Maximize2,
} from "lucide-react";
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

  const isButtonType = node.type === "Button";
  const buttonTextValue =
    isButtonType && typeof node.children?.[0] === "string"
      ? node.children[0]
      : isButtonType &&
          typeof node.children?.[0] === "object" &&
          node.children[0].type === "Text" &&
          typeof node.children[0].children?.[0] === "string"
        ? node.children[0].children[0]
        : "버튼";

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
    <div className="space-y-6">
      {/* Component Specific Props */}
      <section className="space-y-3">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
          <Sliders className="w-3.5 h-3.5 text-amber-400" />
          <span>컴포넌트 속성 (Properties)</span>
        </div>

        {isTextType && (
          <div className="space-y-1.5">
            <label className="field-label flex items-center space-x-1">
              <TypeIcon className="w-3.5 h-3.5" />
              <span>텍스트 내용 (&#123;&#123; form.name &#125;&#125; 바인딩 가능)</span>
            </label>
            <textarea
              rows={2}
              value={textValue}
              onChange={(event) =>
                updateNodeTextContent(page.id, node.id, event.target.value)
              }
              className={`${controlClassName} font-mono resize-none`}
            />
          </div>
        )}

        {isButtonType && (
          <div className="space-y-2">
            <label className="field-label">버튼 텍스트</label>
            <input
              type="text"
              value={buttonTextValue}
              onChange={(event) =>
                updateNodeTextContent(page.id, node.id, event.target.value)
              }
              className={controlClassName}
            />
            <SelectField
              label="버튼 스타일 테마"
              value={String(node.props?.variant || "primary")}
              disabled={false}
              onChange={(val) => updateProps({ variant: val })}
            >
              <option value="primary">Primary (강조 색상)</option>
              <option value="secondary">Secondary (기본 회색)</option>
              <option value="outline">Outline (외곽선)</option>
              <option value="danger">Danger (위험/삭제)</option>
            </SelectField>
          </div>
        )}

        {node.type === "TextInput" && (
          <div className="space-y-2">
            <TextField
              label="Placeholder (안내 문구)"
              value={String(node.props?.placeholder || "")}
              onChange={(val) => updateProps({ placeholder: val })}
            />
            <TextField
              label="필드 이름 (Form State 바인딩 Key)"
              value={String(node.props?.fieldName || "")}
              placeholder="예: email, title, price"
              onChange={(val) => updateProps({ fieldName: val })}
            />
            <SelectField
              label="입력 타입"
              value={String(node.props?.inputType || "text")}
              disabled={false}
              onChange={(val) => updateProps({ inputType: val })}
            >
              <option value="text">일반 텍스트</option>
              <option value="number">숫자 (Number)</option>
              <option value="email">이메일 (Email)</option>
              <option value="password">비밀번호 (Password)</option>
            </SelectField>
          </div>
        )}

        {node.type === "Select" && (
          <div className="space-y-2">
            <TextField
              label="필드 이름 (Form State Key)"
              value={String(node.props?.fieldName || "")}
              placeholder="예: category, status"
              onChange={(val) => updateProps({ fieldName: val })}
            />
            <TextField
              label="선택 옵션 (쉼표로 구분)"
              value={String(node.props?.options || "옵션 1, 옵션 2, 옵션 3")}
              placeholder="예: 의류, 전자기기, 식품"
              onChange={(val) => updateProps({ options: val })}
            />
          </div>
        )}

        {node.type === "Checkbox" && (
          <div className="space-y-2">
            <TextField
              label="체크박스 라벨"
              value={String(node.props?.label || "")}
              onChange={(val) => updateProps({ label: val })}
            />
            <TextField
              label="필드 이름 (Form State Key)"
              value={String(node.props?.fieldName || "")}
              placeholder="예: isAgreed, isActive"
              onChange={(val) => updateProps({ fieldName: val })}
            />
          </div>
        )}

        {node.type === "Image" && (
          <div className="space-y-2">
            <TextField
              label="이미지 URL"
              value={String(node.props?.src || "")}
              placeholder="https://..."
              onChange={(val) => updateProps({ src: val })}
            />
            <TextField
              label="대체 텍스트 (Alt)"
              value={String(node.props?.alt || "")}
              onChange={(val) => updateProps({ alt: val })}
            />
          </div>
        )}

        {node.type === "Badge" && (
          <div className="space-y-2">
            <TextField
              label="뱃지 문구"
              value={String(node.props?.text || "")}
              onChange={(val) => updateProps({ text: val })}
            />
            <SelectField
              label="상태 색상"
              value={String(node.props?.variant || "neutral")}
              disabled={false}
              onChange={(val) => updateProps({ variant: val })}
            >
              <option value="neutral">기본 (회색)</option>
              <option value="success">완료/성공 (녹색)</option>
              <option value="warning">진행중/주의 (주황)</option>
              <option value="danger">오류/취소 (적색)</option>
            </SelectField>
          </div>
        )}

        {(node.type === "DataList" || node.type === "Table") && (
          <div className="space-y-3">
            <SelectField
              label="대상 PostgreSQL 테이블"
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
            <NumberField
              label="최대 표시 건수 (Limit)"
              value={Number(node.props?.limit || 20)}
              onChange={(limit) => updateProps({ limit })}
            />
          </div>
        )}
      </section>

      {/* Layout & Alignment */}
      <section className="space-y-3 border-t border-[var(--border-subtle)] pt-4">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
          <Layout className="w-3.5 h-3.5 text-amber-400" />
          <span>레이아웃 (Layout & Flex)</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <SelectField
            label="Flex 방향"
            value={String(node.style?.flexDirection || "column")}
            disabled={false}
            onChange={(val) => updateStyle({ flexDirection: val })}
          >
            <option value="column">세로 (Column)</option>
            <option value="row">가로 (Row)</option>
          </SelectField>

          <SelectField
            label="정렬 (Align Items)"
            value={String(node.style?.alignItems || "stretch")}
            disabled={false}
            onChange={(val) => updateStyle({ alignItems: val })}
          >
            <option value="stretch">늘림 (Stretch)</option>
            <option value="flex-start">시작 (Start)</option>
            <option value="center">중앙 (Center)</option>
            <option value="flex-end">끝 (End)</option>
          </SelectField>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <SelectField
            label="배치 (Justify Content)"
            value={String(node.style?.justifyContent || "flex-start")}
            disabled={false}
            onChange={(val) => updateStyle({ justifyContent: val })}
          >
            <option value="flex-start">시작 (Start)</option>
            <option value="center">중앙 (Center)</option>
            <option value="flex-end">끝 (End)</option>
            <option value="space-between">양끝 분산</option>
          </SelectField>

          <NumberField
            label="요소 간격 (Gap)"
            value={Number(node.style?.gap || 0)}
            onChange={(gap) => updateStyle({ gap })}
          />
        </div>
      </section>

      {/* Typography */}
      {isTextType && (
        <section className="space-y-3 border-t border-[var(--border-subtle)] pt-4">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
            <TypeIcon className="w-3.5 h-3.5 text-amber-400" />
            <span>타이포그래피 (Typography)</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <NumberField
              label="폰트 크기"
              value={Number(node.style?.fontSize || 14)}
              onChange={(fontSize) => updateStyle({ fontSize })}
            />
            <SelectField
              label="굵기 (Weight)"
              value={String(node.style?.fontWeight || "normal")}
              disabled={false}
              onChange={(fontWeight) => updateStyle({ fontWeight })}
            >
              <option value="normal">Normal</option>
              <option value="500">Medium</option>
              <option value="600">Semibold</option>
              <option value="bold">Bold</option>
            </SelectField>
          </div>
          <ColorField
            label="글자색 (Text Color)"
            value={String(node.style?.color || "")}
            fallback="#000000"
            onChange={(color) => updateStyle({ color })}
          />
        </section>
      )}

      {/* Dimensions & Spacing */}
      <section className="space-y-3 border-t border-[var(--border-subtle)] pt-4">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
          <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
          <span>여백 및 크기 (Spacing & Sizing)</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <NumberField
            label="패딩 (Padding)"
            value={Number(node.style?.padding || 0)}
            onChange={(padding) => updateStyle({ padding })}
          />
          <NumberField
            label="마진 (Margin)"
            value={Number(node.style?.margin || 0)}
            onChange={(margin) => updateStyle({ margin })}
          />
        </div>
      </section>

      {/* Colors & Borders */}
      <section className="space-y-3 border-t border-[var(--border-subtle)] pt-4">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
          <Palette className="w-3.5 h-3.5 text-amber-400" />
          <span>배경 및 테두리 (Appearance)</span>
        </div>
        <ColorField
          label="배경색 (Background Color)"
          value={String(node.style?.backgroundColor || "")}
          fallback="#ffffff"
          onChange={(backgroundColor) => updateStyle({ backgroundColor })}
        />
        <div className="grid grid-cols-2 gap-2">
          <NumberField
            label="곡률 (Radius)"
            value={Number(node.style?.borderRadius || 0)}
            onChange={(borderRadius) => updateStyle({ borderRadius })}
          />
          <NumberField
            label="테두리 두께 (Border Width)"
            value={Number(node.style?.borderWidth || 0)}
            onChange={(borderWidth) => updateStyle({ borderWidth })}
          />
        </div>
        {Number(node.style?.borderWidth) > 0 && (
          <ColorField
            label="테두리 색상 (Border Color)"
            value={String(node.style?.borderColor || "")}
            fallback="#e2e8f0"
            onChange={(borderColor) => updateStyle({ borderColor })}
          />
        )}
      </section>
    </div>
  );
}

function TextField({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1">
      <label className="field-label">{label}</label>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={controlClassName}
      />
    </div>
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
          className="h-7 w-7 cursor-pointer rounded border border-[var(--border-strong)] bg-transparent"
        />
        <input
          type="text"
          value={value}
          placeholder={fallback}
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
