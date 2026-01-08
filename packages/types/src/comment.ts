// ============================================
// Comment Types
// Based on Comment.java entity
// ============================================

import { UserPublic } from './user';

export interface Comment {
  id: number;
  content: string;
  createdAt: string;
  author: UserPublic;
  taskId: number;
}

export interface CommentCreateRequest {
  content: string;
}

export interface CommentUpdateRequest {
  content: string;
}
