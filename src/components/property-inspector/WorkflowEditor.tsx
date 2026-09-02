import { Plus, X, ArrowDown, Sparkles } from "lucide-react";
import type { WorkflowAction, WorkflowActionType } from "./types";
import type { TableMeta } from "../../api/schema";
import { usePageStore } from "../../store/usePageStore";
import { useQueryStore } from "../../store/useQueryStore";

interface WorkflowEditorProps {
  actions: WorkflowAction[];
  tables?: TableMeta[];
  onSave: (actions: WorkflowAction[]) => void;
}

const inputClassName = "control py-1 font-mono text-xs";

export function WorkflowEditor({
  actions,
  tables = [],
  onSave,
}: WorkflowEditorProps) {
  const addAction = (type: WorkflowActionType) =>
    onSave([...actions, createAction(type, tables[0]?.table_name || "products")]);

  const updateParam = (index: number, key: string, value: unknown) =>
    onSave(
      actions.map((action, actionIndex) =>
        actionIndex === index
          ? { ...action, params: { ...action.params, [key]: value } }
          : action,
      ),
    );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
        <div>
          <span className="eyebrow">On-Click Workflow</span>
          <p className="text-muted text-[11px]">
            버튼이나 요소 클릭 시 실행할 동작 순서
          </p>
        </div>
      </div>

      {/* Quick Add Action Palette */}
      <div className="grid grid-cols-2 gap-1.5">
        <AddButton
          label="+ DB 생성"
          type="DB_INSERT"
          onClick={() => addAction("DB_INSERT")}
        />
        <AddButton
          label="+ DB 수정"
          type="DB_UPDATE"
          onClick={() => addAction("DB_UPDATE")}
        />
        <AddButton
          label="+ DB 삭제"
          type="DB_DELETE"
          onClick={() => addAction("DB_DELETE")}
        />
        <AddButton
          label="+ 토스트 알림"
          type="SHOW_TOAST"
          onClick={() => addAction("SHOW_TOAST")}
        />
        <AddButton
          label="+ 페이지 이동"
          type="NAVIGATE"
          onClick={() => addAction("NAVIGATE")}
        />
        <AddButton
          label="+ 모달 열기"
          type="OPEN_MODAL"
          onClick={() => addAction("OPEN_MODAL")}
        />
        <AddButton
          label="+ 모달 닫기"
          type="CLOSE_MODAL"
          onClick={() => addAction("CLOSE_MODAL")}
        />
        <AddButton
          label="+ Page State 변경"
          type="SET_PAGE_STATE"
          onClick={() => addAction("SET_PAGE_STATE")}
        />
        <AddButton
          label="+ App State 변경"
          type="SET_APP_STATE"
          onClick={() => addAction("SET_APP_STATE")}
        />
        <AddButton
          label="+ 폼 초기화"
          type="RESET_FORM"
          onClick={() => addAction("RESET_FORM")}
        />
        <AddButton
          label="+ 클립보드 복사"
          type="COPY_CLIPBOARD"
          onClick={() => addAction("COPY_CLIPBOARD")}
        />
        <AddButton
          label="+ API 호출"
          type="API_CALL"
          onClick={() => addAction("API_CALL")}
        />
        <AddButton
          label="+ Query 실행"
          type="RUN_QUERY"
          onClick={() => addAction("RUN_QUERY")}
        />
      </div>

      {actions.length === 0 ? (
        <div className="text-muted rounded-lg border border-dashed border-[var(--border-strong)] py-8 text-center text-xs">
          클릭 시 실행할 워크플로우 액션을 추가하세요
        </div>
      ) : (
        <div className="space-y-3">
          {actions.map((action, index) => (
            <ActionCard
              key={action.id}
              action={action}
              index={index}
              tables={tables}
              hasNext={index < actions.length - 1}
              onUpdate={(key, value) => updateParam(index, key, value)}
              onRemove={() =>
                onSave(
                  actions.filter((_, actionIndex) => actionIndex !== index),
                )
              }
            />
          ))}
        </div>
      )}

      {/* Helper Variable Expressions */}
      <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-sunken)] p-3 text-[11px] space-y-2">
        <div className="flex items-center gap-1 text-slate-400 font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>사용 가능한 동적 바인딩 변수</span>
        </div>
        <div className="flex flex-wrap gap-1 font-mono text-[10px]">
          <span className="badge px-1.5 py-0.5">{"{{ form.<field> }}"}</span>
          <span className="badge px-1.5 py-0.5">{"{{ params.<param> }}"}</span>
          <span className="badge px-1.5 py-0.5">{"{{ steps.<id>.id }}"}</span>
        </div>
      </div>
    </div>
  );
}

function createAction(
  type: WorkflowActionType,
  defaultTable: string,
): WorkflowAction {
  const id = `act_${Date.now()}`;
  let params: Record<string, unknown> = {};

  switch (type) {
    case "DB_INSERT":
      params = {
        tableName: defaultTable,
        data: { title: "{{ form.title }}" },
      };
      break;
    case "DB_UPDATE":
      params = {
        tableName: defaultTable,
        recordId: "{{ form.id }}",
        data: { title: "{{ form.title }}" },
      };
      break;
    case "DB_DELETE":
      params = {
        tableName: defaultTable,
        recordId: "{{ form.id }}",
      };
      break;
    case "SHOW_TOAST":
    case "SHOW_ALERT":
      params = { message: "작업이 성공적으로 완료되었습니다!" };
      break;
    case "NAVIGATE":
      params = { targetPage: "/" };
      break;
    case "API_CALL":
      params = {
        url: "https://api.example.com/data",
        method: "POST",
        data: { name: "{{ form.name }}" },
      };
      break;
    case "RUN_QUERY":
      params = { queryId: "" };
      break;
    case "SET_FIELD":
      params = { field: "status", value: "active" };
      break;
  }

  return { id, type, params };
}

function AddButton({
  label,
  onClick,
}: {
  label: string;
  type: WorkflowActionType;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="btn btn-secondary px-2 py-1.5 text-[11px] justify-start hover:border-amber-500 hover:text-amber-300"
    >
      <Plus className="w-3 h-3 text-amber-400 shrink-0" />
      <span className="truncate">{label}</span>
    </button>
  );
}

function ActionCard({
  action,
  index,
  tables,
  hasNext,
  onUpdate,
  onRemove,
}: {
  action: WorkflowAction;
  index: number;
  tables: TableMeta[];
  hasNext: boolean;
  onUpdate: (key: string, value: unknown) => void;
  onRemove: () => void;
}) {
  return (
    <div className="surface relative space-y-2 p-3.5 border border-[var(--border-strong)]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="badge px-1.5 py-0.5 text-[10px] font-bold">
            Step {index + 1}
          </span>
          <span className="text-xs font-semibold text-slate-200">
            {action.type}
          </span>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="text-muted transition hover:text-rose-400 p-1"
          title="삭제"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <ActionFields action={action} tables={tables} onUpdate={onUpdate} />

      {hasNext && (
        <div className="flex justify-center pt-1 text-slate-500">
          <ArrowDown className="w-3.5 h-3.5 animate-bounce" />
        </div>
      )}
    </div>
  );
}

function ActionFields({
  action,
  tables,
  onUpdate,
}: {
  action: WorkflowAction;
  tables: TableMeta[];
  onUpdate: (key: string, value: unknown) => void;
}) {
  const pages = usePageStore((state) => state.pages);
  const queries = useQueryStore((state) => state.queries);

  if (action.type === "SHOW_TOAST" || action.type === "SHOW_ALERT") {
    return (
      <div className="space-y-2">
        <Field label="표시할 알림 메시지">
          <input
            type="text"
            value={String(action.params.message ?? "")}
            onChange={(event) => onUpdate("message", event.target.value)}
            className={inputClassName}
            placeholder="예: 등록 완료! (ID: {{ steps.act_1.id }})"
          />
        </Field>
        {action.type === "SHOW_TOAST" && (
          <Field label="토스트 유형">
            <select
              value={String(action.params.toastType ?? "success")}
              onChange={(e) => onUpdate("toastType", e.target.value)}
              className="control text-xs"
            >
              <option value="success">성공 (Success - 초록)</option>
              <option value="info">정보 (Info - 파랑)</option>
              <option value="warning">주의 (Warning - 주황)</option>
              <option value="error">오류 (Error - 빨강)</option>
            </select>
          </Field>
        )}
      </div>
    );
  }

  if (action.type === "OPEN_MODAL") {
    return (
      <Field label="열 모달 ID">
        <input
          type="text"
          value={String(action.params.modalId ?? "modal_default")}
          onChange={(e) => onUpdate("modalId", e.target.value)}
          className={inputClassName}
          placeholder="modal_default"
        />
      </Field>
    );
  }

  if (action.type === "CLOSE_MODAL") {
    return (
      <div className="text-[11px] text-slate-400 py-1">
        현재 열려 있는 모달 팝업을 닫습니다.
      </div>
    );
  }

  if (action.type === "RESET_FORM") {
    return (
      <div className="text-[11px] text-slate-400 py-1">
        현재 페이지의 모든 폼 입력 상태를 초기화합니다.
      </div>
    );
  }

  if (action.type === "COPY_CLIPBOARD") {
    return (
      <Field label="클립보드에 복사할 텍스트 (변수 바인딩 가능)">
        <input
          type="text"
          value={String(action.params.textToCopy ?? "")}
          onChange={(e) => onUpdate("textToCopy", e.target.value)}
          className={inputClassName}
          placeholder="예: {{ form.code }} 또는 {{ steps.act_1.id }}"
        />
      </Field>
    );
  }

  if (action.type === "SET_PAGE_STATE" || action.type === "SET_APP_STATE") {
    return (
      <div className="space-y-2">
        <Field label={`${action.type === "SET_APP_STATE" ? "App" : "Page"} State 변수명`}>
          <input
            type="text"
            value={String(action.params.field ?? "")}
            onChange={(e) => onUpdate("field", e.target.value)}
            className={inputClassName}
            placeholder="searchTerm 또는 selectedTab"
          />
        </Field>
        <Field label="설정할 값 (문자열 또는 {{ form.val }})">
          <input
            type="text"
            value={String(action.params.value ?? "")}
            onChange={(e) => onUpdate("value", e.target.value)}
            className={inputClassName}
            placeholder="active 또는 {{ form.name }}"
          />
        </Field>
      </div>
    );
  }

  if (action.type === "NAVIGATE") {
    return (
      <Field label="이동할 대상 페이지">
        <select
          value={String(action.params.targetPage ?? "")}
          onChange={(e) => onUpdate("targetPage", e.target.value)}
          className="control text-xs"
        >
          {pages.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.path})
            </option>
          ))}
        </select>
      </Field>
    );
  }

  if (action.type === "RUN_QUERY") {
    return (
      <Field label="실행할 API Query">
        <select
          value={String(action.params.queryId ?? "")}
          onChange={(e) => onUpdate("queryId", e.target.value)}
          className="control text-xs"
        >
          <option value="">-- Query 선택 --</option>
          {queries.map((q) => (
            <option key={q.id} value={q.id}>
              {q.name} ({q.method})
            </option>
          ))}
        </select>
      </Field>
    );
  }

  if (action.type === "SET_FIELD") {
    return (
      <>
        <Field label="Form Field Name">
          <input
            type="text"
            value={String(action.params.field ?? "")}
            onChange={(e) => onUpdate("field", e.target.value)}
            className={inputClassName}
            placeholder="status"
          />
        </Field>
        <Field label="Value (설정할 값)">
          <input
            type="text"
            value={String(action.params.value ?? "")}
            onChange={(e) => onUpdate("value", e.target.value)}
            className={inputClassName}
            placeholder="completed"
          />
        </Field>
      </>
    );
  }

  if (action.type === "API_CALL") {
    return (
      <>
        <div className="grid grid-cols-[80px_1fr] gap-2">
          <Field label="Method">
            <select
              value={String(action.params.method ?? "POST")}
              onChange={(e) => onUpdate("method", e.target.value)}
              className="control text-xs"
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
            </select>
          </Field>
          <Field label="URL">
            <input
              type="text"
              value={String(action.params.url ?? "")}
              onChange={(e) => onUpdate("url", e.target.value)}
              className={inputClassName}
              placeholder="https://..."
            />
          </Field>
        </div>
        <DataParam action={action} onUpdate={onUpdate} />
      </>
    );
  }

  if (action.type === "DB_INSERT") {
    return (
      <>
        <TableSelectField
          tables={tables}
          value={String(action.params.tableName ?? "")}
          onChange={(val) => onUpdate("tableName", val)}
        />
        <DataParam action={action} onUpdate={onUpdate} />
      </>
    );
  }

  if (action.type === "DB_UPDATE") {
    return (
      <>
        <TableSelectField
          tables={tables}
          value={String(action.params.tableName ?? "")}
          onChange={(val) => onUpdate("tableName", val)}
        />
        <Field label="수정할 레코드 ID">
          <input
            type="text"
            value={String(action.params.recordId ?? "")}
            onChange={(event) => onUpdate("recordId", event.target.value)}
            className={inputClassName}
            placeholder="{{ form.id }}"
          />
        </Field>
        <DataParam action={action} onUpdate={onUpdate} />
      </>
    );
  }

  if (action.type === "DB_DELETE") {
    return (
      <>
        <TableSelectField
          tables={tables}
          value={String(action.params.tableName ?? "")}
          onChange={(val) => onUpdate("tableName", val)}
        />
        <Field label="삭제할 레코드 ID">
          <input
            type="text"
            value={String(action.params.recordId ?? "")}
            onChange={(event) => onUpdate("recordId", event.target.value)}
            className={inputClassName}
            placeholder="{{ form.id }}"
          />
        </Field>
      </>
    );
  }

  return null;
}

function TableSelectField({
  tables,
  value,
  onChange,
}: {
  tables: TableMeta[];
  value: string;
  onChange: (val: string) => void;
}) {
  return (
    <Field label="Target PostgreSQL Table">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="control text-xs"
      >
        <option value="">-- 테이블 선택 --</option>
        {tables.map((t) => (
          <option key={t.table_name} value={t.table_name}>
            {t.table_name}
          </option>
        ))}
      </select>
    </Field>
  );
}

function Field({
  label,
  children,
}: React.PropsWithChildren<{ label: string }>) {
  return (
    <div className="pt-1">
      <label className="field-label mb-1 block text-[10px]">{label}</label>
      {children}
    </div>
  );
}

function DataParam({
  action,
  onUpdate,
}: {
  action: WorkflowAction;
  onUpdate: (key: string, value: unknown) => void;
}) {
  const value =
    action.params.data !== null && typeof action.params.data === "object"
      ? JSON.stringify(action.params.data, null, 2)
      : String(action.params.data ?? "");

  return (
    <Field label="Payload Data (JSON / Dynamic Binding)">
      <textarea
        rows={3}
        value={value}
        onChange={(event) => {
          try {
            onUpdate("data", JSON.parse(event.target.value));
          } catch {
            onUpdate("data", event.target.value);
          }
        }}
        className={`${inputClassName} resize-none`}
        placeholder='{ "title": "{{ form.title }}" }'
      />
    </Field>
  );
}
