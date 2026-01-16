import type { Course } from "./course";
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
  course?: Course;
}

export interface CourseReportsResponse {
  reports: Report[];
  courseId: number;
}

export interface AxisHeader {
  id: string;
  name: string;
}

export interface ReportResult {
  reportId: number;
  reportName: string;
  projectId: number;
  projectName: string;
  rowType: ReportAxisType;
  columnType: ReportAxisType;
  element: ReportElement;
  magnitude: ReportMagnitude;
  rowHeaders: AxisHeader[];
  columnHeaders: AxisHeader[];
  data: Record<string, number>; // "rowId:columnId" -> value
  rowTotals: Record<string, number>;
  columnTotals: Record<string, number>;
  grandTotal: number;
}
