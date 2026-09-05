-- API에서 발생한 데이터 변경 이력을 보관합니다.
-- 관련 사용자·프로젝트가 삭제되어도 감사 기록은 유지합니다.

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_table TEXT,
  record_id UUID,
  changes JSONB,
  ip_address VARCHAR(45),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS audit_logs_project_created_at_idx
  ON public.audit_logs (project_id, created_at DESC);

CREATE INDEX IF NOT EXISTS audit_logs_user_created_at_idx
  ON public.audit_logs (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS audit_logs_target_record_idx
  ON public.audit_logs (target_table, record_id);
