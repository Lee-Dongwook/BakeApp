-- BakeApp Studio
-- Workflow execution history
-- Creates normalized workflow run / step run tables for persisted workflow execution.

BEGIN;

CREATE TABLE IF NOT EXISTS workflow_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    project_id UUID NOT NULL,
    workflow_id UUID NOT NULL,

    status TEXT NOT NULL DEFAULT 'PENDING'
        CHECK (
            status IN (
                'PENDING',
                'RUNNING',
                'WAITING',
                'SUCCEEDED',
                'FAILED',
                'CANCELLED',
                'TIMED_OUT'
            )
        ),

    trigger_type TEXT,
    trigger_context JSONB NOT NULL DEFAULT '{}'::jsonb,

    input JSONB NOT NULL DEFAULT '{}'::jsonb,
    output JSONB,
    error JSONB,

    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,

    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT workflow_runs_project_fk
        FOREIGN KEY (project_id)
        REFERENCES projects(id)
        ON DELETE CASCADE,

    CONSTRAINT workflow_runs_workflow_fk
        FOREIGN KEY (workflow_id)
        REFERENCES workflows(id)
        ON DELETE CASCADE,

    CONSTRAINT workflow_runs_created_by_fk
        FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS workflow_step_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    workflow_run_id UUID NOT NULL,

    node_id TEXT NOT NULL,
    node_type TEXT NOT NULL,

    status TEXT NOT NULL DEFAULT 'PENDING'
        CHECK (
            status IN (
                'PENDING',
                'RUNNING',
                'SUCCEEDED',
                'FAILED',
                'SKIPPED',
                'RETRYING'
            )
        ),

    attempt INTEGER NOT NULL DEFAULT 1
        CHECK (attempt >= 1),

    input JSONB,
    output JSONB,
    error JSONB,

    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    duration_ms INTEGER
        CHECK (duration_ms IS NULL OR duration_ms >= 0),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT workflow_step_runs_run_fk
        FOREIGN KEY (workflow_run_id)
        REFERENCES workflow_runs(id)
        ON DELETE CASCADE
);

-- Fast lookup of recent runs for a workflow.
CREATE INDEX IF NOT EXISTS workflow_runs_workflow_created_at_idx
    ON workflow_runs (workflow_id, created_at DESC);

-- Project-wide execution history.
CREATE INDEX IF NOT EXISTS workflow_runs_project_created_at_idx
    ON workflow_runs (project_id, created_at DESC);

-- Operational filtering by execution state.
CREATE INDEX IF NOT EXISTS workflow_runs_project_status_created_at_idx
    ON workflow_runs (project_id, status, created_at DESC);

-- Fetch ordered step history for a run.
CREATE INDEX IF NOT EXISTS workflow_step_runs_run_created_at_idx
    ON workflow_step_runs (workflow_run_id, created_at ASC);

-- Useful when inspecting retries or a specific workflow node.
CREATE INDEX IF NOT EXISTS workflow_step_runs_run_node_attempt_idx
    ON workflow_step_runs (workflow_run_id, node_id, attempt);

COMMIT;
