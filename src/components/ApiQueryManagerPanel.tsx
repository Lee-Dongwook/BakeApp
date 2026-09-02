import React, { useEffect, useState } from "react";
import { useQueryStore, ApiQuery } from "../store/useQueryStore";
import { Database, Plus, Play, Trash2, Code } from "lucide-react";

export const ApiQueryManagerPanel: React.FC = () => {
  const { queries, queryResults, addQuery, deleteQuery, runQuery } =
    useQueryStore();
  const [selectedQueryId, setSelectedQueryId] = useState<string | null>(
    queries[0]?.id || null,
  );

  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [method, setMethod] = useState<"GET" | "POST" | "PUT" | "DELETE">(
    "GET",
  );
  const [body, setBody] = useState("");

  useEffect(() => {
    if (
      selectedQueryId &&
      queries.some((query) => query.id === selectedQueryId)
    ) {
      return;
    }

    setSelectedQueryId(queries[0]?.id ?? null);
  }, [queries, selectedQueryId]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !url.trim()) return;

    const newQuery: ApiQuery = {
      id: `query-${Date.now()}`,
      name: name.trim(),
      url: url.trim(),
      method,
      body: method !== "GET" ? body : undefined,
    };

    addQuery(newQuery);
    setSelectedQueryId(newQuery.id);
    setName("");
    setUrl("");
  };

  const activeQuery = queries.find((q) => q.id === selectedQueryId);
  const activeResult = activeQuery ? queryResults[activeQuery.name] : null;

  return (
    <div className="app-sidebar flex h-full w-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-2">
          <Database className="brand h-4 w-4" />
          <h3 className="font-bold text-sm">API Query Manager</h3>
        </div>
      </div>

      {/* Query Generator Form */}
      <form
        onSubmit={handleCreate}
        className="space-y-2 border-b bg-[var(--surface-inset)] p-3"
      >
        <div className="flex gap-2">
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value as ApiQuery["method"])}
            className="control w-auto py-1 text-xs font-bold text-amber-400"
          >
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="DELETE">DELETE</option>
          </select>
          <input
            type="text"
            placeholder="Query Name (예: getUsers)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="control flex-1 py-1 text-xs"
          />
        </div>
        <input
          type="text"
          placeholder="URL (예: https://api.com/users?email={{ form.email }})"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="control py-1 font-mono text-xs"
        />
        {method !== "GET" && (
          <textarea
            placeholder='JSON Body (예: {"name": "{{ form.name }}"})'
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={2}
            className="control py-1 font-mono text-xs"
          />
        )}
        <button type="submit" className="btn btn-primary w-full py-1 text-xs">
          <Plus className="w-3.5 h-3.5" /> Query 생성
        </button>
      </form>

      {/* Query List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {queries.map((q) => (
          <div
            key={q.id}
            onClick={() => setSelectedQueryId(q.id)}
            className={`list-item flex cursor-pointer items-center justify-between px-3 py-2 text-xs ${
              q.id === selectedQueryId ? "is-active" : ""
            }`}
          >
            <div className="truncate flex items-center gap-2">
              <span className="badge px-1.5 py-0.5 text-[10px] font-bold">
                {q.method}
              </span>
              <span className="font-mono font-medium">{q.name}</span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  void runQuery(q.id).catch(() => undefined);
                }}
                className="icon-btn text-emerald-400"
                title="테스트 실행"
              >
                <Play className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteQuery(q.id);
                }}
                className="icon-btn text-red-400"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Live Result Preview */}
      {activeResult && (
        <div className="flex h-40 flex-col border-t bg-[var(--surface-inset)] p-3">
          <div className="text-secondary mb-1 flex items-center gap-1 text-[11px] font-bold">
            <Code className="brand h-3.5 w-3.5" />
            <span>Result: queries.{activeQuery?.name}.data</span>
          </div>
          <pre className="surface-inset text-secondary flex-1 overflow-auto p-2 font-mono text-[10px]">
            {activeResult.loading
              ? "호출 중..."
              : activeResult.error
                ? `오류: ${activeResult.error}`
                : JSON.stringify(activeResult.data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};
