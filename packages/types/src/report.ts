import type { Course } from "./course";
import type { UserPublic } from "./user";

export type ReportAxisType = "STUDENTS" | "SPRINTS";

export type ReportElement = "TASK";

export type ReportMagnitude =
  | "ESTIMATION_POINTS"
  | "PULL_REQUESTS"
  | "PROFILE_ATTRIBUTE";

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
  /** ID of the profile attribute used as custom magnitude source */
  profileAttributeId?: number;
  /** Name of the profile attribute used as custom magnitude source */
  profileAttributeName?: string;
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
  magnitude: ReportMagnitude | "PROFILE_ATTRIBUTE";
  /** Profile attribute info when magnitude is PROFILE_ATTRIBUTE */
  profileAttributeId?: number;
  profileAttributeName?: string;
  rowHeaders: AxisHeader[];
  columnHeaders: AxisHeader[];
  data: Record<string, number>; // "rowId:columnId" -> value
  rowTotals: Record<string, number>;
  columnTotals: Record<string, number>;
  grandTotal: number;
}
