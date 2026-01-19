// ============================================
// Course Invite Types
// Based on CourseInvite.java entity
// ============================================

import { UserPublic } from "./user";

export type InviteStatus = "PENDING" | "ACCEPTED" | "EXPIRED" | "CANCELLED";

export interface CourseInvite {
  id: number;
  fullName?: string;
  email: string;
  courseId: number;
  invitedById: string;
  invitedByName?: string;
  status: InviteStatus;
  createdAt: string;
  expiresAt?: string;
  acceptedAt?: string;
  acceptedById?: string;
  acceptedByName?: string;
}

export interface CourseInviteInfo {
  email: string;
  courseName: string;
  startYear: number;
  status: string;
  expired: boolean;
  invitedBy: string;
}

export interface InviteAcceptedResponse {
  courseId: number;
  courseName: string;
  startYear: number;
  newUserCreated: boolean;
  passwordChangeRequired: boolean;
  message: string;
}

export interface CourseDetails {
  id: number;
  startYear: number;
  githubOrganization?: string;
  ownerId?: string;
  subject?: {
    id: number;
    name: string;
    acronym: string;
  };
  projects?: ProjectWithMembers[];
  students?: UserPublic[];
  pendingInvites?: CourseInvite[];
}

export interface ProjectWithMembers {
  id: number;
  name: string;
  qualification?: number;
  course?: {
    id: number;
    startYear: number;
  };
  members?: UserPublic[];
}

export interface InviteStudentsRequest {
  entries: string[];
}

export interface AcceptInviteRequest {
  password?: string;
}
