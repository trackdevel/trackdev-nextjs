import { createSprintEventSource } from "@trackdev/api-client";
import type { TaskEvent } from "@trackdev/api-client";
import type { Task } from "@trackdev/types";
import { useEffect, useRef } from "react";

interface UseSprintSSEParams {
  sprintId: number;
  enabled: boolean;
  setTasks: React.Dispatch<React.SetStateAction<Map<number, Task>>>;
  currentUserId: string | null | undefined;
  toast: {
    success: (message: string) => void;
    info: (message: string) => void;
  };
  t: (key: string, values?: Record<string, string>) => string;
}

export function useSprintSSE({
  sprintId,
  enabled,
  setTasks,
  currentUserId,
  toast,
  t,
}: UseSprintSSEParams) {
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!enabled || !sprintId || isNaN(sprintId)) return;

    let cancelled = false;

    // Defer to a microtask so React Strict Mode's synchronous
    // mount→unmount→mount cycle sets cancelled=true before we open.
    queueMicrotask(() => {
      if (cancelled) return;

      const es = createSprintEventSource(
        sprintId,
        (event: TaskEvent) => {
          // Skip own events to avoid double-update with optimistic UI
          if (event.actorUserId === currentUserId) return;

          if (
            event.eventType === "task_updated" ||
            event.eventType === "task_created"
          ) {
            if (event.task) {
              setTasks((prev) => {
                const next = new Map(prev);
                next.set(event.task!.id, event.task!);
                // If the task has childTasks, also update them individually
                if (event.task!.childTasks) {
                  for (const child of event.task!.childTasks) {
                    next.set(child.id, child);
                  }
                }
                return next;
              });

              // Skip toast for USER_STORY — these are cascading updates
              // triggered by subtask changes (computed status/sprints)
              if (event.task.type !== "USER_STORY") {
                const actorName = event.actorFullName || "Someone";
                const taskName = event.task.name || "";
                toast.success(
                  t("sse.taskUpdated", { user: actorName, task: taskName }),
                );
              }
            }
          }

          if (event.eventType === "task_deleted") {
            setTasks((prev) => {
              const next = new Map(prev);
              next.delete(event.taskId);
              return next;
            });

            const actorName = event.actorFullName || "Someone";
            toast.info(t("sse.taskDeleted", { user: actorName }));
          }
        },
        () => {
          // EventSource will auto-reconnect on error
        },
        () => {
          // Server says SSE is disabled — close cleanly, don't reconnect
          eventSourceRef.current = null;
        },
        (reason: string) => {
          // Server rejected connection (limit reached)
          eventSourceRef.current = null;
          if (reason === "max_user_connections") {
            toast.info(t("sse.tooManyTabs"));
          }
        },
      );

      eventSourceRef.current = es;
    });

    return () => {
      cancelled = true;
      eventSourceRef.current?.close();
      eventSourceRef.current = null;
    };
  }, [sprintId, enabled, currentUserId]);
}
