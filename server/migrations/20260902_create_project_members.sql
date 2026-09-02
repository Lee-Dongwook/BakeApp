-- 프로젝트 권한의 최소 단위: 소유자(owner), 편집자(editor), 조회자(viewer).

CREATE TABLE IF NOT EXISTS public.project_members (
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'editor', 'viewer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (project_id, user_id)
);

INSERT INTO public.project_members (project_id, user_id, role)
SELECT id, owner_id, 'owner'
FROM public.projects
ON CONFLICT (project_id, user_id) DO NOTHING;

CREATE INDEX IF NOT EXISTS project_members_user_project_idx
  ON public.project_members (user_id, project_id);
