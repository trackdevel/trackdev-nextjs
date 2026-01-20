## Page structure

When creating new pages, follow the established structure used in the project. Typically, a page component should be placed in the `app` directory (depending on the Next.js version) and should include:

The web app (at `apps/web/src/app`) has the following structure:

- Dashboard pages under `dashboard/`
- Component pages under `components/`
- Internationalization files under `i18n`

## Component usage

Try always to use already existing components from the codebase when applicable instead of creating new ones. This ensures consistency across the application and reduces redundancy. For example, use existing UI components for select, buttons, forms, and layouts.

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
