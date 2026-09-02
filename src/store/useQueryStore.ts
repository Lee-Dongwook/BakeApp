import { create } from "zustand";
import { apiClient } from "../api/client";
import { useRuntimeStore } from "./useRuntimeStore";
import { usePageStore } from "./usePageStore";
import { notifyEditorChanged } from "./editorChangeTracker";

export interface ApiQuery {
  id: string;
  name: string;
  url: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  headers?: Record<string, string>;
  body?: string;
}

interface QueryState {
  queries: ApiQuery[];
  queryResults: Record<string, { data: any; loading: boolean; error: any }>;

  replaceQueries: (queries: ApiQuery[]) => void;
  resetQueries: () => void;
  addQuery: (query: ApiQuery) => void;
  updateQuery: (id: string, query: Partial<ApiQuery>) => void;
  deleteQuery: (id: string) => void;

  runQuery: (queryId: string) => Promise<any>;
}

const initialQueries: ApiQuery[] = [
  {
    id: "query-get-users",
    name: "getUsers",
    url: "https://jsonplaceholder.typicode.com/users",
    method: "GET",
    headers: { "Content-Type": "application/json" },
  },
];

export const useQueryStore = create<QueryState>((set, get) => ({
  queries: structuredClone(initialQueries),
  queryResults: {},
  replaceQueries: (queries) => set({ queries, queryResults: {} }),
  resetQueries: () =>
    set({ queries: structuredClone(initialQueries), queryResults: {} }),
  addQuery: (query) => {
    set((state) => ({ queries: [...state.queries, query] }));
    notifyEditorChanged();
  },
  updateQuery: (id, updated) => {
    set((state) => ({
      queries: state.queries.map((q) =>
        q.id === id ? { ...q, ...updated } : q,
      ),
    }));
    notifyEditorChanged();
  },
  deleteQuery: (id) => {
    set((state) => ({
      queries: state.queries.filter((q) => q.id !== id),
    }));
    notifyEditorChanged();
  },
  runQuery: async (queryId) => {
    const query = get().queries.find((q) => q.id === queryId);
    if (!query) return;

    set((state) => ({
      queryResults: {
        ...state.queryResults,
        [query.name]: { data: null, loading: true, error: null },
      },
    }));

    const resolveParams = (str: string) => {
      if (!str) return str;
      const { formState } = useRuntimeStore.getState();
      const { pageParams } = usePageStore.getState();

      return str.replace(/\{\{\s*([\w\.]+)\s*\}\}/g, (_, path) => {
        const keys = path.split(".");
        if (keys[0] === "form") return formState[keys[1]] ?? "";
        if (keys[0] === "params") return pageParams[keys[1]] ?? "";
        return "";
      });
    };

    const resolvedUrl = resolveParams(query.url);
    const resolvedBody = query.body ? resolveParams(query.body) : undefined;

    try {
      const response = await apiClient.request<unknown>(resolvedUrl, {
        method: query.method,
        headers: query.headers,
        body: resolvedBody ? JSON.parse(resolvedBody) : undefined,
      });

      set((state) => ({
        queryResults: {
          ...state.queryResults,
          [query.name]: { data: response, loading: false, error: null },
        },
      }));

      return response;
    } catch (error: any) {
      console.error(`[Query Error] ${query.name}:`, error);
      set((state) => ({
        queryResults: {
          ...state.queryResults,
          [query.name]: { data: null, loading: false, error: error.message },
        },
      }));
      throw error;
    }
  },
}));
