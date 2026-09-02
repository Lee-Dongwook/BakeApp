-- 프로젝트 편집 상태(AST, API 정의, 워크플로우)를 보관하는 단일 JSON 문서입니다.

CREATE TABLE IF NOT EXISTS public.project_documents (
  project_id UUID PRIMARY KEY REFERENCES public.projects(id) ON DELETE CASCADE,
  document JSONB NOT NULL DEFAULT '{"pages": [], "queries": [], "workflows": []}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
