-- 프로젝트별 외부 PostgreSQL 연결 설정을 저장합니다.
-- config에는 host, port, database, user, password, ssl 값을 JSON 객체로 저장합니다.

CREATE TABLE IF NOT EXISTS public.project_datasources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL CHECK (char_length(btrim(name)) > 0),
  type TEXT NOT NULL CHECK (type IN ('POSTGRESQL')),
  config JSONB NOT NULL CHECK (jsonb_typeof(config) = 'object'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS project_datasources_project_updated_at_idx
  ON public.project_datasources (project_id, updated_at DESC);
