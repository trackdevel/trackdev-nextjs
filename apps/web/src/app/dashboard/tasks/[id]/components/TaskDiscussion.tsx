"use client";

import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { useDateFormat } from "@/utils/useDateFormat";
import { ApiClientError, tasksApi, useMutation } from "@trackdev/api-client";
import type { Comment } from "@trackdev/types";
import {
  Loader2,
  MessageSquare,
  Pencil,
  Plus,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { memo, useState } from "react";

interface TaskDiscussionProps {
  comments: Comment[];
  taskId: number;
  onCommentAdded?: () => void;
  canComment?: boolean;
  isProfessor?: boolean;
  currentUserId?: string;
}

export const TaskDiscussion = memo(function TaskDiscussion({
  comments,
  taskId,
  onCommentAdded,
  canComment = false,
  isProfessor = false,
  currentUserId,
}: TaskDiscussionProps) {
  const t = useTranslations("tasks");
  const tCommon = useTranslations("common");
  const toast = useToast();
  const { formatDateTime } = useDateFormat();
  const [newComment, setNewComment] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  // Check if user can edit a specific comment
  const canEditComment = (comment: Comment) => {
    if (!currentUserId) return false;
    // Students can edit their own comments, professors can edit any
    return comment.author?.id === currentUserId || isProfessor;
  };

  // Check if user can delete a comment (only professors)
  const canDeleteComment = () => isProfessor;

  const { mutate: addComment, isLoading: isSubmitting } = useMutation(
    (content: string) => tasksApi.addComment(taskId, { content }),
    {
      onSuccess: () => {
        setNewComment("");
        setIsExpanded(false);
        onCommentAdded?.();
      },
    },
  );

  const { mutate: updateComment, isLoading: isUpdating } = useMutation(
    ({ commentId, content }: { commentId: number; content: string }) =>
      tasksApi.updateComment(taskId, commentId, { content }),
    {
      onSuccess: () => {
        setEditingCommentId(null);
        setEditContent("");
        onCommentAdded?.();
      },
      onError: (err) => {
        const errorMessage =
          err instanceof ApiClientError && err.body?.message
            ? err.body.message
            : t("errorUpdatingComment");
        toast.error(errorMessage);
      },
    },
  );

  const { mutate: deleteComment, isLoading: isDeleting } = useMutation(
    (commentId: number) => tasksApi.deleteComment(taskId, commentId),
    {
      onSuccess: () => {
        setDeleteConfirmId(null);
        onCommentAdded?.();
      },
      onError: (err) => {
        const errorMessage =
          err instanceof ApiClientError && err.body?.message
            ? err.body.message
            : t("errorDeletingComment");
        toast.error(errorMessage);
      },
    },
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
      addComment(newComment.trim());
    }
  };

  const handleStartEdit = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditContent(comment.content);
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditContent("");
  };

  const handleSaveEdit = (commentId: number) => {
    if (editContent.trim()) {
      updateComment({ commentId, content: editContent.trim() });
    }
  };

  const handleDeleteClick = (commentId: number) => {
    setDeleteConfirmId(commentId);
  };

  const handleConfirmDelete = () => {
    if (deleteConfirmId !== null) {
      deleteComment(deleteConfirmId);
    }
  };

  return (
    <div className="card">
      <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            {t("discussion")}{" "}
            {comments.length > 0 && (
              <span className="text-gray-500 dark:text-gray-400">
                ({comments.length})
              </span>
            )}
          </h2>
          {!isExpanded && (
            <button
              onClick={() => setIsExpanded(true)}
              disabled={!canComment}
              className="flex items-center gap-1 rounded-md bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title={!canComment ? t("taskIsFrozen") : ""}
            >
              <Plus className="h-4 w-4" />
              {t("addComment")}
            </button>
          )}
        </div>
      </div>

      {/* Add Comment Form */}
      {isExpanded && (
        <form
          onSubmit={handleSubmit}
          className="border-b border-gray-200 dark:border-gray-700 px-6 py-4 bg-gray-50 dark:bg-gray-800"
        >
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={t("writeComment")}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 resize-none"
            rows={3}
            autoFocus
            disabled={isSubmitting}
          />
          <div className="mt-3 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setIsExpanded(false);
                setNewComment("");
              }}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              disabled={isSubmitting}
            >
              {tCommon("cancel")}
            </button>
            <button
              type="submit"
              disabled={!newComment.trim() || isSubmitting}
              className="flex items-center gap-1 rounded-md bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {isSubmitting ? t("posting") : t("postComment")}
            </button>
          </div>
        </form>
      )}

      {comments.length > 0 ? (
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {comments.map((comment) => {
            const isEditing = editingCommentId === comment.id;
            const showEditButton = canEditComment(comment);
            const showDeleteButton = canDeleteComment();

            return (
              <li key={comment.id} className="px-6 py-4">
                <div className="flex gap-3">
                  <div
                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-medium text-white"
                    style={{
                      backgroundColor: comment.author?.color || "#6b7280",
                    }}
                  >
                    {comment.author?.capitalLetters ||
                      comment.author?.username?.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {comment.author?.fullName || comment.author?.username}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {comment.createdAt
                            ? formatDateTime(comment.createdAt)
                            : ""}
                        </span>
                      </div>
                      {!isEditing && (showEditButton || showDeleteButton) && (
                        <div className="flex items-center gap-1">
                          {showEditButton && (
                            <button
                              onClick={() => handleStartEdit(comment)}
                              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300 transition-colors"
                              title={t("editComment")}
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                          )}
                          {showDeleteButton && (
                            <button
                              onClick={() => handleDeleteClick(comment.id)}
                              disabled={isDeleting}
                              className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                              title={t("deleteComment")}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    {isEditing ? (
                      <div className="mt-2">
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 resize-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                          rows={3}
                          autoFocus
                          disabled={isUpdating}
                        />
                        <div className="mt-2 flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            className="flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                            disabled={isUpdating}
                          >
                            <X className="h-4 w-4" />
                            {tCommon("cancel")}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(comment.id)}
                            disabled={!editContent.trim() || isUpdating}
                            className="flex items-center gap-1 rounded-md bg-primary-600 px-2 py-1 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {isUpdating ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Send className="h-4 w-4" />
                            )}
                            {tCommon("save")}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-1 text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                        {comment.content}
                      </p>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
          {t("noCommentsYet")}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={handleConfirmDelete}
        title={t("deleteCommentTitle")}
        message={t("confirmDeleteComment")}
        confirmLabel={tCommon("delete")}
        isLoading={isDeleting}
        variant="danger"
      />
    </div>
  );
});
