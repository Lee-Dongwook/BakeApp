import React, { useEffect, useState } from "react";
import { useAuthStore } from "../store/useAuthStore";

interface ColumnInput {
  name: string;
  type: "string" | "text" | "number" | "boolean" | "datetime";
  isRequired: boolean;
}

type UserRole = "GUEST" | "MEMBER" | "ADMIN";

interface ErrorResponse {
  message?: string | string[];
}

interface ProjectTable {
  name: string;
  columns: Array<{
    name: string;
    dataType: string;
    isRequired: boolean;
  }>;
}

interface DbSchemaBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId?: string;
}

export const DbSchemaBuilderModal: React.FC<DbSchemaBuilderModalProps> = ({
  isOpen,
  onClose,
  projectId = "p1234567",
}) => {
  const [tableName, setTableName] = useState("");
  const [columns, setColumns] = useState<ColumnInput[]>([
    {
      name: "title",
      type: "string",
      isRequired: true,
    },
  ]);

  const [readRoles, setReadRoles] = useState<UserRole[]>(["MEMBER", "ADMIN"]);
  const [writeRoles, setWriteRoles] = useState<UserRole[]>(["ADMIN"]);
  const [isLoading, setIsLoading] = useState(false);
  const [tables, setTables] = useState<ProjectTable[]>([]);
  const [isTablesLoading, setIsTablesLoading] = useState(false);
  const [tablesError, setTablesError] = useState<string | null>(null);

  const loadTables = async () => {
    const accessToken = useAuthStore.getState().accessToken;
    if (!accessToken) return;

    setIsTablesLoading(true);
    setTablesError(null);
    try {
      const apiBaseUrl =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
      const response = await fetch(
        `${apiBaseUrl}/api/dynamic-schema/tables/${projectId}`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      const data = (await response.json()) as ProjectTable[] | ErrorResponse;
      if (!response.ok) {
        const errorMessage = (data as ErrorResponse).message;
        const message = Array.isArray(errorMessage)
          ? errorMessage.join(", ")
          : errorMessage;
        throw new Error(message || "테이블 목록을 불러오지 못했습니다.");
      }
      setTables(data as ProjectTable[]);
    } catch (error) {
      setTablesError(
        error instanceof Error ? error.message : "테이블 목록을 불러오지 못했습니다.",
      );
    } finally {
      setIsTablesLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) void loadTables();
  }, [isOpen, projectId]);

  if (!isOpen) return null;

  const handleAddColumn = () => {
    setColumns([
      ...columns,
      { name: "", type: "string", isRequired: false },
    ]);
  };

  const handleRemoveColumn = (index: number) => {
    setColumns(columns.filter((_, i) => i !== index));
  };

  const handleColumnChange = (
    index: number,
    field: keyof ColumnInput,
    value: ColumnInput[typeof field],
  ) => {
    const newCols = [...columns];
    newCols[index] = { ...newCols[index], [field]: value };
    setColumns(newCols);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableName.trim()) {
      alert("테이블 이름을 입력해주세요.");
      return;
    }

    setIsLoading(true);

    try {
      const accessToken = useAuthStore.getState().accessToken;
      if (!accessToken) {
        throw new Error("로그인이 필요합니다.");
      }
      const apiBaseUrl =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
      const response = await fetch(
        `${apiBaseUrl}/api/dynamic-schema/table`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            projectId,
            tableName,
            columns,
            rbacPolicy: {
              readRoles,
              writeRoles,
              deleteRoles: ["ADMIN"],
            },
          }),
        },
      );

      const data = (await response.json()) as ErrorResponse;

      if (response.ok) {
        alert(
          `테이블 [${tableName}]이 생성되고 Swagger 스펙과 RLS 권한이 등록되었습니다.`,
        );
        setTableName("");
        setColumns([{ name: "title", type: "string", isRequired: true }]);
        setReadRoles(["MEMBER", "ADMIN"]);
        setWriteRoles(["ADMIN"]);
        onClose();
      } else {
        const message = Array.isArray(data.message)
          ? data.message.join(", ")
          : data.message;
        alert(`생성 실패: ${message || "오류가 발생했습니다."}`);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "알 수 없는 오류";
      alert(`서버 통신 에러: ${message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="db-schema-modal-title"
        className="flex max-h-[85vh] w-full max-w-[600px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-xl">🗄️</span>
            <h3 id="db-schema-modal-title" className="font-bold text-lg">
              Dynamic DB Schema Builder
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="DB 스키마 모달 닫기"
            className="text-slate-400 hover:text-white transition-colors text-lg font-bold"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <form
          onSubmit={handleSubmit}
          className="p-6 overflow-y-auto space-y-6 flex-1"
        >
          {/* Table Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              테이블 명 (Table Name)
            </label>
            <input
              type="text"
              placeholder="예: products, orders, articles"
              value={tableName}
              onChange={(e) => setTableName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none text-sm"
              required
            />
          </div>

          {/* Column List */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                컬럼 정의 (Columns)
              </label>
              <button
                type="button"
                onClick={handleAddColumn}
                className="text-xs bg-amber-50 text-amber-700 hover:bg-amber-100 font-semibold px-2.5 py-1 rounded border border-amber-300 transition-colors"
              >
                + 컬럼 추가
              </button>
            </div>

            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {/* Default Primary Key Notice */}
              <div className="flex items-center gap-2 p-2.5 bg-slate-100 rounded-lg border border-slate-200 text-xs text-slate-600">
                <span className="font-bold text-slate-800 w-24">
                  id (기본키)
                </span>
                <span className="bg-slate-200 px-2 py-0.5 rounded font-mono">
                  UUID
                </span>
                <span className="text-slate-400 text-[11px] ml-auto">
                  자동 생성됨
                </span>
              </div>

              {columns.map((col, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200"
                >
                  <input
                    type="text"
                    placeholder="컬럼명"
                    value={col.name}
                    onChange={(e) =>
                      handleColumnChange(idx, "name", e.target.value)
                    }
                    className="flex-1 px-2.5 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                    required
                  />
                  <select
                    value={col.type}
                    onChange={(e) =>
                      handleColumnChange(
                        idx,
                        "type",
                        e.target.value as ColumnInput["type"],
                      )
                    }
                    className="w-32 px-2 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none bg-white"
                  >
                    <option value="string">VARCHAR(255)</option>
                    <option value="text">TEXT</option>
                    <option value="number">NUMERIC</option>
                    <option value="boolean">BOOLEAN</option>
                    <option value="datetime">TIMESTAMPTZ</option>
                  </select>
                  <label className="flex items-center gap-1 text-xs text-slate-600 select-none cursor-pointer">
                    <input
                      type="checkbox"
                      checked={col.isRequired}
                      onChange={(e) =>
                        handleColumnChange(idx, "isRequired", e.target.checked)
                      }
                      className="rounded text-amber-500 focus:ring-amber-500"
                    />
                    필수
                  </label>
                  <button
                    type="button"
                    onClick={() => handleRemoveColumn(idx)}
                    aria-label={`${col.name || idx + 1} 컬럼 삭제`}
                    className="text-red-500 hover:text-red-700 text-sm font-bold px-1.5"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* RLS Role Settings */}
          <div className="border-t border-slate-200 pt-4">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              🔒 Row-Level Security (RBAC 권한)
            </label>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="block text-slate-600 font-semibold mb-1">
                  조회 (Read) 허용 Role:
                </span>
                <div className="flex gap-2">
                  {(["GUEST", "MEMBER", "ADMIN"] as UserRole[]).map((role) => (
                    <label
                      key={role}
                      className="flex items-center gap-1 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={readRoles.includes(role)}
                        onChange={(e) => {
                          if (e.target.checked)
                            setReadRoles([...readRoles, role]);
                          else
                            setReadRoles(readRoles.filter((r) => r !== role));
                        }}
                      />
                      {role}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <span className="block text-slate-600 font-semibold mb-1">
                  생성/수정 (Write) 허용 Role:
                </span>
                <div className="flex gap-2">
                  {(["MEMBER", "ADMIN"] as UserRole[]).map((role) => (
                    <label
                      key={role}
                      className="flex items-center gap-1 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={writeRoles.includes(role)}
                        onChange={(e) => {
                          if (e.target.checked)
                            setWriteRoles([...writeRoles, role]);
                          else
                            setWriteRoles(writeRoles.filter((r) => r !== role));
                        }}
                      />
                      {role}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 text-xs font-bold hover:bg-slate-100 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold text-xs rounded-lg shadow-sm transition-all disabled:opacity-50"
            >
              {isLoading ? "생성 중..." : "테이블 및 스펙 생성"}
            </button>
          </div>
        </form>

        <section className="border-t border-slate-200 bg-slate-50 px-6 py-4">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-800">현재 테이블</h4>
            <button
              type="button"
              onClick={() => void loadTables()}
              disabled={isTablesLoading}
              className="text-xs font-semibold text-amber-700 hover:text-amber-800 disabled:opacity-60"
            >
              {isTablesLoading ? "불러오는 중…" : "새로고침"}
            </button>
          </div>
          {tablesError ? (
            <p className="text-xs text-rose-600">{tablesError}</p>
          ) : tables.length === 0 ? (
            <p className="text-xs text-slate-500">아직 생성된 테이블이 없습니다.</p>
          ) : (
            <ul className="max-h-32 space-y-2 overflow-y-auto">
              {tables.map((table) => (
                <li key={table.name} className="rounded border border-slate-200 bg-white px-3 py-2">
                  <p className="text-xs font-bold text-slate-800">{table.name}</p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    {table.columns.length === 0
                      ? "사용자 정의 컬럼 없음"
                      : table.columns
                          .map(
                            (column) =>
                              `${column.name}: ${column.dataType}${column.isRequired ? " (필수)" : ""}`,
                          )
                          .join(", ")}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
};
