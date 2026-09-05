CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS project_environments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    key VARCHAR(255) NOT NULL,
    value TEXT NOT NULL, -- 일반 값 또는 AES-256 암호화된 값
    is_secret BOOLEAN DEFAULT false, -- true일 경우 스튜디오 UI 조회 시 마스킹 처리
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_project_env_key UNIQUE (project_id, key)
);

CREATE INDEX IF NOT EXISTS idx_project_environments_project_id 
ON project_environments(project_id);

CREATE TABLE IF NOT EXISTS runtime_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user', -- 'admin', 'manager', 'user' 등
    metadata JSONB DEFAULT '{}'::jsonb, -- 프로필, 이름, 부서 등 커스텀 메타데이터
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_project_runtime_user_email UNIQUE (project_id, email)
);

CREATE INDEX IF NOT EXISTS idx_runtime_users_project_email 
ON runtime_users(project_id, email);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_project_environments_updated_at ON project_environments;
CREATE TRIGGER update_project_environments_updated_at
    BEFORE UPDATE ON project_environments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_runtime_users_updated_at ON runtime_users;
CREATE TRIGGER update_runtime_users_updated_at
    BEFORE UPDATE ON runtime_users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
