# 🍞 BakeApp Engine (Backend Core)

> **BakeApp**은 비전공자도 코딩 없이 GUI만으로 풀스택 웹과 모바일 앱(iOS/Android)을 갓 구워내듯(Bake) 손쉽게 제작할 수 있도록 지원하는 노코드(No-Code) 앱 빌더의 핵심 백엔드 엔진입니다.

---

## 📸 Key Features

- **Dynamic Schema Migration (동적 DDL 엔진)**: 비전공자가 GUI에서 데이터베이스 구조를 변경하면 PostgreSQL DB에 테이블(`CREATE TABLE`)과 컬럼(`ALTER TABLE`)을 동적으로 반영합니다.
- **Dynamic Data Engine (동적 CRUD API)**: 생성된 동적 테이블에 대해 파라미터화된 쿼리를 사용하여 SQL Injection 없이 안전한 CRUD(Create, Read, Update, Delete) API를 즉시 제공합니다.
- **Multi-Platform Code Generator (UI 컴파일러)**: 빌더에서 생성된 표준 JSON AST(Abstract Syntax Tree)를 해석하여 **React Native (.tsx)** 및 **React Web (.tsx)** 소스 코드로 각각 컴파일합니다.
- **OpenAPI / Swagger 지원**: 개발 및 테스트를 손쉽게 진행할 수 있도록 모든 API 스펙을 대화형 Swagger UI로 자동 제공합니다.

---

## 🛠 Tech Stack

- **Framework**: Node.js, NestJS (TypeScript)
- **Database**: Supabase (PostgreSQL)
- **Database Client**: `pg` (Direct Connection for Dynamic DDL), `@supabase/supabase-js`
- **Runner / Compiler**: `tsx`, `nodemon`
- **Documentation**: Swagger (`@nestjs/swagger`)

---

## 📁 Architecture Overview

```text
bake/
├── src/                     # React 기반 노코드 편집기
│   ├── components/          # 캔버스, 팔레트, 속성 및 코드 미리보기 UI
│   └── store/               # 편집기 상태 관리
├── server/
│   ├── src/
│   │   ├── config/
│   │   │   └── supabase.service.ts
│   │   ├── modules/
│   │   │   ├── database/       # PostgreSQL 연결 및 트랜잭션
│   │   │   ├── auth/           # 인증, RBAC 및 RLS
│   │   │   ├── dynamic-schema/ # 동적 DDL 생성기
│   │   │   ├── dynamic-data/   # 동적 CRUD 엔진
│   │   │   ├── generator/      # React Native/Web 컴파일러
│   │   │   ├── schema/         # 스키마 레지스트리 및 동적 Swagger
│   │   │   └── workflow/       # 액션 워크플로우 실행기
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── .env                 # 서버 환경변수 (Git 제외)
│   ├── nodemon.json
│   └── package.json
├── package.json
└── vite.config.ts
```
