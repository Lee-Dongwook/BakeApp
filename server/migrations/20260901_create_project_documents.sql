-- 프로젝트 편집 상태(AST, API 정의, 워크플로우)를 보관하는 단일 JSON 문서입니다.

CREATE TABLE IF NOT EXISTS public.project_documents (
  project_id UUID PRIMARY KEY REFERENCES public.projects(id) ON DELETE CASCADE,
  document JSONB NOT NULL DEFAULT '{"pages": [], "queries": [], "workflows": []}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.project_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Project owners manage their documents" ON public.project_documents;
CREATE POLICY "Project owners manage their documents"
  ON public.project_documents
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_documents.project_id
        AND projects.owner_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_documents.project_id
        AND projects.owner_id = (SELECT auth.uid())
    )
  );
