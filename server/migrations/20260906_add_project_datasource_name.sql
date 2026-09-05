-- create_project_datasources 마이그레이션을 먼저 적용한 개발 DB를 위한 호환 마이그레이션입니다.

ALTER TABLE public.project_datasources
  ADD COLUMN IF NOT EXISTS name VARCHAR(100) NOT NULL
  CHECK (char_length(btrim(name)) > 0);
