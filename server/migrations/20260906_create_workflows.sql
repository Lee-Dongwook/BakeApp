-- 확장 워크플로우 엔진의 정의와 실행 이력을 저장합니다.

CREATE TABLE IF NOT EXISTS public.workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL CHECK (char_length(btrim(name)) > 0),
  nodes JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(nodes) = 'array'),
  edges JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(edges) = 'array'),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT workflows_project_name_key UNIQUE (project_id, name)
);

CREATE INDEX IF NOT EXISTS workflows_project_active_updated_at_idx
  ON public.workflows (project_id, is_active, updated_at DESC);

CREATE TABLE IF NOT EXISTS public.workflow_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('SUCCESS', 'FAILED')),
  execution_detail JSONB NOT NULL CHECK (jsonb_typeof(execution_detail) = 'array'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS workflow_logs_workflow_created_at_idx
  ON public.workflow_logs (workflow_id, created_at DESC);
