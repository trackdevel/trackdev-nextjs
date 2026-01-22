// ============================================
// Sprint Pattern Types
// Based on SprintPattern.java and SprintPatternItem.java entities
// ============================================

export interface SprintPatternItem {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  orderIndex: number;
}

export interface SprintPattern {
  id: number;
  name: string;
  courseId: number;
  items: SprintPatternItem[];
}

export interface SprintPatternItemRequest {
  id?: number; // ID of existing item (null/undefined for new items)
  name: string;
  startDate?: string;
  endDate?: string;
  orderIndex?: number;
}

export interface SprintPatternRequest {
  name: string;
  items?: SprintPatternItemRequest[];
}
