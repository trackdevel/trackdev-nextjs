import type { TaskDetail, TaskStatus, TaskType } from "@trackdev/types";

// Extended task type with project info
export type TaskWithProject = TaskDetail;

// Edit state types
export type EditField =
  | "name"
  | "description"
  | "estimation"
  | "status"
  | "type"
  | "sprint"
  | null;

export interface EditState {
  field: EditField;
  name: string;
  description: string;
  estimation: string;
  status: TaskStatus;
  taskType: TaskType;
  sprintId: number | null;
  isSaving: boolean;
  error: string | null;
  // Local task data that can be updated optimistically
  taskOverride: Partial<TaskWithProject> | null;
}

export type EditAction =
  | { type: "START_EDIT"; field: EditField; task: TaskWithProject }
  | { type: "SET_NAME"; value: string }
  | { type: "SET_DESCRIPTION"; value: string }
  | { type: "SET_ESTIMATION"; value: string }
  | { type: "SET_STATUS"; value: TaskStatus }
  | { type: "SET_TASK_TYPE"; value: TaskType }
  | { type: "SET_SPRINT"; value: number | null }
  | { type: "SAVE_START" }
  | { type: "SAVE_SUCCESS"; result: Partial<TaskWithProject> }
  | { type: "SAVE_ERROR"; error: string }
  | { type: "CANCEL" };
