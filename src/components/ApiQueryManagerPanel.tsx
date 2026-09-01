import React, { useState } from "react";
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
    <div className="w-80 border-r border-slate-800 bg-slate-900 flex flex-col h-full text-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-amber-400" />
          <h3 className="font-bold text-sm">API Query Manager</h3>
        </div>
      </div>

      {/* Query Generator Form */}
      <form
        onSubmit={handleCreate}
        className="p-3 border-b border-slate-800 space-y-2 bg-slate-950/40"
      >
        <div className="flex gap-2">
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value as any)}
            className="px-2 py-1 text-xs bg-slate-900 border border-slate-700 rounded text-amber-400 font-bold"
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
            className="flex-1 px-2 py-1 text-xs bg-slate-900 border border-slate-700 rounded text-white focus:outline-none focus:border-amber-500"
          />
        </div>
        <input
          type="text"
          placeholder="URL (예: https://api.com/users?email={{ form.email }})"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="w-full px-2 py-1 text-xs bg-slate-900 border border-slate-700 rounded text-white focus:outline-none focus:border-amber-500 font-mono"
        />
        {method !== "GET" && (
          <textarea
            placeholder='JSON Body (예: {"name": "{{ form.name }}"})'
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={2}
            className="w-full px-2 py-1 text-xs bg-slate-900 border border-slate-700 rounded text-white font-mono focus:outline-none focus:border-amber-500"
          />
        )}
        <button
          type="submit"
          className="w-full py-1 text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded transition flex items-center justify-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" /> Query 생성
        </button>
      </form>

      {/* Query List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {queries.map((q) => (
          <div
            key={q.id}
            onClick={() => setSelectedQueryId(q.id)}
            className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs cursor-pointer transition ${
              q.id === selectedQueryId
                ? "bg-slate-800 border border-slate-700 text-amber-400"
                : "hover:bg-slate-800/50 text-slate-400"
            }`}
          >
            <div className="truncate flex items-center gap-2">
              <span className="font-bold text-[10px] px-1.5 py-0.5 rounded bg-slate-950 text-amber-500 border border-slate-800">
                {q.method}
              </span>
              <span className="font-mono font-medium">{q.name}</span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  runQuery(q.id);
                }}
                className="p-1 hover:bg-slate-700 text-emerald-400 rounded transition"
                title="테스트 실행"
              >
                <Play className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteQuery(q.id);
                }}
                className="p-1 hover:bg-slate-700 text-red-400 rounded transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Live Result Preview */}
      {activeResult && (
        <div className="border-t border-slate-800 p-3 bg-slate-950 h-40 flex flex-col">
          <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400 mb-1">
            <Code className="w-3.5 h-3.5 text-amber-500" />
            <span>Result: queries.{activeQuery?.name}.data</span>
          </div>
          <pre className="flex-1 overflow-auto text-[10px] font-mono text-slate-300 bg-slate-900 p-2 rounded border border-slate-800">
            {activeResult.loading
              ? "호출 중..."
              : JSON.stringify(activeResult.data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};
