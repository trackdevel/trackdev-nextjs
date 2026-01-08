// ============================================
// Project Types
// Based on Project.java entity
// ============================================

import { Course } from "./course";
import { Sprint } from "./sprint";
import { Task } from "./task";
import { UserPublic } from "./user";

export interface Project {
  id: number;
  slug: string;
  name: string;
  course?: Course;
  members?: UserPublic[];
  tasks?: Task[];
  sprints?: Sprint[];
  qualification?: number;
}

export interface ProjectCreateRequest {
  name: string;
  members?: string[]; // User IDs
}

export interface ProjectUpdateRequest {
  name?: string;
  qualification?: number;
}

export interface ProjectQualification {
  projectId: number;
  projectName: string;
  members: MemberQualification[];
}

export interface MemberQualification {
  userId: string;
  username: string;
  totalPoints: number;
  tasksCompleted: number;
  qualification: number;
}
