-- BakeApp 프로젝트 영속화의 첫 단계입니다.
-- Supabase SQL Editor 또는 PostgreSQL 마이그레이션 도구에서 한 번 실행하세요.

CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL CHECK (char_length(btrim(name)) > 0),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS projects_owner_updated_at_idx
  ON public.projects (owner_id, updated_at DESC);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Project owners manage their projects" ON public.projects;
CREATE POLICY "Project owners manage their projects"
  ON public.projects
  FOR ALL
  USING ((SELECT auth.uid()) = owner_id)
  WITH CHECK ((SELECT auth.uid()) = owner_id);
