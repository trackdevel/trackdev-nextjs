# TrackDev — Frontend (Next.js)

## Summary

Full-stack TypeScript monorepo for **TrackDev**, an educational project-management platform for academic environments. It houses the Next.js web app and the shared TypeScript packages it builds on, all consuming the separate TrackDev Spring Boot REST API.

## Technical details

- **Stack:** TypeScript, Next.js 16 (App Router, Turbopack), React 19, Tailwind CSS 4.
- **Tooling:** pnpm workspace (Node ≥ 22, pnpm ≥ 10); shared packages built with `tsup`.
- **Layout:** `apps/web` (dashboard app) + `packages/types` (entity/DTO/enum definitions), `packages/api-client` (typed REST client, React hooks, auth context, SSE), and `packages/ui` (hooks, formatting utils, display constants). Dependency flow: `types` → (`api-client`, `ui`) → `web`.
- **Architecture:** backend-as-authority with permission flags on entities; optimistic UI with rollback; API errors via shared Toast, form validation inline; i18n (en/ca/es) via `next-intl`; drag-and-drop sprint board via `@dnd-kit`.
- **Run:** `pnpm build:all` then `pnpm dev:web` (port 3100); requires the Spring backend reachable via `NEXT_PUBLIC_API_URL`.

## Features

- Log in / reset password with JWT auth and role-based access (Admin, Professor, Student).
- Manage subjects, courses, email invitations, and enrolled students.
- Manage team projects and their linked GitHub repositories.
- Plan sprints from reusable patterns and run a drag-and-drop board (Backlog → To Do → In Progress → Verify → Done) with real-time updates.
- Track tasks (user stories, tasks, bugs) with subtasks, estimation points, assignees, comments, and linked pull requests.
- Define profile attributes and record/review their values for students, tasks, and PRs; run points reviews.
- View analytics, project analysis, PR analysis, and generate reports.
