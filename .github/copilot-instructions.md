## Page structure

When creating new pages, follow the established structure used in the project. Typically, a page component should be placed in the `app` directory (depending on the Next.js version) and should include:

The web app (at `apps/web/src/app`) has the following structure:

- Dashboard pages under `dashboard/`
- Component pages under `components/`
- Internationalization files under `i18n/messages/` (en.json, ca.json, es.json)

## Component usage

Try always to use already existing components from the codebase when applicable instead of creating new ones. This ensures consistency across the application and reduces redundancy. For example, use existing UI components for select, buttons, forms, and layouts.

## Internationalization (i18n)

When adding new user-facing text:

1. Add translations to all 3 language files: `apps/web/src/i18n/messages/en.json`, `ca.json`, `es.json`
2. Use the `useTranslations` hook with the appropriate namespace
3. Keep translation keys consistent and descriptive

## Display Names

When displaying user information, prefer `fullName` over `username`:

```tsx
{
  user.fullName || user.username;
}
```

## Sprint Board Drag & Drop

The sprint view (`dashboard/sprints/[id]/page.tsx`) uses HTML5 drag and drop:

- Tasks can be dragged between columns (TODO, INPROGRESS, VERIFY, DONE)
- Backlog tasks can be dragged to sprint columns (must go to TODO first)
- Empty sprint states must include drop zones for backlog tasks
- Use `storyId: -1` for drop zones not associated with a specific story

### Moving tasks back to backlog

Tasks can be dragged from the sprint board back to the backlog panel with these constraints:

- **USER_STORY**: Can only be moved back if ALL its subtasks are in TODO state
- **TASK or BUG (with no parent)**: Can only be moved back if status is TODO
- **Subtask (TASK or BUG with parent)**: Cannot be moved to backlog individually - must move the parent USER_STORY instead
- If validation fails, show appropriate error toast (e.g., "A task that has begun cannot go back to the backlog")
- When a USER_STORY is moved to backlog, all its child tasks are also moved to backlog

## Error Handling System

The application uses a standardized error handling system with two distinct patterns:

### 1. Toast Notifications for API Errors

All API/mutation errors should be displayed using the shared Toast system located in `@/components/ui/Toast`. The toast displays in the **top-right corner** of the screen.

**Usage Pattern:**

```tsx
import { useToast } from "@/components/ui/Toast";
import { ApiClientError } from "@trackdev/api-client";

function MyComponent() {
  const toast = useToast();

  const mutation = useMutation((data) => api.doSomething(data), {
    onSuccess: () => {
      toast.success("Operation completed successfully");
    },
    onError: (err) => {
      const errorMessage =
        err instanceof ApiClientError && err.body?.message
          ? err.body.message
          : "Default error message";
      toast.error(errorMessage);
    },
  });
}
```

**Available Toast Methods:**

- `toast.success(message)` - Green success notification
- `toast.error(message)` - Red error notification
- `toast.info(message)` - Blue info notification
- `toast.warning(message)` - Yellow warning notification

### 2. Inline Validation Errors for Forms

Form validation errors (client-side validation before API call) should remain inline with the form for better UX context. Use `validationError` state for this:

```tsx
const [validationError, setValidationError] = useState<string | null>(null);

const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  setValidationError(null);

  // Client-side validation
  if (!name.trim()) {
    setValidationError("Name is required");
    return;
  }

  // Only call API after validation passes
  mutation.mutate(data);
};

// In JSX:
{
  validationError && (
    <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
      {validationError}
    </div>
  );
}
```

### Key Principles

1. **API errors** → Always use `toast.error()` with message extracted from `ApiClientError.body?.message`
2. **Form validation** → Use inline `validationError` state with contextual display near the form
3. **Success feedback** → Use `toast.success()` for successful operations
4. **Never use `alert()`** → Always use the toast system for notifications
5. **Extract API messages** → Use `ApiClientError` to get the actual server error message instead of generic messages

### Files Reference

- Toast Component: `apps/web/src/components/ui/Toast.tsx`
- Toast Provider: Wraps the app in the root layout
- ApiClientError: Exported from `@trackdev/api-client`


### React 19

For React 19, the most “modern” patterns revolve around: server‑first architecture (RSC), actions+forms APIs, leaning on the compiler (less manual memoization), and carefully scoped state with custom hooks and minimal global stores.

1. Server‑first architecture
Prefer Server Components by default for data‑fetching and static/content‑heavy UI, and limit Client Components to interactive “islands” (forms, modals, complex widgets).

Combine RSC with streaming and Suspense to progressively render and hydrate, reducing JS shipped to the client and improving TTFB/LCP in professional apps.

2. Actions, forms, and optimistic UIs
Use the React 19 actions + useActionState / useFormStatus / useOptimistic hooks to model mutations declaratively instead of manual isLoading / error juggling in local state.

Adopt patterns where forms submit directly to async actions (often on the server), with optimistic updates making UIs feel instant while keeping error handling and rollback logic centralized.

3. Let the compiler work (component and render patterns)
Keep components small and focused, avoid excessive React.memo / useMemo / useCallback, and write straightforward render logic so the React 19 compiler can auto‑optimize re‑renders.

Favor pure components (no side effects in render), clear props, and composition over inheritance/HOCs; reserve HOCs and render props for rare cross‑cutting concerns not solvable with hooks.

4. Modern state management
Classify state into local, shared, server, and URL state; keep most state local, lift only when necessary, and use context sparingly for truly shared, relatively stable data.

For business‑heavy apps, prefer a thin global store (Zustand, Redux Toolkit, Jotai, etc.) only where you really need cross‑tree coordination; encapsulate domain logic in custom hooks and services rather than spreading it across components.

5. TypeScript, structure, and DX
Treat TypeScript as first‑class: strongly typed props, hooks, actions, and domain models, with interfaces/types co‑located near usage but reusable types extracted into domain modules.

Organize by feature/slice (feature‑first structure) instead of global “components/hooks/utils” buckets, and back this with linting, codemods, and React 19 upgrade tooling to keep a large professional codebase consistent over time.