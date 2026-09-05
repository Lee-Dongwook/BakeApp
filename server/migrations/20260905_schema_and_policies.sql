-- 프로젝트별 동적 스키마, 플랜 한도, 약관 동의 이력을 저장합니다.
-- project_members와 project_documents의 기본 키 및 역할 제약은
-- 이전 마이그레이션에서 이미 생성하므로 여기서 중복 생성하지 않습니다.
CREATE TABLE IF NOT EXISTS public.project_schemas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  table_name varchar(64) NOT NULL,
  schema_definition jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT NOW(),
  updated_at timestamp with time zone DEFAULT NOW(),
  CONSTRAINT uq_project_schema_table UNIQUE(project_id, table_name)
);

CREATE TABLE IF NOT EXISTS public.tenant_limits (
  user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  plan_type varchar(20) DEFAULT 'FREE',
  max_projects int DEFAULT 3,
  allow_code_export boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_terms_agreements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  terms_version varchar(20) NOT NULL,
  consents jsonb NOT NULL DEFAULT '{}',
  ip_address varchar(45),
  agreed_at timestamp with time zone DEFAULT NOW()
);
