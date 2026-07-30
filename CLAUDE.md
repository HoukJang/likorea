# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Long Island Korea (likorea) is a community website for Korean residents in the Long Island, NY area. The project consists of a React frontend and Node.js/Express backend with MongoDB database.

## Common Development Commands

### Development
```bash
# Start both frontend and backend in development mode
npm run dev

# Or run separately:
cd backend && npm run dev  # Backend on port 5001
cd frontend && npm start   # Frontend on port 3000
```

### Testing
```bash
# Run all tests
npm test

# Backend tests only
cd backend && npm test

# Specific test categories
npm run test:auth       # Authentication tests
npm run test:boards     # Board functionality tests
npm run test:comments   # Comment system tests
npm run test:security   # Security tests
npm run test:validation # Input validation tests

# Single backend test file
cd backend && npm test -- tests/api/basic.test.js

# Frontend tests
cd frontend && npm test -- --watchAll=false

# Test coverage
cd backend && npm run test:coverage
```

### Linting
```bash
# Run ESLint on both frontend and backend
npm run lint

# Auto-fix linting issues
npm run lint:fix

# Backend only
cd backend && npm run lint:fix

# Frontend only
cd frontend && npm run lint:fix
```

### Building & Deployment
```bash
# Build frontend for production
cd frontend && npm run build

# Deploy to production
./deploy.sh production

# Deploy with force (skip test failures)
./deploy.sh production --force

# Deploy with database initialization
./deploy.sh production --init-db

# Combine options: force deploy with DB initialization
./deploy.sh production --force --init-db

# Development deployment
./deploy.sh development

# Alternative: Use npm scripts
npm run deploy:prod   # Production deployment
npm run deploy:dev    # Development deployment
```

### Database Management
```bash
# Initialize database with sample data (WARNING: Deletes all existing data)
cd backend && node utils/initDB.js

# Setup development database with test data
cd backend && node utils/setupDevDB.js

# Alternative: Use npm script for dev setup
npm run setup:dev
```

### Version Management
```bash
# Sync version across all package.json files
npm run version:sync

# Bump version
npm run version:bump:patch  # 1.0.0 -> 1.0.1
npm run version:bump:minor  # 1.0.0 -> 1.1.0
npm run version:bump:major  # 1.0.0 -> 2.0.0
```

## Architecture Overview

### Backend Structure
The backend follows an MVC pattern with clear separation of concerns:

- **Controllers** (`backend/controllers/`): Handle HTTP requests and responses
  - `authController.js`: Authentication logic (login, logout, refresh)
  - `userController.js`: User management (CRUD operations)
  - `boardController.js`: Board posts management
  - `commentController.js`: Comment system
  - `adminController.js`: Admin-specific operations
  - `tagController.js`: Tag management for 495 highway exits

- **Models** (`backend/models/`): MongoDB schemas using Mongoose
  - User model with 5-level authority system (1-5, where 5 is admin)
  - BoardPost model with tag system for regions (495 highway exits)
  - Comment model with nested structure support
  - Counter model for sequential post IDs
  - Tag model for categorization

- **Middleware** (`backend/middleware/`):
  - `auth.js`: JWT token verification and user authentication
  - `errorHandler.js`: Centralized error handling
  - `validation.js`: Input validation using custom validators
  - `security.js`: Security headers and rate limiting

- **Routes** (`backend/routes/`): RESTful API endpoints organized by resource

### Frontend Structure
The frontend is a React SPA with React Router v6:

- **Components** (`frontend/src/components/`):
  - `common/`: Reusable components (Header, Footer, Pagination, etc.)
  - Feature-specific components organized by function

- **Hooks** (`frontend/src/hooks/`):
  - `useApi.js`: Centralized API call handling with error management
  - `useAuth.js`: Authentication state management
  - `useTags.js`: Tag system management

- **Pages** (`frontend/src/pages/`): Top-level route components

- **API Client** (`frontend/src/api/`): Centralized API communication layer

## Key Features & Implementation Details

### Authentication System
- JWT-based authentication with refresh tokens
- 5-level authority system:
  - Level 1-2: Basic users
  - Level 3: Regular users
  - Level 4: Moderators
  - Level 5: Administrators
- Token storage in httpOnly cookies for security

### Tag System
- Region-based tags using 495 highway exit numbers (0-73)
- Category tags: 사고팔고, 부동산, 모임, 문의, 잡담, 기타
- Implemented via `initTags.js` for consistent initialization

### Board System
- Multiple board types (general, notice)
- Rich text editor support with HTML sanitization
- View count tracking with duplicate prevention
- Pagination with configurable page size

### Security Measures
- Input validation on all endpoints
- XSS prevention via sanitize-html
- Rate limiting to prevent abuse
- CORS configuration for allowed origins
- Security headers via custom middleware

## Development Guidelines

### Code Style
- ESLint configured in warning mode for gradual adoption
- Follow SOLID principles for new code
- Use 2-space indentation
- Semicolons required
- Single quotes for strings, double quotes for JSX attributes
- See `/docs/development/CODING_STYLE_GUIDE.md` for full guidelines

### Environment Variables
Backend requires:
- `MONGO_URI`: MongoDB connection string
- `JWT_SECRET`: JWT signing secret
- `ALLOWED_ORIGINS`: Comma-separated list of allowed CORS origins
- `NODE_ENV`: development/production
- `PORT`: Server port (default 5001)

Frontend requires:
- `REACT_APP_BACKEND_URL`: Backend API URL
- `REACT_APP_ENV`: development/production

### Testing Approach
- Backend: Jest with Supertest for API testing
- Frontend: React Testing Library with Jest
- Test files located in `__tests__` directories
- Coverage reports available via `npm run test:coverage`

### Deployment Process
The `deploy.sh` script handles:
1. Git status verification
2. Dependency installation
3. Environment variable validation
4. Code quality checks (ESLint)
5. Test execution (can be skipped with --force)
6. Frontend build
7. Optional database initialization (--init-db)
8. PM2 process management (production)
9. Nginx configuration (production)
10. SSL certificate management (production)

## Growth Harness (트래픽 성장 작업)

트래픽/성장 관련 작업(측정, SEO, 유입 기능 구현)은 전용 하네스를 사용합니다:

- **상태 파일**: `.claude/growth/STATE.md` — 백로그·지표·완료 이력의 단일 소스. 성장 작업 시작 시 이 파일을 먼저 읽고, 종료 시 반드시 갱신. 리포 전체 재분석 금지.
- **스킬**: `/growth` (다음 백로그 항목 구현), `/traffic-report` (지표 수집·리포트), `/seo-audit` (SEO 인프라 점검)
- **에이전트**: `traffic-analyst`(haiku, 수집), `seo-auditor`(haiku, 점검), `growth-engineer`(sonnet, 구현) — 기계적 작업은 저비용 모델에 위임하고 해석·리뷰만 메인 모델이 수행

## Content Pipeline

식당 리뷰, 뉴스, 생활정보 등 콘텐츠 생성 요청 시 반드시 팀 파이프라인을 사용합니다.

### 워크플로우
1. `TeamCreate`로 content 팀 생성
2. `content-lead` 에이전트를 오케스트레이터로 spawn
3. content-lead가 순차적으로 진행:
   - `researcher` → 데이터 수집 (WebSearch, Google Places 등) → `research.json`
   - `fact-checker` → 소스 URL 대조 검증 → `fact-check.json`
   - `writer` → 한국어 포스트 작성 → `draft.json`
   - `reviewer` → 품질 검증 → `review.json`
4. 최종 출력: Word(.docx) 파일로 저장 (DB 저장 금지)

### 에이전트 정의
- 커스텀 에이전트: `.claude/agents/` 디렉토리 참조
- 작업 공간: `.content-workspace/{task-id}/`

### 스타일 가이드
- 맛집 리뷰: 블로그 스타일, 해당 식당의 실제 사진만 첨부 (스톡/다른 식당 사진 금지, 없으면 미첨부)
- 출력 형식: 항상 Word(.docx) 파일 — DB 직접 저장 금지

### 금지 사항
- 콘텐츠 생성을 위한 독립 스크립트 작성 금지
- 메인 에이전트가 직접 데이터 수집/포스트 작성 금지
- 반드시 팀 에이전트를 통해 처리할 것
- `createContentPost.js`로 DB 직접 저장 금지

## Important Notes

- The project uses a custom validation middleware instead of external libraries
- Prettier has been removed; rely on ESLint for code formatting
- MongoDB Atlas is used for both development and production
- The tag system is based on Long Island's 495 highway exits for regional categorization
- Admin credentials after DB init: username: `likorea`, password: `FhddkfZhfldk`
- Test users in development: `testuser1-3` with password: `password`
- Current project version: 1.6.1 (backend), 1.1.1 (root package.json)
- Node.js version requirement: >=18.0.0
- Backend runs on port 5001, frontend on port 3000
- Max upload size: 10MB (configured in Express, requires matching Nginx configuration in production)
- Images are stored as base64 in database (no server-side compression currently)

## Project Documentation

Comprehensive documentation is available in the `/docs` directory:

### 📚 Documentation Index
- **[DOCUMENTATION_INDEX.md](/docs/DOCUMENTATION_INDEX.md)**: Complete documentation guide and index

### 📖 Core Documentation
1. **[PROJECT_STRUCTURE.md](/docs/PROJECT_STRUCTURE.md)**: Overall project architecture and structure
2. **[API_DOCUMENTATION.md](/docs/API_DOCUMENTATION.md)**: Complete API reference with all endpoints
3. **[BACKEND_ARCHITECTURE.md](/docs/BACKEND_ARCHITECTURE.md)**: Detailed backend architecture and components
4. **[FRONTEND_ARCHITECTURE.md](/docs/FRONTEND_ARCHITECTURE.md)**: Frontend structure and React patterns
5. **[COMPONENT_REFERENCE.md](/docs/COMPONENT_REFERENCE.md)**: React component API reference
6. **[DATABASE_SCHEMA.md](/docs/DATABASE_SCHEMA.md)**: MongoDB schema definitions and relationships
7. **[UTILITIES_AND_HELPERS.md](/docs/UTILITIES_AND_HELPERS.md)**: Utility functions and helper documentation

### 🚀 Quick References
- **New to the project?** Start with [PROJECT_STRUCTURE.md](/docs/PROJECT_STRUCTURE.md)
- **Working on API?** Check [API_DOCUMENTATION.md](/docs/API_DOCUMENTATION.md)
- **Frontend development?** See [COMPONENT_REFERENCE.md](/docs/COMPONENT_REFERENCE.md)
- **Database changes?** Refer to [DATABASE_SCHEMA.md](/docs/DATABASE_SCHEMA.md)

### 📝 Documentation Guidelines
When making changes to the codebase:
1. Update relevant documentation in the `/docs` directory
2. Keep code examples in documentation up to date
3. Add new sections as features are implemented
4. Follow the documentation template in [DOCUMENTATION_INDEX.md](/docs/DOCUMENTATION_INDEX.md)

### 🤖 Bot System Documentation
- **[GOOGLE_PLACES_API.md](/docs/GOOGLE_PLACES_API.md)**: Google Places API integration guide
- **[RESTAURANT_BOT_INTEGRATION.md](/docs/RESTAURANT_BOT_INTEGRATION.md)**: Restaurant bot system with real data integration