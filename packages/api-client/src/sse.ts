// ============================================
// SSE (Server-Sent Events) Client
// ============================================

/// <reference lib="dom" />

import type { Task } from "@trackdev/types";
import { getApiConfig } from "./client";

export interface TaskEvent {
  eventType: "task_updated" | "task_created" | "task_deleted";
  taskId: number;
  actorUserId: string;
  actorFullName: string;
  task: Task | null;
}

export function createSprintEventSource(
  sprintId: number,
  onEvent: (event: TaskEvent) => void,
  onError?: (error: Event) => void,
): EventSource {
  const { baseUrl, apiPrefix } = getApiConfig();
  const url = `${baseUrl}${apiPrefix || ""}/sprints/${sprintId}/events`;

  const es = new EventSource(url, { withCredentials: true });

  es.addEventListener("task_event", ((e: MessageEvent) => {
    try {
      const event: TaskEvent = JSON.parse(e.data);
      onEvent(event);
    } catch {
      // Ignore malformed events
    }
  }) as EventListener);

  es.onerror = (e) => {
    onError?.(e);
  };

  return es;
}
