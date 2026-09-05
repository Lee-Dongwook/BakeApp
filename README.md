# 🍞 BakeApp Studio

BakeApp Studio는 PostgreSQL 기반 내부 업무 도구를 시각적으로 설계·제작·내보내는 고성능 노코드 앱 빌더입니다. 로그인한 사용자가 프로젝트를 만들고, 화면을 드래그 앤 드롭으로 편집하며, 프로젝트별 테이블과 동적 데이터를 실시간으로 바인딩하여 실행 가능한 웹 앱으로 내보낼 수 있습니다.

![BakeApp Studio 화면](img/demo.png)

![BakeApp Studio 데이터베이스 ERD](docs/db/schema.svg)

---

## ✨ 주요 기능 및 구현 범위

### 1. 인증 및 프로젝트 관리

- **자체 인증 & 세션 갱신**: scrypt 해시 기반 회원가입/로그인, 15분 Access Token 및 HttpOnly Refresh Token 자동 회전 갱신
- **역할 기반 접근 제어 (RBAC)**: `owner`, `editor`, `viewer` 권한 모델
- **프로젝트 협업**: 소유자가 이메일 또는 사용자 ID로 `editor`·`viewer`를 초대하고, 역할을 변경하거나 멤버를 제거
- **테넌트 정책**: 사용자별 프로젝트 생성 한도와 코드 내보내기 권한을 PostgreSQL에서 관리
- **프로젝트 대시보드**: 프로젝트 생성, 접근 가능한 프로젝트 조회, 이름 변경 및 삭제

### 2. 고도화된 시각적 화면 편집기 (Canvas Builder)

- **풍부한 컴포넌트 팔레트**:
  - 📦 **레이아웃**: `Box (View)`, `Row`, `Column`, `Grid`, `Card`, `Modal`, `Tabs`, `Form`, `Divider`
  - ✏️ **텍스트 & 미디어**: `Heading`, `Text`, `Lucide Icon`, `Avatar`, `Image`, `Badge`
  - 🔘 **양식 & 컨트롤**: `TextInput`, `TextArea`, `Select`, `Checkbox`, `Switch`, `DatePicker`, `Button`
  - 📊 **데이터 & 대시보드**: `StatCard`, `Chart`, `Data List`
- **멀티 페이지 라우팅**: 페이지 이름과 `/users/:id` 같은 경로를 정의하고, URL 파라미터를 바인딩해 미리보기에서 전환
- **API Query Manager**: 외부 REST API Query를 저장·테스트하고, `{{ form.email }}`, `{{ params.id }}` 같은 동적 값을 URL·본문에 치환
- **스타일·아이콘 편집**: 속성 인스펙터에서 요소 스타일과 Lucide 아이콘을 선택
- **반응형 뷰포트 전환**:
  - 📱 Mobile Portrait (375px)
  - 📱 Mobile Large (430px)
  - 💻 Tablet (768px)
  - 🖥️ Desktop / Responsive (1060px)
- **캔버스 줌 & 스케일**: 50%, 75%, 100%, 125% 확대/축소
- **트리 및 레이어 탐색기 (Layers Panel)**: 컴포넌트 계층 트리 시각화, 요소 선택, 위/아래 순서 변경, 복제, 삭제
- **히스토리 Undo / Redo**: 30단계 실행 취소(`⌘Z`) 및 다시 실행(`⌘⇧Z` / `⌘Y`) 지원

### 3. PostgreSQL 동적 스키마 & 데이터 엔진

- **Dynamic DB Builder**: 프로젝트별 테이블 및 컬럼(타입/필수 여부) 시각적 생성
- **실시간 데이터 바인딩**: `Data List` 및 양식 컴포넌트에서 실시간 스키마 드롭다운 선택
- **CRUD 레코드 관리**: 빌더 내에서 직접 레코드 등록·수정·삭제 및 페이지네이션 조회
- **동적 OpenAPI 문서**: 생성한 테이블의 컬럼 정보를 Swagger 스키마와 API 경로에 반영

### 4. 워크플로우 엔진 (Workflow & Action Chaining)

- **다양한 액션 지원**:
  - `DB_INSERT`: 테이블에 레코드 등록
  - `DB_UPDATE`: 대상 테이블 레코드 수정
  - `DB_DELETE`: 대상 테이블 레코드 삭제
  - `CONDITION`: 비교 연산자와 분기 액션으로 조건부 실행
  - `LOOP`: 런타임 컨텍스트의 배열 또는 직접 전달한 배열을 순회하며 하위 액션 실행
  - `API_CALL`: 외부 엔드포인트 REST API 호출
  - `RUN_QUERY`: 프로젝트에 저장된 API Query 실행
  - `NAVIGATE`: 페이지 전환 및 외부 링크 이동
  - `SHOW_TOAST` / `SHOW_ALERT`: 인앱 토스트 알림 표시
  - `SET_FIELD` / `SET_PAGE_STATE` / `SET_APP_STATE`: 폼·페이지·앱 상태 변경
  - `OPEN_MODAL` / `CLOSE_MODAL`: 모달 열기·닫기
  - `RESET_FORM` / `COPY_CLIPBOARD`: 폼 초기화 및 클립보드 복사
- **동적 변수 바인딩**: `{{ form.name }}`, `{{ params.id }}`, `{{ steps.act_1.id }}` 자동 치환
- **조건·반복·재시도 정책**: 비교 연산자 기반 분기, 항목별 하위 액션 반복, 노드별 `maxRetries`와 재시도 횟수에 비례한 대기 시간을 지원
- **안전한 외부 호출**: `API_CALL`은 HTTP/HTTPS만 허용하며, 기본적으로 내부망 주소를 차단합니다. `WORKFLOW_ALLOWED_HOSTS`를 설정하면 해당 호스트만 호출할 수 있습니다.
- **실행 보호**: DB 변경 액션은 트랜잭션으로 묶고, 순환 실행을 막기 위해 한 워크플로우당 최대 100개 액션만 실행합니다.
- **트리거**: 클릭(`ON_CLICK`), 페이지 로드, 양식 제출

#### 확장 워크플로우 저장소

`workflows` 테이블에는 프로젝트별 노드·엣지 정의와 활성 상태를, `workflow_logs` 테이블에는 성공·실패 상태와 노드별 실행 결과를 저장합니다. 상세 스키마는 [`docs/db/public.workflows.md`](docs/db/public.workflows.md), [`docs/db/public.workflow_logs.md`](docs/db/public.workflow_logs.md)에서 확인할 수 있습니다.

현재 `POST /api/workflow/execute`는 요청 본문의 액션 체인을 실행합니다. `workflowId`로 저장된 정의를 직접 실행하고 로그를 기록하는 확장 엔진 API는 테이블까지 준비된 상태이며, 다음 단계에서 `WorkflowEngineService`의 모듈 등록과 전용 엔드포인트 연결이 필요합니다.

### 5. 관계형 동적 쿼리 빌더

- **프로젝트 테이블 격리**: 프로젝트 ID 기반의 테이블 이름만 사용해 다른 프로젝트 데이터 접근을 차단
- **조인·필터·정렬**: `LEFT`/`INNER` 조인, 비교·포함·NULL 조건, 정렬과 페이지네이션을 조합해 조회
- **키워드 검색 필터**: `search.column`과 `search.keyword`로 지정한 컬럼을 대소문자 구분 없이(`ILIKE`) 부분 검색하며, 기존 `where` 조건과 `AND`로 결합
- **조회 메타데이터**: 데이터와 함께 전체 건수, 현재 페이지, 전체 페이지 수를 반환해 목록 UI의 페이지네이션에 활용
- **안전한 SQL 생성**: 테이블·컬럼 식별자는 검증하고 값은 파라미터 바인딩으로 전달

### 6. 외부 PostgreSQL 데이터소스

- **프로젝트별 연결 관리**: 연결 이름, 타입, 접속 설정을 프로젝트 단위로 등록·목록 조회·삭제
- **PostgreSQL 지원**: 현재 `POSTGRESQL` 타입을 지원하며, `host`, `port`, `database`, `user`, 선택적 `password`, `ssl` 설정을 사용
- **외부 쿼리 실행**: 등록된 데이터소스를 대상으로 SQL과 파라미터를 전달해 결과 행과 건수를 반환
- **권한 분리**: 목록 조회는 프로젝트 조회 권한이 필요하고, 연결 등록·삭제·쿼리 실행은 편집 권한이 필요
- **연결 재사용**: 데이터소스 ID별 PostgreSQL 연결 풀을 서버 메모리에 캐시

외부 데이터소스의 계정은 필요한 테이블에만 최소 권한을 부여하세요. 현재 접속 설정은 `config` JSONB에 저장되므로, 운영 환경에서는 비밀번호 암호화 저장과 읽기 전용 DB 계정 사용이 필요합니다.

### 7. 코드 생성 및 프로젝트 전체 Zip 내보내기

- **React 19 + Tailwind CSS TSX 코드 생성**: 최신 React 컴포넌트 구조로 클린 코드 출력
- **React Native 코드 생성**: 네이티브 컴포넌트(`View`, `Text`, `TextInput`, `Pressable`, `Image`, `Switch`) 호환 소스 출력
- **원클릭 전체 프로젝트 Zip 내보내기 (`GET /api/export/:projectId/zip`)**:
  - `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `src/App.tsx`, `src/pages/*.tsx`를 포함한 완전한 독립 실행형 Vite 프로젝트 아카이브 즉시 다운로드

### 8. Figma 디자인 가져오기

- **Figma 링크·fileKey 지원**: 파일 또는 Frame 링크에서 `fileKey`, 선택적 `nodeId`를 추출
- **캔버스 변환**: Figma의 텍스트·프레임·그룹·컴포넌트·사각형을 BakeApp 캔버스 노드로 변환
- **편집기 연동**: 가져온 결과를 새 페이지로 추가해 기존 노코드 편집 흐름에서 바로 수정

### 9. 감사 로그 (Audit Log)

- **변경 이력 저장 기반**: `AuditService`와 `AuditInterceptor`는 쓰기 요청의 액션(`CREATE`, `UPDATE`, `DELETE`), 대상 테이블·레코드, 변경 데이터(JSON), 요청 IP를 `audit_logs`에 기록하도록 구성
- **추적 정보**: 요청한 사용자와 프로젝트를 함께 보관하여 프로젝트·사용자별 변경 이력을 조회할 수 있도록 인덱스 구성
- **기록 보존**: 프로젝트 또는 사용자가 삭제되면 참조 값만 `NULL`로 바꾸고 감사 기록 자체는 유지

#### 구현 파일

| 파일                                               | 역할                                                                             |
| -------------------------------------------------- | -------------------------------------------------------------------------------- |
| `server/src/modules/audit/audit.service.ts`        | 파라미터를 JSONB로 변환하여 `audit_logs`에 저장                                  |
| `server/src/modules/audit/audit.interceptor.ts`    | `GET`/`OPTIONS`/`HEAD`를 제외한 요청을 감지하고 HTTP 메서드를 감사 액션으로 변환 |
| `server/migrations/20260905_create_audit_logs.sql` | 테이블, 외래 키, 조회 인덱스 생성                                                |
| `.tbls.yml`                                        | `audit_logs`의 tbls 설명 설정                                                    |

#### 저장 구조 및 조회 성능

| 컬럼                        | 설명                                                                        |
| --------------------------- | --------------------------------------------------------------------------- |
| `id`                        | 감사 로그 고유 UUID                                                         |
| `project_id`, `user_id`     | 변경이 발생한 프로젝트와 요청 사용자. 삭제 시 `NULL`로 변경하여 로그는 보존 |
| `action`                    | `CREATE`, `UPDATE`, `DELETE` 등 변경 액션                                   |
| `target_table`, `record_id` | 변경 대상 테이블 및 레코드 UUID                                             |
| `changes`                   | 요청 본문과 응답 성공 여부를 담는 JSONB 데이터                              |
| `ip_address`                | IPv4/IPv6 요청 IP 주소                                                      |
| `created_at`                | 로그 생성 시각                                                              |

프로젝트별·사용자별 최신 로그 조회와 특정 레코드 변경 이력 조회를 위해 다음 인덱스를 생성합니다.

- `audit_logs_project_created_at_idx` — `(project_id, created_at DESC)`
- `audit_logs_user_created_at_idx` — `(user_id, created_at DESC)`
- `audit_logs_target_record_idx` — `(target_table, record_id)`

#### 적용 상태

`AuditModule`은 `AppModule`에 등록되어 있습니다. 감사 로그를 실제 요청에 남길 범위를 정한 뒤, 필요한 컨트롤러 또는 전역 범위에 `AuditInterceptor`를 적용하면 됩니다.

감사 로그 기록 실패는 원래 API 처리 결과를 막지 않고 서버 콘솔에 오류만 남기도록 설계되어 있습니다.

### 10. 프로젝트 릴리즈 및 롤백

- **버전 스냅샷**: 프로젝트별로 증가하는 버전 번호, 이름·설명, 동적 스키마 JSON 스냅샷과 생성자를 `project_versions`에 저장
- **프로덕션 배포 지정**: `project_deployments`에서 프로젝트별 활성 버전을 단일 행으로 관리
- **안전한 배포 관계**: 복합 외래 키로 다른 프로젝트의 버전을 현재 프로젝트에 배포하지 못하도록 차단
- **즉시 롤백**: 최근 버전 2개 중 직전 버전을 활성 배포 버전으로 다시 지정

### 11. Runtime 인증 및 프로젝트 환경 변수

- **최종 사용자 인증**: 빌더 사용자와 분리된 프로젝트별 런타임 사용자 회원가입·로그인 및 7일 Runtime JWT 발급
- **Runtime Guard**: Runtime JWT를 검증한 사용자 정보를 요청의 `runtimeUser`에 주입해 런타임 API에서 사용할 수 있도록 제공
- **프로젝트 환경 변수**: 일반 값과 AES-256-CBC 암호화 Secret 값을 프로젝트별로 저장하고, 워크플로우 실행 컨텍스트의 `env`에 복호화해 주입
- **Secret 마스킹**: 스튜디오용 환경 변수 조회 시 Secret 값은 `********`로만 반환

`EnvironmentModule`은 `WorkflowModule`에 연결되어 있고, `RuntimeAuthModule`은 `AppModule`에 등록되어 Runtime 인증 API를 제공합니다.

---

## 🛠️ 기술 스택

- **Frontend**: React 19, TypeScript, Vite, Zustand, Tailwind CSS v4, @dnd-kit, Lucide Icons, PrismJS
- **Backend**: NestJS, TypeScript, Swagger (OpenAPI 3.0), JSZip
- **Database**: PostgreSQL (`pg` Connection Pool)
- **Auth & Security**: scrypt Password Hash, HS256 JWT, HttpOnly Cookie Token Rotation

---

## 🚀 시작하기

### 1. 의존성 설치

```bash
pnpm install
pnpm --dir server install
```

### 2. 환경 변수 설정

```bash
cp server/.env.example server/.env
```

`server/.env` 파일에서 `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_ORIGIN`을 확인합니다.

```env
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/bakeapp
JWT_SECRET=your-32-characters-or-more-random-secret-key-here
ENCRYPTION_SECRET=your-project-environment-encryption-secret-here
FRONTEND_ORIGIN=http://localhost:5173
FIGMA_ACCESS_TOKEN=your_figma_personal_access_token_here
```

### 3. 데이터베이스 마이그레이션

순서대로 SQL 파일을 실행합니다.

1. `server/migrations/20260831_create_users.sql`
2. `server/migrations/20260901_create_projects.sql`
3. `server/migrations/20260902_create_project_documents.sql`
4. `server/migrations/20260902_create_project_members.sql`
5. `server/migrations/20260902_disable_legacy_dynamic_table_rls.sql`
6. `server/migrations/20260903_create_refresh_tokens.sql`
7. `server/migrations/20260905_create_audit_logs.sql`
8. `server/migrations/20260905_create_project_releases.sql`
9. `server/migrations/20260905_pg_crypto.sql`
10. `server/migrations/20260905_schema_and_policies.sql`
11. `server/migrations/20260905_create_project_datasources.sql`
12. `server/migrations/20260906_add_project_datasource_name.sql`
13. `server/migrations/20260906_create_workflows.sql`

이미 `project_datasources` 테이블을 적용한 Docker PostgreSQL에 연결 이름 컬럼을 추가하려면 다음 명령을 사용합니다.

```bash
docker compose exec -T db psql -v ON_ERROR_STOP=1 \
  -U "${POSTGRES_USER:-bakeapp}" -d "${POSTGRES_DB:-bakeapp}" \
  -f /docker-entrypoint-initdb.d/20260906_add_project_datasource_name.sql
```

`audit_logs`에는 `project_id`, `user_id`, `action`, `target_table`, `record_id`, `changes`, `ip_address`, `created_at`이 저장됩니다. `changes`는 요청 본문과 응답 요약을 JSON 형식으로 보관합니다.

워크플로우 정의·실행 로그 테이블을 이미 실행 중인 Docker PostgreSQL에 적용하려면 다음 명령을 사용합니다.

```bash
docker compose exec -T db psql -v ON_ERROR_STOP=1 \
  -U "${POSTGRES_USER:-bakeapp}" -d "${POSTGRES_DB:-bakeapp}" \
  -f /docker-entrypoint-initdb.d/20260906_create_workflows.sql
```

### 4. ERD 문서 생성 (tbls)

Docker 네트워크 안에서 `tbls`를 실행하므로, 로컬 컴퓨터의 PostgreSQL 포트와 충돌하지 않습니다.

```bash
docker compose up -d db
pnpm db:doc
```

- 접속 정보는 Docker Compose의 `POSTGRES_*` 환경 변수로만 전달하며, `.tbls.yml`에는 저장하지 않습니다.
- 생성 결과는 `docs/db/README.md`와 `docs/db/schema.svg`입니다.
- 감사 로그 테이블 상세 문서는 `docs/db/public.audit_logs.md`에서 확인할 수 있습니다.
- 릴리즈 테이블 상세 문서는 `docs/db/public.project_versions.md`, `docs/db/public.project_deployments.md`에서 확인할 수 있습니다.
- 외부 데이터소스 테이블 상세 문서는 `docs/db/public.project_datasources.md`에서 확인할 수 있습니다.
- 워크플로우 정의·실행 로그 테이블 상세 문서는 `docs/db/public.workflows.md`, `docs/db/public.workflow_logs.md`에서 확인할 수 있습니다.
- 별도의 로컬 `tbls` 설치는 필요하지 않습니다. 처음 실행할 때 Docker가 이미지를 내려받습니다.

### 5. 개발 서버 실행

```bash
pnpm dev
```

- Frontend: `http://localhost:5173`
- Backend API / Swagger: `http://localhost:3000/api`

---

## ⌨️ 단축키 안내

| 단축키                             | 설명                                                          |
| ---------------------------------- | ------------------------------------------------------------- |
| `⌘ / Ctrl + S`                     | 프로젝트 저장                                                 |
| `⌘ / Ctrl + Z`                     | 실행 취소 (Undo)                                              |
| `⌘ / Ctrl + ⇧ + Z` 또는 `Ctrl + Y` | 다시 실행 (Redo)                                              |
| `⌘ / Ctrl + D`                     | 선택한 컴포넌트 복제                                          |
| `V / C / T / B / I / S / L`        | View · Card · Text · Button · Input · Select · List 빠른 추가 |
| `Delete` / `Backspace`             | 선택한 컴포넌트 삭제                                          |
| `?`                                | 단축키 도움말 모달 열기/닫기                                  |

---

## 📡 주요 API 엔드포인트

| 카테고리            | 메서드 / 경로                                                   | 설명                                        |
| ------------------- | --------------------------------------------------------------- | ------------------------------------------- |
| **인증**            | `POST /api/auth/signup`                                         | 회원가입                                    |
|                     | `POST /api/auth/signin`                                         | 로그인 & 토큰 발급                          |
|                     | `POST /api/auth/refresh`                                        | 토큰 갱신                                   |
|                     | `POST /api/auth/logout`                                         | 로그아웃                                    |
| **프로젝트**        | `GET, POST /api/projects`                                       | 접근 가능한 프로젝트 목록 및 생성           |
|                     | `GET, PATCH, DELETE /api/projects/:id`                          | 프로젝트 상세, 이름 변경, 삭제              |
|                     | `GET, PUT /api/projects/:id/document`                           | 프로젝트 AST 문서 조회 및 저장              |
|                     | `GET, POST /api/projects/:id/members`                           | 프로젝트 멤버 목록, 초대 및 역할 변경       |
|                     | `DELETE /api/projects/:id/members/:userId`                      | 프로젝트 멤버 제거                          |
| **동적 스키마**     | `POST /api/dynamic-schema/table`                                | 프로젝트 테이블 및 컬럼 생성                |
|                     | `GET /api/dynamic-schema/tables/:projectId`                     | 프로젝트 테이블 목록 조회                   |
|                     | `POST /api/dynamic-schema/column`                               | 기존 테이블에 컬럼 추가                     |
| **동적 데이터**     | `GET, POST /api/dynamic-data/:projectId/:tableName`             | 동적 레코드 조회 및 추가                    |
|                     | `PATCH, DELETE /api/dynamic-data/:projectId/:tableName/:id`     | 레코드 수정 및 삭제                         |
| **관계형 쿼리**     | `POST /api/projects/:projectId/query/execute`                   | 조인·필터·정렬·키워드 검색 기반 동적 조회   |
| **외부 데이터소스** | `GET, POST /api/projects/:projectId/datasources`                | 외부 PostgreSQL 연결 목록 조회 및 등록      |
|                     | `POST /api/projects/:projectId/datasources/:datasourceId/query` | 등록한 외부 DB에 SQL 실행                   |
|                     | `DELETE /api/projects/:projectId/datasources/:datasourceId`     | 외부 PostgreSQL 연결 삭제                   |
| **워크플로우**      | `POST /api/workflow/execute`                                    | 액션 체인 순차 실행                         |
| **Runtime 인증**    | `POST /api/runtime/:projectId/auth/signup`                      | 프로젝트 최종 사용자 회원가입               |
|                     | `POST /api/runtime/:projectId/auth/login`                       | Runtime JWT 발급                            |
| **릴리즈**          | `POST /api/projects/:projectId/releases`                        | 현재 상태의 릴리즈 버전 생성                |
|                     | `POST /api/projects/:projectId/releases/:versionId/deploy`      | 특정 버전을 활성 배포 버전으로 지정         |
|                     | `POST /api/projects/:projectId/releases/rollback`               | 직전 릴리즈 버전으로 롤백                   |
| **컴파일/내보내기** | `POST /api/generator/compile?target=react`                      | 단일 화면 코드 컴파일                       |
|                     | `GET /api/export/:projectId/zip`                                | 프로젝트 전체 소스코드 zip 다운로드         |
| **Figma 가져오기**  | `POST /api/figma/import`                                        | Figma 링크 또는 fileKey를 캔버스 AST로 변환 |

---

## 🔍 검증 및 빌드 명령

```bash
# 클라이언트 타입 검사 및 프로덕션 빌드
pnpm build

# 백엔드 프로덕션 빌드
pnpm --dir server build
```
