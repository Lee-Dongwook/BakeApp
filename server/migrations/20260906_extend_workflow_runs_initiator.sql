-- 워크플로우 실행 주체와 실행 시점의 정의 스냅샷을 기록합니다.
-- initiator_id에는 빌더 사용자(users.id)와 런타임 사용자(runtime_users.id)가 모두 들어오므로
-- 외래 키를 두지 않고 initiator_type으로 구분합니다.

ALTER TABLE public.workflow_runs
  ADD COLUMN IF NOT EXISTS initiator_type TEXT NOT NULL DEFAULT 'BUILDER_USER',
  ADD COLUMN IF NOT EXISTS initiator_id UUID,
  ADD COLUMN IF NOT EXISTS definition_snapshot JSONB;

ALTER TABLE public.workflow_runs
  DROP CONSTRAINT IF EXISTS workflow_runs_initiator_type_check;

ALTER TABLE public.workflow_runs
  ADD CONSTRAINT workflow_runs_initiator_type_check
    CHECK (initiator_type IN ('BUILDER_USER', 'RUNTIME_USER', 'SYSTEM'));

-- 실행 주체별 최근 실행 이력 조회용 인덱스
CREATE INDEX IF NOT EXISTS workflow_runs_initiator_created_at_idx
  ON public.workflow_runs (initiator_type, initiator_id, created_at DESC);
