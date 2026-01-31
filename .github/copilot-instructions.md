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

## Architecture

Backend as Authority + Rich Permission Flags. The backend computes and returns granular permission flags on every entity. The frontend uses these flags to enable/disable UI actions, ensuring consistent permission enforcement.

Optimistic UI Updates with Rollback. The frontend immediately reflects user actions in the UI for responsiveness, while performing API calls in the background. On API failure, the UI rolls back to the previous state and shows an error toast.

## Sprint Board Drag & Drop

The sprint view (`dashboard/sprints/[id]/page.tsx`) uses HTML5 drag and drop:

- Tasks can be dragged between columns (TODO, INPROGRESS, VERIFY, DONE)
- Backlog tasks can be dragged to sprint columns (must go to TODO first)
- Empty sprint states must include drop zones for backlog tasks
- Use `storyId: -1` for drop zones not associated with a specific story

### Task status in future sprints

- Tasks can be moved from backlog to a future sprint (status becomes TODO)
- Tasks in a future sprint (DRAFT status) cannot change from TODO until the sprint becomes ACTIVE
- Tasks in a FUTURE sprint can only be moved to the backlog (not to another sprint)
- The backend will return an error if attempting to change status in a future-only sprint

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


### Sprint and task mechanics

## Sprint view

- The view shows tasks assigned to the sprint
- The structure show a left collapsible panel with the backlog and a main area with the sprint board
- The main area has 4 columns: TODO, INPROGRESS, VERIFY, DONE
- Each column shows the tasks assigned to that status
- Tasks of type USER_STORY are shown as parent tasks in a lane spaning all the 4 columns with their subtasks nested inside. They are collapsible
- The lanes that show USER_STORY assigned to the current Sprint will have right to the title, a list of badges indicating all the sprints where this USER_STORY has subtasks assigned. This is to give a visual clue that some subtasks are in other sprints.
- Tasks of type TASK and BUG are shown as individual cards inside the corresponding column

# Drag and Drop mechanics

- Tasks in the backlog:
  - Tasks in the backlog can be dragged to the sprint board, only if the sprint endDate is in the future
  - The task is assigned to the current sprint (we are in a sprint view) and its status is set to TODO

- Tasks in the sprint board:
  - Tasks of type TASK and BUG can be dragged between columns (TODO, INPROGRESS, VERIFY, DONE)
  - Tasks in PAST sprints cannot be dragged to change its status betwen TODO, INPROGRESS, VERIFY, DONE
  - Tasks in the ACTIVE or FUTURE sprint can be dragged back to the backlog. Conditions: 
    - USER_STORY: all its subtasks must be in TODO state. All its subtask are moved to backlog as well
    - TASK or BUG with no parent: its status must be TODO
    - Subtask (TASK or BUG with parent): cannot be moved to backlog individually - must move the parent USER_STORY instead
  - Tasks of any type in a FUTURE sprint cannot change their status from TODO to any other status until the sprint becomes ACTIVE


## Task View

- The task view shows the details of a task
- The view shows:
  - Title
  - Description (markdown supported)
  - Project
  - Sprint, considering that:
    - Tasks of type TASK and BUG must only have 1 sprint assigned maximum
    - Tasks of type USER_STORY shows a list of sprints where its subtasks are assigned
  - Type (USER_STORY, TASK, BUG)
  - Status (TODO, INPROGRESS, VERIFY, DONE)
  - Assignee (user assigned to the task)
  - Parent task (if any)
  - Subtasks (if any)
- The task can be edited by:
  - Only by a PROFESSOR assigned to the corresponding project or a STUDENT assigned to the Task
  - If the task is frozen, only a PROFESSOR assigned to the corresponding project can edit it
  - If a Task of type TASK or BUG is in a PAST sprint, it cannot be edited, except:
    - STUDENT assigned can edit the sprint to move it to ACTIVE or FUTURE sprint
    - PROFESSOR users assigned to the corresponding project can edit all
- The following fields can be edited:
  - Changing the title
  - Changing the description
  - Changing the type. Restrictions:
    - A USER_STORY cannot be changed of type
    - A TASK cannot be changed to USER_STORY if it has a parent
    - A BUG can never have its type changed
  - Changing the status
  - Changing the assignee. Only PROFESSOR and assignee can unssign a Task
  - Changing the Sprint. Restrictions:
    - Only of tasks of type TASK or BUG
    - Only tasks in TODO, INPROGRESS and  VERIFY status can change sprint
    - A task can only be assigned to a sprint that belongs to the same project as the task
    - A task in a FUTURE sprint can only moved to the backlog
    - A task can only be assigned to a sprint that is ACTIVE or FUTURE (not PAST)
  - There will be a delete button in the task view to delete the task. Restrictions:
    - Only by a PROFESSOR assigned to the corresponding project or a STUDENT assigned to the Task
    - A USER_STORY can only be deleted if it has no subtasks
    - A TASK or BUG can be deleted only if its state is TODO or INPROGRESS
    - Asks for confirmation before deleting

## Task creation
- Tasks can be created in three ways:
  - In the Sprint View, from the backlog panel with a "+" button in the header of the panel
  - In the task view, only for subtasks of a USER_STORY, with the "Add subtask" button in the subtasks section
  - In the Tasks list view, with the "Add task" button in the header of the page

- When creating a task in the Sprint View backlog panel:
  - The task is created in BACKLOG state
  - The task is not assigned to any sprint
  - The task can be of any type (USER_STORY, TASK, BUG)

- When creating a subtask in the Task View of a USER_STORY:
  - The task is created as a subtask of the USER_STORY
  - The type of the task can only be TASK or BUG
  - The task status will be:
    - If the USER_STORY is in BACKLOG state, the subtask is created in BACKLOG state
    - If the USER_STORY is assigned to a sprint, the subtask is created in TODO state
  - The task sprint will be:
    - None if the USER_STORY is in BACKLOG state
    - The most modern sprint where the parent USER_STORY has other subtasks assigned. If no subtasks exist, the task is not assigned to any sprint
  - The user can choose the task to be assigned to another sprint, provided that the sprint is ACTIVE or FUTURE

- When creating a task in the Tasks list view:
  - Same conditions as creating a task in the Sprint View backlog panel

## Permissions
- All the actions that modify an existing task (drag and drop, edit, create subtask, sprint change) can only be done by:
  - a PROFESSOR assigned to the corresponding project (it owns the course of the project)
  - a STUDENT assigned to the Task

