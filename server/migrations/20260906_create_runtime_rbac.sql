CREATE TABLE IF NOT EXISTS runtime_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(64) NOT NULL,
  description TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, name)
);

CREATE TABLE IF NOT EXISTS runtime_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  resource_type VARCHAR(32) NOT NULL, -- 'PAGE', 'QUERY', 'WORKFLOW', 'TABLE'
  resource_id VARCHAR(255) NOT NULL,  -- page_id, query_id, workflow_id, table_name
  action VARCHAR(32) NOT NULL,        -- 'READ', 'EXECUTE', 'CREATE', 'UPDATE', 'DELETE'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, resource_type, resource_id, action)
);

CREATE TABLE IF NOT EXISTS runtime_role_permissions (
  role_id UUID NOT NULL REFERENCES runtime_roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES runtime_permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS runtime_user_roles (
  user_id UUID NOT NULL REFERENCES runtime_users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES runtime_roles(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id)
);

-- 5. Row-Level Policy (행 단위 접근 제한 규칙)
CREATE TABLE IF NOT EXISTS runtime_row_level_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  table_name VARCHAR(64) NOT NULL,
  role_id UUID REFERENCES runtime_roles(id) ON DELETE CASCADE, -- NULL이면 모든 Role에 적용
  action VARCHAR(32) NOT NULL DEFAULT 'READ',                 -- 'READ', 'UPDATE', 'DELETE'
  filter_expression TEXT NOT NULL,                             -- 예: "created_by = {{ currentUser.id }}" 또는 "department_id = {{ currentUser.metadata.departmentId }}"
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_runtime_user_roles_user ON runtime_user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_runtime_rlp_table ON runtime_row_level_policies(project_id, table_name);
