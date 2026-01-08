"use client";

import { tasksApi, useMutation } from "@trackdev/api-client";
import type { Comment } from "@trackdev/types";
import { Loader2, MessageSquare, Plus, Send } from "lucide-react";
import { useTranslations } from "next-intl";
import { memo, useState } from "react";

interface TaskDiscussionProps {
  comments: Comment[];
  taskId: number;
  onCommentAdded?: () => void;
}

export const TaskDiscussion = memo(function TaskDiscussion({
  comments,
  taskId,
  onCommentAdded,
}: TaskDiscussionProps) {
  const t = useTranslations("tasks");
  const tCommon = useTranslations("common");
  const [newComment, setNewComment] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  const { mutate: addComment, isLoading: isSubmitting } = useMutation(
    (content: string) => tasksApi.addComment(taskId, { content }),
    {
      onSuccess: () => {
        setNewComment("");
        setIsExpanded(false);
        onCommentAdded?.();
      },
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
      addComment(newComment.trim());
    }
  };

  return (
    <div className="card">
      <div className="border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            {t("discussion")}{" "}
            {comments.length > 0 && (
              <span className="text-gray-500">({comments.length})</span>
            )}
          </h2>
          {!isExpanded && (
            <button
              onClick={() => setIsExpanded(true)}
              className="flex items-center gap-1 rounded-md bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              {t("addComment")}
            </button>
          )}
        </div>
      </div>

      {/* Add Comment Form */}
      {isExpanded && (
        <form onSubmit={handleSubmit} className="border-b px-6 py-4 bg-gray-50">
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
              className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
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
        <ul className="divide-y">
          {comments.map((comment) => (
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
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">
                      {comment.author?.username}
                    </span>
                    <span className="text-sm text-gray-500">
                      {comment.createdAt
                        ? new Date(comment.createdAt).toLocaleString()
                        : ""}
                    </span>
                  </div>
                  <p className="mt-1 text-gray-700 whitespace-pre-wrap">
                    {comment.content}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="px-6 py-8 text-center text-gray-500">
          {t("noCommentsYet")}
        </div>
      )}
    </div>
  );
});
