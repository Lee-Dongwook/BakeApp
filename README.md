# 🍞 BakeApp Studio

BakeApp Studio는 PostgreSQL 기반 내부 업무 도구를 시각적으로 설계·제작·내보내는 고성능 노코드 앱 빌더입니다. 로그인한 사용자가 프로젝트를 만들고, 화면을 드래그 앤 드롭으로 편집하며, 프로젝트별 테이블과 동적 데이터를 실시간으로 바인딩하여 실행 가능한 웹 앱으로 내보낼 수 있습니다.

![BakeApp Studio 화면](img/demo.png)

---

## ✨ 주요 기능 및 구현 범위

### 1. 인증 및 프로젝트 관리

- **자체 인증 & 세션 갱신**: scrypt 해시 기반 회원가입/로그인, 15분 Access Token 및 HttpOnly Refresh Token 자동 회전 갱신
- **역할 기반 접근 제어 (RBAC)**: `owner`, `editor`, `viewer` 권한 모델
- **프로젝트 대시보드**: 프로젝트 생성, 실시간 조회, 이름 변경 및 삭제

### 2. 고도화된 시각적 화면 편집기 (Canvas Builder)

- **풍부한 컴포넌트 팔레트**:
  - 📦 **레이아웃**: `Box (View)`, `Card (카드)`, `Form (양식)`, `Divider (구분선)`
  - ✏️ **텍스트 & 미디어**: `Text (텍스트)`, `Image (이미지)`, `Badge (상태 뱃지)`
  - 🔘 **양식 & 컨트롤**: `TextInput (입력)`, `Select (드롭다운)`, `Checkbox (체크박스)`, `Button (버튼)`
  - 🗄️ **데이터 바인딩**: `Data List (동적 목록)`, `Table (데이터 그리드)`
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
- **CRUD 레코드 관리**: 빌더 내에서 직접 레코드 등록 및 최근 5건 미리보기

### 4. 워크플로우 엔진 (Workflow & Action Chaining)

- **다양한 액션 지원**:
  - `DB_INSERT`: 테이블에 레코드 등록
  - `DB_UPDATE`: 대상 테이블 레코드 수정
  - `DB_DELETE`: 대상 테이블 레코드 삭제
  - `API_CALL`: 외부 엔드포인트 REST API 호출
  - `RUN_QUERY`: 프로젝트에 저장된 API Query 실행
  - `NAVIGATE`: 페이지 전환 및 외부 링크 이동
  - `SHOW_TOAST` / `SHOW_ALERT`: 인앱 토스트 알림 표시
  - `SET_FIELD`: 런타임 폼 필드 상태 변경
- **동적 변수 바인딩**: `{{ form.name }}`, `{{ params.id }}`, `{{ steps.act_1.id }}` 자동 치환
- **트리거**: 클릭(`ON_CLICK`), 페이지 로드, 양식 제출

### 5. 코드 생성 및 프로젝트 전체 Zip 내보내기

- **React 19 + Tailwind CSS TSX 코드 생성**: 최신 React 컴포넌트 구조로 클린 코드 출력
- **React Native 코드 생성**: 네이티브 컴포넌트(`View`, `Text`, `TextInput`, `Pressable`, `Image`, `Switch`) 호환 소스 출력
- **원클릭 전체 프로젝트 Zip 내보내기 (`GET /api/export/:projectId/zip`)**:
  - `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `src/App.tsx`, `src/pages/*.tsx`를 포함한 완전한 독립 실행형 Vite 프로젝트 아카이브 즉시 다운로드

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
FRONTEND_ORIGIN=http://localhost:5173
FIGMA_ACCESS_TOKEN=your_figma_personal_access_token_here
```

### 3. 데이터베이스 마이그레이션

순서대로 SQL 파일을 실행합니다.

1. `server/migrations/20260831_create_users.sql`
2. `server/migrations/20260901_create_projects.sql`
3. `server/migrations/20260901_create_project_documents.sql`
4. `server/migrations/20260901_create_project_members.sql`
5. `server/migrations/20260902_disable_legacy_dynamic_table_rls.sql`
6. `server/migrations/20260903_create_refresh_tokens.sql`

### 4. ERD 문서 생성 (tbls)

Docker 네트워크 안에서 `tbls`를 실행하므로, 로컬 컴퓨터의 PostgreSQL 포트와 충돌하지 않습니다.

```bash
docker compose up -d db
pnpm db:doc
```

- 접속 정보는 Docker Compose의 `POSTGRES_*` 환경 변수로만 전달하며, `.tbls.yml`에는 저장하지 않습니다.
- 생성 결과는 `docs/db/README.md`와 `docs/db/schema.svg`입니다.
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

| 카테고리            | 메서드 / 경로                                               | 설명                                        |
| ------------------- | ----------------------------------------------------------- | ------------------------------------------- |
| **인증**            | `POST /api/auth/signup`                                     | 회원가입                                    |
|                     | `POST /api/auth/signin`                                     | 로그인 & 토큰 발급                          |
|                     | `POST /api/auth/refresh`                                    | 토큰 갱신                                   |
|                     | `POST /api/auth/logout`                                     | 로그아웃                                    |
| **프로젝트**        | `GET, POST /api/projects`                                   | 프로젝트 목록 및 생성                       |
|                     | `GET, PATCH, DELETE /api/projects/:id`                      | 프로젝트 상세, 이름 변경, 삭제              |
|                     | `GET, PUT /api/projects/:id/document`                       | 프로젝트 AST 문서 조회 및 저장              |
| **동적 스키마**     | `POST /api/dynamic-schema/table`                            | 프로젝트 테이블 및 컬럼 생성                |
|                     | `GET /api/dynamic-schema/tables/:projectId`                 | 프로젝트 테이블 목록 조회                   |
| **동적 데이터**     | `GET, POST /api/dynamic-data/:projectId/:tableName`         | 동적 레코드 조회 및 추가                    |
|                     | `PATCH, DELETE /api/dynamic-data/:projectId/:tableName/:id` | 레코드 수정 및 삭제                         |
| **워크플로우**      | `POST /api/workflow/execute`                                | 액션 체인 순차 실행                         |
| **컴파일/내보내기** | `POST /api/generator/compile?target=react`                  | 단일 화면 코드 컴파일                       |
|                     | `GET /api/export/:projectId/zip`                            | 프로젝트 전체 소스코드 zip 다운로드         |
| **Figma 가져오기**  | `POST /api/figma/import`                                    | Figma 링크 또는 fileKey를 캔버스 AST로 변환 |

---

## 🔍 검증 및 빌드 명령

```bash
# 클라이언트 타입 검사 및 프로덕션 빌드
pnpm build

# 백엔드 프로덕션 빌드
pnpm --dir server build
```
