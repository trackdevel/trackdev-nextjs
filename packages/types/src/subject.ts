// ============================================
// Subject Types
// Based on Subject.java entity
// ============================================

export interface Subject {
  id: number;
  name: string;
  acronym: string;
  owner: {
    id: string;
    username: string;
    email: string;
  };
  courses?: Course[];
}

export interface SubjectCreateRequest {
  name: string;
  acronym: string;
}

export interface SubjectUpdateRequest {
  name?: string;
  acronym?: string;
}

// Import Course type
import { Course } from './course';
