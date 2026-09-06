import { Client } from "pg";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config({ path: path.join(__dirname, "../.env") });

const MIGRATIONS_DIR = path.join(__dirname, "../migrations");

// 여러 프로세스가 동시에 마이그레이션을 돌려도 한 번만 적용되도록 하는 advisory lock 키입니다.
const LOCK_KEY = 4_113_920_871;

function buildClient(): Client {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL 환경 변수가 설정되지 않았습니다.");
  }

  const ssl =
    process.env.DATABASE_SSL === "true"
      ? {
          rejectUnauthorized:
            process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== "false",
        }
      : undefined;

  return new Client({ connectionString, ssl });
}

async function runMigrations(client: Client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) NOT NULL UNIQUE,
      executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  // 다른 프로세스가 마이그레이션 중이면 끝날 때까지 대기합니다.
  await client.query("SELECT pg_advisory_lock($1);", [LOCK_KEY]);

  try {
    const { rows } = await client.query(
      "SELECT filename FROM schema_migrations;",
    );
    const executedFiles = new Set<string>(rows.map((r) => r.filename));

    if (!fs.existsSync(MIGRATIONS_DIR)) {
      console.log("⚠️ migrations 디렉터리가 존재하지 않습니다.");
      return;
    }

    const files = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith(".sql"))
      .sort(); // 파일명이 YYYYMMDD_ 로 시작하므로 이름순 = 적용순

    const pending = files.filter((f) => !executedFiles.has(f));

    if (pending.length === 0) {
      console.log("적용할 새로운 마이그레이션이 없습니다.");
      return;
    }

    for (const file of pending) {
      console.log(`🚀 [Migration] Executing: ${file}`);
      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf8");
      const startedAt = Date.now();

      try {
        await client.query("BEGIN");
        await client.query(sql);
        await client.query(
          "INSERT INTO schema_migrations (filename) VALUES ($1);",
          [file],
        );
        await client.query("COMMIT");
      } catch (err) {
        await client.query("ROLLBACK");
        throw new Error(
          `마이그레이션 실패: ${file}\n${(err as Error).message}`,
        );
      }

      console.log(
        `✅ [Migration] Applied: ${file} (${Date.now() - startedAt}ms)`,
      );
    }

    console.log(
      `총 ${pending.length}개의 마이그레이션이 성공적으로 적용되었습니다.`,
    );
  } finally {
    await client.query("SELECT pg_advisory_unlock($1);", [LOCK_KEY]);
  }
}

async function main() {
  const client = buildClient();
  await client.connect();
  try {
    await runMigrations(client);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(`❌ ${err instanceof Error ? err.message : err}`);
  if (err instanceof Error && err) console.error(err);
  process.exitCode = 1;
});
