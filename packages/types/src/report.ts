import type { UserPublic } from "./user";

export type ReportAxisType = "STUDENTS" | "SPRINTS";

export type ReportElement = "TASK";

export type ReportMagnitude = "ESTIMATION_POINTS" | "PULL_REQUESTS";

export interface Report {
  id: number;
  name: string;
  createdAt: string;
  owner: UserPublic;
  rowType?: ReportAxisType;
  columnType?: ReportAxisType;
  element?: ReportElement;
  magnitude?: ReportMagnitude;
}
