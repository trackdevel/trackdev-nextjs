"use client";

import { projectsApi } from "@trackdev/api-client";
import type { Task } from "@trackdev/types";
import { useTheme } from "@/components/theme";
import { Link2, Loader2, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

const MDPreview = dynamic(
  () => import("@uiw/react-md-editor").then((mod) => mod.default.Markdown),
  { ssr: false },
);

// =============================================================================
// REFERENCE PICKER (dropdown content for the toolbar command)
// =============================================================================

interface ReferenceItem {
  type: "task" | "pr";
  label: string;
  link: string;
}

interface ReferencePickerProps {
  projectId: number;
  onSelect: (item: ReferenceItem) => void;
  onClose: () => void;
}

function ReferencePicker({ projectId, onSelect, onClose }: ReferencePickerProps) {
  const t = useTranslations("markdown");
  const [search, setSearch] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    projectsApi
      .getTasks(projectId)
      .then((res) => {
        if (!cancelled) {
          setTasks(res.tasks);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const filtered = useMemo(() => {
    const term = search.toLowerCase().trim();
    const results: ReferenceItem[] = [];

    for (const task of tasks) {
      const keyMatch = task.taskKey?.toLowerCase().includes(term);
      const nameMatch = task.name.toLowerCase().includes(term);
      if (!term || keyMatch || nameMatch) {
        results.push({
          type: "task",
          label: task.taskKey ? `${task.taskKey} — ${task.name}` : task.name,
          link: `[${task.taskKey || task.name}](/dashboard/tasks/${task.id})`,
        });
      }

      if (task.pullRequests) {
        for (const pr of task.pullRequests) {
          const repoMatch = pr.repoFullName?.toLowerCase().includes(term);
          const numMatch = pr.prNumber?.toString().includes(term);
          if (!term || repoMatch || numMatch) {
            const prLabel = pr.repoFullName && pr.prNumber
              ? `${pr.repoFullName}#${pr.prNumber}`
              : pr.title || pr.id;
            results.push({
              type: "pr",
              label: `${prLabel}${pr.title ? ` — ${pr.title}` : ""}`,
              link: `[${prLabel}](/dashboard/pull-requests/${pr.id})`,
            });
          }
        }
      }
    }

    // Deduplicate PRs (same PR can appear on multiple tasks)
    const seen = new Set<string>();
    return results.filter((item) => {
      if (seen.has(item.link)) return false;
      seen.add(item.link);
      return true;
    });
  }, [tasks, search]);

  const taskResults = filtered.filter((r) => r.type === "task");
  const prResults = filtered.filter((r) => r.type === "pr");

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    },
    [onClose],
  );

  return (
    <div
      style={{ width: 320, maxHeight: 350 }}
      className="overflow-hidden flex flex-col"
      onKeyDown={handleKeyDown}
    >
      {/* Search input */}
      <div className="p-2 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="w-full pl-7 pr-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Results */}
      <div className="overflow-y-auto flex-1 p-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          </div>
        ) : taskResults.length === 0 && prResults.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            {t("noResults")}
          </p>
        ) : (
          <>
            {taskResults.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase px-2 py-1">
                  {t("tasks")}
                </p>
                {taskResults.slice(0, 20).map((item) => (
                  <button
                    key={item.link}
                    type="button"
                    onClick={() => {
                      onSelect(item);
                      onClose();
                    }}
                    className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-blue-50 truncate"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
            {prResults.length > 0 && (
              <div className={taskResults.length > 0 ? "mt-1" : ""}>
                <p className="text-xs font-semibold text-gray-500 uppercase px-2 py-1">
                  {t("pullRequests")}
                </p>
                {prResults.slice(0, 20).map((item) => (
                  <button
                    key={item.link}
                    type="button"
                    onClick={() => {
                      onSelect(item);
                      onClose();
                    }}
                    className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-blue-50 truncate"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// MARKDOWN EDITOR
// =============================================================================

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  height?: number;
  placeholder?: string;
  projectId?: number;
}

export function MarkdownEditor({
  value,
  onChange,
  height = 200,
  placeholder,
  projectId,
}: MarkdownEditorProps) {
  const t = useTranslations("markdown");
  const { resolvedTheme } = useTheme();
  const valueRef = useRef(value);
  valueRef.current = value;

  // We need commands from @uiw/react-md-editor but it's dynamically imported.
  // Import it lazily to avoid SSR issues.
  const [cmds, setCmds] = useState<typeof import("@uiw/react-md-editor").commands | null>(null);

  useEffect(() => {
    import("@uiw/react-md-editor").then((mod) => {
      setCmds(mod.commands);
    });
  }, []);

  const handleInsertReference = useCallback(
    (item: ReferenceItem, getState?: () => unknown) => {
      const cur = valueRef.current;
      let start = cur.length;
      let end = cur.length;
      if (getState) {
        const state = getState() as { selection?: { start?: number; end?: number } } | false;
        if (state && state.selection) {
          start = state.selection.start ?? cur.length;
          end = state.selection.end ?? cur.length;
        }
      }
      onChange(cur.substring(0, start) + item.link + cur.substring(end));
    },
    [onChange],
  );

  const extraCommands = useMemo(() => {
    if (!cmds) return undefined;

    const result = [cmds.codeEdit, cmds.codeLive, cmds.codePreview];

    if (projectId) {
      const referenceCommand = cmds.group([], {
        name: "reference",
        groupName: "reference",
        icon: <Link2 className="h-3 w-3" />,
        children: ({ close, getState }) => (
          <ReferencePicker
            projectId={projectId}
            onSelect={(item) => handleInsertReference(item, getState)}
            onClose={close}
          />
        ),
        buttonProps: { "aria-label": t("insertReference"), title: t("insertReference") },
      });
      result.push(cmds.divider, referenceCommand);
    }

    return result;
  }, [projectId, cmds, t, handleInsertReference]);

  return (
    <div data-color-mode={resolvedTheme}>
      <MDEditor
        value={value}
        onChange={(val) => onChange(val || "")}
        height={height}
        preview="edit"
        textareaProps={{ placeholder }}
        extraCommands={extraCommands}
      />
    </div>
  );
}

interface MarkdownPreviewProps {
  source: string;
}

export function MarkdownPreview({ source }: MarkdownPreviewProps) {
  const { resolvedTheme } = useTheme();
  return (
    <div data-color-mode={resolvedTheme}>
      <MDPreview source={source} />
    </div>
  );
}
