// ============================================
// Course Types
// Based on Course.java entity
// ============================================

import { Project } from "./project";
import { Subject } from "./subject";

export interface Course {
  id: number;
  startYear: number;
  githubOrganization?: string;
  ownerId?: string;
  subject?: Subject;
  projects?: Project[];
  projectCount?: number;
  studentCount?: number;
  enrolledProjects?: Project[]; // For student view only
  profileId?: number;
}

export interface CourseCreateRequest {
  startYear: number;
  githubOrganization?: string;
}

export interface CourseUpdateRequest {
  startYear?: number;
  githubOrganization?: string;
}
