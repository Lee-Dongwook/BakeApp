import { Plus, X } from "lucide-react";
import type { WorkflowAction, WorkflowActionType } from "./types";

interface WorkflowEditorProps {
  actions: WorkflowAction[];
  onSave: (actions: WorkflowAction[]) => void;
}

const inputClassName = "control py-1 font-mono text-xs";

export function WorkflowEditor({ actions, onSave }: WorkflowEditorProps) {
  const addAction = (type: WorkflowActionType) =>
    onSave([...actions, createAction(type)]);
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
      <div className="flex items-center justify-between">
        <span className="eyebrow">On-Click Actions</span>
        <div className="flex gap-1">
          <AddButton
            label="DB 생성"
            emphasized
            onClick={() => addAction("DB_INSERT")}
          />
          <AddButton label="알림" onClick={() => addAction("SHOW_ALERT")} />
        </div>
      </div>
      {actions.length === 0 ? (
        <div className="text-muted rounded-lg border border-dashed py-8 text-center text-xs">
          클릭 시 실행할 워크플로우 액션을 추가하세요
        </div>
      ) : (
        <div className="space-y-3">
          {actions.map((action, index) => (
            <ActionCard
              key={action.id}
              action={action}
              index={index}
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
    </div>
  );
}

function createAction(type: WorkflowActionType): WorkflowAction {
  const params =
    type === "DB_INSERT"
      ? { tableName: "users", data: { username: "{{ form.name }}" } }
      : type === "DB_UPDATE"
        ? {
            tableName: "users",
            recordId: "{{ form.id }}",
            data: { username: "{{ form.name }} " },
          }
        : type === "DB_DELETE"
          ? { tableName: "users", recordId: "{{ form.id }}" }
          : { message: "성공적으로 처리되었습니다!" };
  return { id: `act_${Date.now()}`, type, params };
}

function AddButton({
  label,
  emphasized = false,
  onClick,
}: {
  label: string;
  emphasized?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        emphasized
          ? "btn border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[11px] text-amber-400 hover:bg-amber-500/20"
          : "btn btn-secondary px-2 py-1 text-[11px]"
      }
    >
      <Plus className="w-3 h-3" /> {label}
    </button>
  );
}

function ActionCard({
  action,
  index,
  hasNext,
  onUpdate,
  onRemove,
}: {
  action: WorkflowAction;
  index: number;
  hasNext: boolean;
  onUpdate: (key: string, value: unknown) => void;
  onRemove: () => void;
}) {
  return (
    <div className="surface relative space-y-2 p-3">
      <div className="flex items-center justify-between">
        <span className="badge px-2 py-0.5 text-[10px] font-semibold">
          Step {index + 1}: {action.type}
        </span>
        <button
          type="button"
          onClick={onRemove}
          className="text-muted transition hover:text-red-400"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <ActionFields action={action} onUpdate={onUpdate} />
      {hasNext && (
        <div className="text-muted pt-1 text-center text-xs font-bold">↓</div>
      )}
    </div>
  );
}

function ActionFields({
  action,
  onUpdate,
}: {
  action: WorkflowAction;
  onUpdate: (key: string, value: unknown) => void;
}) {
  if (action.type === "SHOW_ALERT")
    return (
      <Field label="Alert Message">
        <input
          type="text"
          value={String(action.params.message ?? "")}
          onChange={(event) => onUpdate("message", event.target.value)}
          className={inputClassName}
          placeholder="예: {{ steps.act_1.id }} 완료!"
        />
      </Field>
    );
  if (action.type === "DB_INSERT")
    return (
      <>
        <TextParam
          label="Target Table"
          param="tableName"
          action={action}
          onUpdate={onUpdate}
        />
        <DataParam action={action} onUpdate={onUpdate} />
      </>
    );
  if (action.type === "DB_UPDATE")
    return (
      <>
        <TextParam
          label="Target Table"
          param="tableName"
          action={action}
          onUpdate={onUpdate}
        />
        <TextParam
          label="Record ID"
          param="recordId"
          action={action}
          onUpdate={onUpdate}
        />
        <DataParam action={action} onUpdate={onUpdate} />
      </>
    );
  if (action.type === "DB_DELETE")
    return (
      <>
        <TextParam
          label="Target Table"
          param="tableName"
          action={action}
          onUpdate={onUpdate}
        />
        <TextParam
          label="Record ID"
          param="recordId"
          action={action}
          onUpdate={onUpdate}
        />
      </>
    );
  return null;
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
function TextParam({
  label,
  param,
  action,
  onUpdate,
}: {
  label: string;
  param: string;
  action: WorkflowAction;
  onUpdate: (key: string, value: unknown) => void;
}) {
  return (
    <Field label={label}>
      <input
        type="text"
        value={String(action.params[param] ?? "")}
        onChange={(event) => onUpdate(param, event.target.value)}
        className={inputClassName}
      />
    </Field>
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
      ? JSON.stringify(action.params.data)
      : String(action.params.data ?? "");
  return (
    <Field label="Data (JSON / Dynamic Binding)">
      <textarea
        rows={2}
        value={value}
        onChange={(event) => {
          try {
            onUpdate("data", JSON.parse(event.target.value));
          } catch {
            onUpdate("data", event.target.value);
          }
        }}
        className={`${inputClassName} resize-none`}
      />
    </Field>
  );
}
