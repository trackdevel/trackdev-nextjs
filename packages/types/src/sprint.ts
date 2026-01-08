// ============================================
// Sprint Types
// Based on Sprint.java entity
// ============================================

import { Task } from './task';

export interface Sprint {
  id: number;
  name: string;
  startDate?: string;
  endDate?: string;
  status: SprintStatus;
  activeTasks?: Task[];
}

export type SprintStatus = 'DRAFT' | 'ACTIVE' | 'CLOSED';

export interface SprintCreateRequest {
  name: string;
  startDate?: string;
  endDate?: string;
}

export interface SprintUpdateRequest {
  name?: string;
  startDate?: string;
  endDate?: string;
  status?: SprintStatus;
}

export interface SprintLog {
  id: number;
  sprintId: number;
  action: string;
  details: string;
  timestamp: string;
  userId: string;
}
