CREATE TABLE IF NOT EXISTS project_schema_migrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  migration_name VARCHAR(255) NOT NULL,
  ddl_statements TEXT[] NOT NULL,
  rollback_statements TEXT[],
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, version)
);

CREATE INDEX IF NOT EXISTS idx_project_schema_migrations_project 
ON project_schema_migrations(project_id, version DESC);
