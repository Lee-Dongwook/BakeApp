-- 프로젝트 버전 스냅샷과 현재 배포 버전을 관리합니다.

CREATE TABLE IF NOT EXISTS public.project_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL CHECK (version_number > 0),
  name VARCHAR(100) NOT NULL CHECK (char_length(btrim(name)) > 0),
  description TEXT,
  snapshot JSONB NOT NULL,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT project_versions_project_version_number_key
    UNIQUE (project_id, version_number),
  CONSTRAINT project_versions_project_id_id_key
    UNIQUE (project_id, id)
);

CREATE INDEX IF NOT EXISTS project_versions_project_created_at_idx
  ON public.project_versions (project_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.project_deployments (
  project_id UUID PRIMARY KEY REFERENCES public.projects(id) ON DELETE CASCADE,
  active_version_id UUID NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT project_deployments_project_version_fkey
    FOREIGN KEY (project_id, active_version_id)
    REFERENCES public.project_versions (project_id, id)
);
