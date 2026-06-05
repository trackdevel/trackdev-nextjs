"use client";

import { useToast } from "@/components/ui/Toast";
import type { ProjectBulkAction } from "@/components/ProjectBulkActionToolbar";
import { ApiClientError, projectsApi, useMutation } from "@trackdev/api-client";
import type { Project } from "@trackdev/types";
import { useCallback, useMemo, useState } from "react";

interface UseProjectBulkFreezeOptions {
  projects: Project[];
  onSuccess: () => void;
  t: (key: string, values?: Record<string, string | number>) => string;
}

export function useProjectBulkFreeze({
  projects,
  onSuccess,
  t,
}: UseProjectBulkFreezeOptions) {
  const toast = useToast();
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const selectableProjects = useMemo(
    () => projects.filter((p) => p.canFreeze),
    [projects],
  );

  const selectableIds = useMemo(
    () => new Set(selectableProjects.map((p) => p.id)),
    [selectableProjects],
  );

  const selectionState = useMemo((): "none" | "some" | "all" => {
    if (selectedIds.size === 0) return "none";
    const selectedSelectable = selectableProjects.filter((p) =>
      selectedIds.has(p.id),
    ).length;
    if (selectedSelectable === selectableProjects.length) return "all";
    return "some";
  }, [selectedIds, selectableProjects]);

  const bulkMutation = useMutation(
    ({ projectIds, frozen }: { projectIds: number[]; frozen: boolean }) =>
      projectsApi.bulkSetFrozen(projectIds, frozen),
    {
      onSuccess: (_data, variables) => {
        toast.success(
          variables.frozen ? t("bulkFreezeSuccess") : t("bulkUnfreezeSuccess"),
        );
        setSelectedIds(new Set());
        onSuccess();
      },
      onError: (err: unknown) => {
        const errorMessage =
          err instanceof ApiClientError && err.body?.message
            ? err.body.message
            : t("bulkFreezeError");
        toast.error(errorMessage);
      },
    },
  );

  const toggleProject = useCallback((projectId: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectionState === "all") {
      setSelectedIds(new Set());
      return;
    }
    setSelectedIds(new Set(selectableProjects.map((p) => p.id)));
  }, [selectionState, selectableProjects]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const executeBulkAction = useCallback(
    (action: ProjectBulkAction) => {
      const ids = Array.from(selectedIds).filter((id) => selectableIds.has(id));
      if (ids.length === 0) return;
      bulkMutation.mutate({ projectIds: ids, frozen: action === "FREEZE" });
    },
    [bulkMutation, selectableIds, selectedIds],
  );

  const selectedCount = useMemo(
    () =>
      Array.from(selectedIds).filter((id) => selectableIds.has(id)).length,
    [selectedIds, selectableIds],
  );

  const showBulkUi = selectableProjects.length > 0;

  return {
    selectedIds,
    selectedCount,
    selectionState,
    showBulkUi,
    selectableProjects,
    toggleProject,
    toggleSelectAll,
    clearSelection,
    executeBulkAction,
    isExecuting: bulkMutation.isLoading,
  };
}
