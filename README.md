# 🍞 BakeApp Studio

BakeApp Studio는 PostgreSQL 기반 내부 업무 도구를 시각적으로 설계하는 노코드 앱 빌더 프로토타입입니다. 로그인한 사용자가 프로젝트를 만들고, 화면을 편집하며, 프로젝트별 테이블과 데이터를 연결할 수 있습니다.

## 현재 구현 범위

- **인증과 프로젝트**
  - 자체 이메일/비밀번호 로그인과 JWT 기반 브라우저 세션 확인
  - 프로젝트 생성·조회·이름 변경·삭제
  - `owner`, `editor`, `viewer` 멤버 역할
- **프로젝트 저장**
  - 페이지 AST와 API 정의를 프로젝트 문서(JSONB)로 저장·복원
  - 변경됨 표시와 1초 디바운스 자동 저장
- **화면 편집**
  - `View`, `Text`, `Button`, `TextInput`, `Data List` 드래그 앤 드롭
  - 페이지 추가·삭제, 속성·스타일 편집, 미리보기
- **데이터**
  - 프로젝트별 PostgreSQL 테이블·컬럼 생성
  - 테이블/컬럼 목록, 최근 레코드 5건 미리보기, 동적 레코드 등록
  - `Data List`가 미리보기 모드에서 테이블 레코드를 표시
- **기존 엔진**
  - 동적 CRUD API, 워크플로우 실행기, React/React Native 코드 생성, Swagger

## 기술 스택

- Frontend: React, TypeScript, Vite, Zustand, Tailwind CSS
- Backend: NestJS, TypeScript
- Database: PostgreSQL
- Authentication: NestJS 자체 인증, scrypt 비밀번호 해시, HS256 JWT
- Database access: `pg`

## 시작하기

### 1. 의존성 설치

```bash
pnpm install
pnpm --dir server install
```

### 2. 환경 변수 설정

`server/.env` 파일을 만들고 실제 비밀값은 저장소에 커밋하지 마세요.

```env
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=at_least_32_characters_long_random_secret
PORT=3000
```

`DATABASE_SSL=true`은 TLS 연결이 필요한 경우에만 추가하세요. `JWT_SECRET`은 운영 환경에서 반드시 충분히 긴 임의 값으로 설정하며, 저장소에 커밋하지 않습니다.

프론트가 다른 서버 주소를 사용해야 하면 루트에 `.env.local`을 만들 수 있습니다.

```env
VITE_API_BASE_URL=http://localhost:3000
```

### 3. 데이터베이스 마이그레이션

PostgreSQL 클라이언트 또는 사용하는 PostgreSQL 마이그레이션 도구에서 아래 파일을 **순서대로 한 번씩** 실행합니다.

1. `server/migrations/20260831_create_users.sql`
2. `server/migrations/20260901_create_projects.sql`
3. `server/migrations/20260901_create_project_documents.sql`
4. `server/migrations/20260901_create_project_members.sql`
5. `server/migrations/20260902_disable_legacy_dynamic_table_rls.sql` (기존 설치 환경만)

이 마이그레이션은 `users`, `projects`, `project_documents`, `project_members` 테이블을 생성합니다. 프로젝트 권한은 Supabase RLS가 아닌 백엔드의 인증 가드와 프로젝트 권한 검사로 처리합니다.

### Docker로 전체 백엔드 실행

PostgreSQL을 로컬에 설치하거나 `DATABASE_URL`을 직접 구성하지 않아도 됩니다.

```bash
docker compose up --build
```

Compose는 PostgreSQL, API, 마이그레이션 초기화를 함께 실행합니다. API는 `http://localhost:3000/api`에서 사용할 수 있고, DB 데이터는 Docker 볼륨 `postgres-data`에 보관됩니다.

기본 계정 정보와 JWT 키는 **개발용**입니다. 운영 환경에서는 `POSTGRES_PASSWORD`, `DATABASE_URL`, `JWT_SECRET`을 안전한 배포 환경의 시크릿으로 설정하세요. 초기화 SQL은 빈 볼륨에서만 실행되므로, 이미 생성된 DB에는 새 마이그레이션을 별도로 적용해야 합니다.

### 4. 개발 서버 실행

```bash
pnpm dev
```

- Frontend: Vite가 출력하는 주소(기본값 `http://localhost:5173`)
- Backend / Swagger: `http://localhost:3000/api`

## 사용 흐름

1. `POST /api/auth/signup`으로 계정을 생성한 뒤 해당 이메일과 비밀번호로 로그인합니다.
2. 프로젝트 대시보드에서 예: `재고 관리` 프로젝트를 만듭니다.
3. 빌더에서 **DB Builder**를 열고 예: `products` 테이블과 `title`, `price` 컬럼을 만듭니다.
4. DB Builder의 테이블을 선택해 레코드를 등록하고 미리보기로 확인합니다.
5. 팔레트에서 **Data List**를 캔버스에 추가합니다.
6. 속성 패널에서 테이블 이름(`products`)과 표시 컬럼(`title`)을 설정합니다.
7. **Live Preview**에서 실제 레코드를 확인합니다. 편집 내용은 자동 저장됩니다.

## 권한 기준

| 역할   | 프로젝트/문서 조회 | 문서·테이블·레코드 변경 | 멤버 관리·프로젝트 삭제 |
| ------ | ------------------ | ----------------------- | ----------------------- |
| owner  | 가능               | 가능                    | 가능                    |
| editor | 가능               | 가능                    | 불가                    |
| viewer | 가능               | 불가                    | 불가                    |

동적 스키마와 CRUD API는 인증 토큰 및 프로젝트 권한을 확인합니다. 다른 프로젝트 ID를 임의로 넣어도 접근할 수 없습니다.

## 주요 API

모든 프로젝트·동적 데이터 API는 `Authorization: Bearer <access-token>` 헤더가 필요합니다.

| 목적                         | 메서드 / 경로                                                       |
| ---------------------------- | ------------------------------------------------------------------- |
| 프로젝트 생성·목록           | `POST`, `GET /api/projects`                                         |
| 프로젝트 상세·이름 변경·삭제 | `GET`, `PATCH`, `DELETE /api/projects/:id`                          |
| 편집 문서 조회·저장          | `GET`, `PUT /api/projects/:id/document`                             |
| 멤버 조회·추가/역할 변경     | `GET`, `POST /api/projects/:id/members`                             |
| 테이블 생성·컬럼 추가        | `POST /api/dynamic-schema/table`, `POST /api/dynamic-schema/column` |
| 프로젝트 테이블 목록         | `GET /api/dynamic-schema/tables/:projectId`                         |
| 동적 레코드 CRUD             | `/api/dynamic-data/:projectId/:tableName`                           |

전체 API 명세는 Swagger에서 확인할 수 있습니다.

## 검증 명령

```bash
pnpm build
pnpm --dir server build
```

현재 자동화된 E2E 테스트는 아직 없습니다. 위의 “사용 흐름”을 따라 로그인, 프로젝트 생성, 테이블/레코드 생성, `Data List` 미리보기를 수동으로 확인할 수 있습니다.

## 프로젝트 구조

```text
bake/
├── src/
│   ├── components/          # 로그인, 프로젝트 대시보드, 캔버스, DB Builder
│   └── store/               # 인증, 프로젝트, 편집 문서, 페이지/API 상태
├── server/
│   ├── migrations/          # Supabase/PostgreSQL 마이그레이션 SQL
│   └── src/modules/
│       ├── auth/            # Supabase 인증과 권한 검증
│       ├── project/         # 프로젝트, 멤버, 편집 문서
│       ├── dynamic-schema/  # 프로젝트별 테이블/컬럼 생성 및 목록
│       ├── dynamic-data/    # 프로젝트별 CRUD API
│       ├── workflow/        # 워크플로우 실행
│       └── generator/       # 코드 생성
└── docs/                    # 제품 계획과 분석 문서
```

## 다음 우선순위

- `Data List`의 테이블·컬럼을 수동 입력 대신 선택 목록으로 설정
- 폼 컴포넌트와 Create/Update/Delete 워크플로우 연결
- API 정의와 워크플로우 편집 상태까지 프로젝트 문서로 완전 저장
- Preview/Published 분리 및 웹 배포 파이프라인
