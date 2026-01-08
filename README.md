# TrackDev Monorepo

Full-stack TypeScript monorepo for TrackDev educational project management platform. Includes Next.js web app and shared TypeScript packages that consume the Spring Boot REST API.

## ✨ Features

TrackDev is a comprehensive educational project management platform designed for academic environments:

### Core Functionality

- **Project Management**: Create and manage team-based software projects within academic courses
- **Agile Task Tracking**: Full task lifecycle management with user stories, bugs, and subtasks
- **Sprint Planning**: Define sprint patterns and apply them to projects with automatic sprint creation
- **Team Collaboration**: Assign tasks, track progress, and manage team member responsibilities

### User Roles

- **Admin**: System-wide management and oversight
- **Professor**: Course creation, project setup, student enrollment, and grade management
- **Student**: Project participation, task management, and team collaboration

### Key Features

- **Course & Subject Management**: Organize courses by academic subjects and years
- **Task Hierarchy**: Support for user stories with child tasks and bugs
- **Sprint Patterns**: Reusable sprint templates that can be applied to multiple projects
- **Estimation & Tracking**: Story points, task status tracking, and progress monitoring
- **Course Invitations**: Email-based invitation system for student enrollment
- **GitHub Integration**: Link tasks to pull requests and repositories
- **Secure Authentication**: JWT-based authentication with role-based access control
- **Real-time Updates**: Track task changes, comments, and project activity

## 📦 Project Structure

```
trackdev3/
├── apps/
│   └── web/             # Next.js 16 with App Router
├── packages/
│   ├── api-client/      # Shared API client with React hooks
│   ├── types/           # TypeScript interfaces (entities, DTOs)
│   └── ui/              # Shared utilities and hooks
```

## 🔧 Tech Stack

### Frontend App

- **Web**: Next.js 16.1.1, React 19.2.3, Tailwind CSS 3.4

### Shared Packages

- **TypeScript**: 5.3.3
- **Build Tools**: tsup 8.0.1, pnpm 9.15.0
- **API**: REST client with React Query patterns

### Backend ([trackdev2-spring](https://github.com/trackdevel/trackdev2-spring))

- **Spring Boot**: 3.5.9
- **Java**: 21 LTS
- **Database**: MySQL
- **Auth**: JWT (jjwt)
- **Docs**: Springdoc OpenAPI 2.x

## 🚀 Getting Started

### Prerequisites

- **Node.js**: >= 18.0.0
- **pnpm**: >= 8.0.0 (install: `npm install -g pnpm`)
- **Java**: 21 (for backend API)
- **MySQL**: Running instance (for backend)

### Step 1: Install Dependencies

```bash
# Clone repository
git clone <repo-url>
cd trackdev3

# Install dependencies
pnpm install

# Build shared packages (required before running apps)
pnpm build:packages
```

### Step 2: Start Backend API

The frontend app requires the Spring Boot API to be running.

**Windows PowerShell:**

```powershell
cd ../trackdev2-spring
.\scripts\run-server.ps1
```

**Linux/macOS:**

```bash
cd ../trackdev2-spring
./scripts/run-server.sh
```

API will be available at `http://localhost:8080`

### Step 3: Configure Frontend App

**Web App:**

```bash
# Create .env.local (or use default localhost:8080)
echo "NEXT_PUBLIC_API_URL=http://localhost:8080" > apps/web/.env.local
```

### Step 4: Run Web App

```bash
pnpm dev:web
# Opens at http://localhost:3000
```

## 📦 Shared Packages

### @trackdev/types

TypeScript interfaces matching Spring Boot entities and DTOs:

```typescript
import { User, Project, Task, Sprint, Course } from "@trackdev/types";
```

### @trackdev/api-client

Centralized API client with React hooks for data fetching:

```typescript
import {
  authApi,
  projectsApi,
  tasksApi,
  useQuery,
  useMutation,
  useAuth,
  AuthProvider,
} from "@trackdev/api-client";

// Wrap app with AuthProvider
<AuthProvider baseUrl="http://localhost:8080">
  <App />
</AuthProvider>;

// Use hooks for queries
const { data, isLoading, error } = useQuery(() => projectsApi.getAll());

// Use hooks for mutations
const { mutate, isLoading } = useMutation(authApi.login);
```

### @trackdev/ui

Shared utilities, hooks, and constants:

```typescript
import {
  cn, // Tailwind class merger
  formatDate, // Date formatting
  formatRelativeTime, // "2 hours ago"
  useForm, // Form management
  useDebounce, // Debounced values
  TASK_STATUS_CONFIG, // Status configurations
} from "@trackdev/ui";
```

## 🔐 Authentication

JWT-based authentication with the Spring Boot backend:

1. User logs in via `POST /auth/login` with email/password
2. JWT token returned and stored in `localStorage`
3. `AuthProvider` manages auth state and token refresh
4. Token automatically included in all API requests

**Login Example:**

```typescript
const { mutate: login } = useMutation(authApi.login);

login(
  { email: "user@example.com", password: "password" },
  {
    onSuccess: (data) => {
      // Token stored automatically
      console.log("Logged in:", data.user);
    },
  }
);
```

## 🔗 Backend API

Frontend connects to TrackDev Spring Boot API (must be running on `localhost:8080`).

**Key Endpoints:**

| Method | Endpoint         | Description               |
| ------ | ---------------- | ------------------------- |
| POST   | `/auth/login`    | Login with email/password |
| GET    | `/auth/self`     | Get current user info     |
| GET    | `/projects`      | List user's projects      |
| GET    | `/projects/{id}` | Get project details       |
| GET    | `/tasks`         | List tasks (with search)  |
| PATCH  | `/tasks/{id}`    | Update task               |
| GET    | `/sprints`       | List sprints              |
| GET    | `/courses`       | List courses              |

Full API documentation available at `http://localhost:8080/swagger-ui.html` when backend is running.

## 🛠️ Development Scripts

| Command               | Description                  |
| --------------------- | ---------------------------- |
| `pnpm dev:web`        | Start Next.js web app        |
| `pnpm build:packages` | Build all shared packages    |
| `pnpm build:web`      | Build web app for production |
| `pnpm build:all`      | Build packages + web app     |
| `pnpm lint`           | Lint all workspaces          |
| `pnpm typecheck`      | TypeScript type checking     |
| `pnpm clean`          | Clean all build outputs      |

## 🔨 Common Development Tasks

### After pulling latest code

```bash
pnpm install              # Update dependencies
pnpm build:packages       # Rebuild shared packages
```

### Adding dependencies

```bash
# Add to specific app/package
pnpm --filter @trackdev/web add package-name

# Add to workspace root (dev tools)
pnpm add -w -D package-name
```

### Watching packages during development

```bash
# Watch types package for changes
pnpm --filter @trackdev/types dev

# Watch api-client package
pnpm --filter @trackdev/api-client dev
```

### TypeScript issues

If you get type errors after package changes:

```bash
pnpm build:packages       # Rebuild all packages
pnpm typecheck           # Verify types
```

## 📱 Building for Production

### Web App

```bash
pnpm build:web
# Output: apps/web/.next/

# Test production build locally
cd apps/web
pnpm start
```

## 🧩 Project Conventions

- **DTO naming**: Matches backend (e.g., `TaskBasicDTO`, `ProjectCompleteDTO`)
- **Entity types**: Mirror Spring Boot entities with proper relationships
- **API methods**: RESTful naming (`getAll`, `getById`, `create`, `update`, `delete`)
- **Hooks**: Follow React Query patterns (`useQuery`, `useMutation`)
- **Error handling**: Centralized in API client with proper types

## 📚 Documentation

- **Backend API**: `../trackdev2-spring/.github/copilot-instructions.md`
- **Endpoints**: `../trackdev2-spring/docs/endpoints.md`
- **Swagger UI**: `http://localhost:8080/swagger-ui.html` (when API running)

## 🤝 Related Projects

- [TrackDev Spring Boot API](../trackdev2-spring/README.md) - Backend REST API
- [Next.js Documentation](https://nextjs.org/docs)

## 📄 License

MIT
