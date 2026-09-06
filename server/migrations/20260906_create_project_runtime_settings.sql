-- 배포된 프로젝트를 슬러그 기반 런타임 앱으로 노출하기 위한 설정입니다.

CREATE TABLE IF NOT EXISTS public.project_runtime_settings (
  project_id UUID PRIMARY KEY REFERENCES public.projects(id) ON DELETE CASCADE,
  slug VARCHAR(100) NOT NULL UNIQUE
    CHECK (slug ~ '^[a-z0-9]([a-z0-9-]{0,98}[a-z0-9])?$'),
  is_public BOOLEAN NOT NULL DEFAULT false,
  auth_required BOOLEAN NOT NULL DEFAULT true,
  signup_enabled BOOLEAN NOT NULL DEFAULT false,
  default_page TEXT NOT NULL DEFAULT '/',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DROP TRIGGER IF EXISTS update_project_runtime_settings_updated_at
  ON public.project_runtime_settings;
CREATE TRIGGER update_project_runtime_settings_updated_at
  BEFORE UPDATE ON public.project_runtime_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
