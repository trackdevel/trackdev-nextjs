"use client";

interface SubjectFormData {
  name: string;
  acronym: string;
}

interface SubjectFormProps {
  data: SubjectFormData;
  onChange: (data: SubjectFormData) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  error?: { message: string } | null;
  submitLabel?: string;
  loadingLabel?: string;
}

export function SubjectForm({
  data,
  onChange,
  onSubmit,
  onCancel,
  isLoading = false,
  error,
  submitLabel = "Create",
  loadingLabel = "Creating...",
}: SubjectFormProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Name
        </label>
        <input
          type="text"
          value={data.name}
          onChange={(e) => onChange({ ...data, name: e.target.value })}
          placeholder="e.g., Software Engineering"
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-primary-500 focus:outline-hidden focus:ring-1 focus:ring-primary-500"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Acronym
        </label>
        <input
          type="text"
          value={data.acronym}
          onChange={(e) =>
            onChange({ ...data, acronym: e.target.value.toUpperCase() })
          }
          placeholder="e.g., SE"
          maxLength={5}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-primary-500 focus:outline-hidden focus:ring-1 focus:ring-primary-500"
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          2-5 characters
        </p>
      </div>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {error.message}
        </p>
      )}
      <div className="flex justify-end gap-3 pt-4">
        <button
          onClick={onCancel}
          className="rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          Cancel
        </button>
        <button
          onClick={onSubmit}
          disabled={!data.name || !data.acronym || isLoading}
          className="btn-primary disabled:opacity-50"
        >
          {isLoading ? loadingLabel : submitLabel}
        </button>
      </div>
    </div>
  );
}

interface CourseFormData {
  startYear: number;
  githubOrganization: string;
}

interface CourseFormProps {
  data: CourseFormData;
  onChange: (data: CourseFormData) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  error?: { message: string } | null;
  submitLabel?: string;
  loadingLabel?: string;
}

export function CourseForm({
  data,
  onChange,
  onSubmit,
  onCancel,
  isLoading = false,
  error,
  submitLabel = "Create",
  loadingLabel = "Creating...",
}: CourseFormProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Start Year
        </label>
        <input
          type="number"
          value={data.startYear}
          onChange={(e) =>
            onChange({
              ...data,
              startYear: parseInt(e.target.value) || new Date().getFullYear(),
            })
          }
          min={1900}
          max={9999}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:border-primary-500 focus:outline-hidden focus:ring-1 focus:ring-primary-500"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          GitHub Organization (optional)
        </label>
        <input
          type="text"
          value={data.githubOrganization}
          onChange={(e) =>
            onChange({ ...data, githubOrganization: e.target.value })
          }
          placeholder="e.g., my-org"
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-primary-500 focus:outline-hidden focus:ring-1 focus:ring-primary-500"
        />
      </div>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {error.message}
        </p>
      )}
      <div className="flex justify-end gap-3 pt-4">
        <button
          onClick={onCancel}
          className="rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          Cancel
        </button>
        <button
          onClick={onSubmit}
          disabled={!data.startYear || isLoading}
          className="btn-primary disabled:opacity-50"
        >
          {isLoading ? loadingLabel : submitLabel}
        </button>
      </div>
    </div>
  );
}
