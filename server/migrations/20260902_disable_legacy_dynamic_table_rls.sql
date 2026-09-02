-- 이전 버전에서 동적 테이블에 적용한 RLS를 해제합니다.
-- 이후 권한은 API의 AuthGuard와 ProjectService가 일관되게 검증합니다.

DO $$
DECLARE
  table_record RECORD;
BEGIN
  FOR table_record IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public' AND tablename ~ '^tenant_[a-z0-9_]+$'
  LOOP
    EXECUTE format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY', table_record.tablename);
  END LOOP;
END $$;
