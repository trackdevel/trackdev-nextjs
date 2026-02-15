"use client";

import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { useDateFormat } from "@/utils/useDateFormat";
import {
  ApiClientError,
  pointsReviewsApi,
  useMutation,
  useQuery,
} from "@trackdev/api-client";
import type {
  PointsReviewConversation,
  PointsReviewConversationSummary,
  PointsReviewMessage,
  UserPublic,
} from "@trackdev/types";
import {
  ChevronDown,
  ChevronRight,
  Loader2,
  MessageSquare,
  Pencil,
  Plus,
  Send,
  Star,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { memo, useState } from "react";

// =============================================================================
// TYPES
// =============================================================================

interface TaskPointsReviewProps {
  taskId: number;
  canStartPointsReview: boolean;
  canViewPointsReviews: boolean;
  pointsReviewConversationCount: number;
  projectMembers?: UserPublic[];
  onConversationCreated?: () => void;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export const TaskPointsReview = memo(function TaskPointsReview({
  taskId,
  canStartPointsReview,
  canViewPointsReviews,
  pointsReviewConversationCount,
  projectMembers,
  onConversationCreated,
}: TaskPointsReviewProps) {
  const t = useTranslations("pointsReview");
  const tCommon = useTranslations("common");
  const toast = useToast();
  const { formatDateTime } = useDateFormat();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [expandedConversationId, setExpandedConversationId] = useState<
    number | null
  >(null);

  // ---- Create form state ----
  const [newMessage, setNewMessage] = useState("");
  const [proposedPoints, setProposedPoints] = useState("");
  const [selectedSimilarTaskIds, setSelectedSimilarTaskIds] = useState<
    number[]
  >([]);

  // ---- Reply state ----
  const [replyContent, setReplyContent] = useState("");

  // ---- Edit message state ----
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");

  // ---- Delete message state ----
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  // ---- Add participant state ----
  const [showAddParticipant, setShowAddParticipant] = useState(false);
  const [selectedParticipantId, setSelectedParticipantId] = useState("");

  // ---- Edit conversation state ----
  const [editingConversation, setEditingConversation] = useState(false);
  const [editProposedPoints, setEditProposedPoints] = useState("");

  // ---- Inline validation state ----
  const [validationError, setValidationError] = useState<string | null>(null);

  // Fetch conversation list
  const {
    data: conversations,
    isLoading: isLoadingList,
    refetch: refetchList,
  } = useQuery(
    () => pointsReviewsApi.list(taskId),
    [taskId, "points-reviews"],
    { enabled: canViewPointsReviews },
  );

  // Fetch expanded conversation detail
  const {
    data: expandedConversation,
    isLoading: isLoadingDetail,
    refetch: refetchDetail,
  } = useQuery(
    () =>
      expandedConversationId
        ? pointsReviewsApi.get(taskId, expandedConversationId)
        : Promise.resolve(null),
    [taskId, expandedConversationId],
    { enabled: !!expandedConversationId },
  );

  // Don't render anything if user can't see reviews and can't start one
  if (!canViewPointsReviews && !canStartPointsReview) {
    return null;
  }

  // ---- Mutations ----

  const { mutate: createConversation, isLoading: isCreating } = useMutation(
    () =>
      pointsReviewsApi.create(taskId, {
        content: newMessage.trim(),
        proposedPoints: parseInt(proposedPoints, 10),
        similarTaskIds:
          selectedSimilarTaskIds.length > 0
            ? selectedSimilarTaskIds
            : undefined,
      }),
    {
      onSuccess: () => {
        setShowCreateForm(false);
        setNewMessage("");
        setProposedPoints("");
        setSelectedSimilarTaskIds([]);
        toast.success(t("conversationCreated"));
        refetchList();
        onConversationCreated?.();
      },
      onError: (err) => {
        const errorMessage =
          err instanceof ApiClientError && err.body?.message
            ? err.body.message
            : t("errorCreating");
        toast.error(errorMessage);
      },
    },
  );

  const { mutate: addMessage, isLoading: isSendingReply } = useMutation(
    (content: string) =>
      pointsReviewsApi.addMessage(taskId, expandedConversationId!, {
        content,
      }),
    {
      onSuccess: () => {
        setReplyContent("");
        refetchDetail();
        refetchList();
      },
      onError: (err) => {
        const errorMessage =
          err instanceof ApiClientError && err.body?.message
            ? err.body.message
            : t("errorSendingMessage");
        toast.error(errorMessage);
      },
    },
  );

  const { mutate: editMessage, isLoading: isEditingMessage } = useMutation(
    ({ messageId, content }: { messageId: number; content: string }) =>
      pointsReviewsApi.editMessage(taskId, expandedConversationId!, messageId, {
        content,
      }),
    {
      onSuccess: () => {
        setEditingMessageId(null);
        setEditContent("");
        refetchDetail();
      },
      onError: (err) => {
        const errorMessage =
          err instanceof ApiClientError && err.body?.message
            ? err.body.message
            : t("errorEditingMessage");
        toast.error(errorMessage);
      },
    },
  );

  const { mutate: deleteMessage, isLoading: isDeletingMessage } = useMutation(
    (messageId: number) =>
      pointsReviewsApi.deleteMessage(
        taskId,
        expandedConversationId!,
        messageId,
      ),
    {
      onSuccess: () => {
        setDeleteConfirmId(null);
        refetchDetail();
        refetchList();
      },
      onError: (err) => {
        const errorMessage =
          err instanceof ApiClientError && err.body?.message
            ? err.body.message
            : t("errorDeletingMessage");
        toast.error(errorMessage);
      },
    },
  );

  const { mutate: addParticipant, isLoading: isAddingParticipant } =
    useMutation(
      (userId: string) =>
        pointsReviewsApi.addParticipant(
          taskId,
          expandedConversationId!,
          userId,
        ),
      {
        onSuccess: () => {
          setShowAddParticipant(false);
          setSelectedParticipantId("");
          toast.success(t("participantAdded"));
          refetchDetail();
        },
        onError: (err) => {
          const errorMessage =
            err instanceof ApiClientError && err.body?.message
              ? err.body.message
              : t("errorAddingParticipant");
          toast.error(errorMessage);
        },
      },
    );

  const { mutate: removeParticipant } = useMutation(
    (userId: string) =>
      pointsReviewsApi.removeParticipant(
        taskId,
        expandedConversationId!,
        userId,
      ),
    {
      onSuccess: () => {
        toast.success(t("participantRemoved"));
        refetchDetail();
      },
      onError: (err) => {
        const errorMessage =
          err instanceof ApiClientError && err.body?.message
            ? err.body.message
            : t("errorRemovingParticipant");
        toast.error(errorMessage);
      },
    },
  );

  const { mutate: updateConversation, isLoading: isUpdatingConversation } =
    useMutation(
      (data: { proposedPoints?: number; similarTaskIds?: number[] }) =>
        pointsReviewsApi.update(taskId, expandedConversationId!, data),
      {
        onSuccess: () => {
          setEditingConversation(false);
          toast.success(t("conversationUpdated"));
          refetchDetail();
          refetchList();
        },
        onError: (err) => {
          const errorMessage =
            err instanceof ApiClientError && err.body?.message
              ? err.body.message
              : t("errorUpdating");
          toast.error(errorMessage);
        },
      },
    );

  // ---- Handlers ----

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    if (!newMessage.trim() || !proposedPoints.trim()) return;
    const pts = parseInt(proposedPoints, 10);
    if (isNaN(pts) || pts < 0) {
      setValidationError(t("invalidPoints"));
      return;
    }
    createConversation();
  };

  const handleToggleConversation = (id: number) => {
    if (expandedConversationId === id) {
      setExpandedConversationId(null);
    } else {
      setExpandedConversationId(id);
      setEditingConversation(false);
    }
  };

  const handleReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (replyContent.trim()) {
      addMessage(replyContent.trim());
    }
  };

  const handleStartEditMessage = (msg: PointsReviewMessage) => {
    setEditingMessageId(msg.id);
    setEditContent(msg.content);
  };

  const handleSaveEditMessage = (messageId: number) => {
    if (editContent.trim()) {
      editMessage({ messageId, content: editContent.trim() });
    }
  };

  const handleStartEditConversation = () => {
    if (expandedConversation) {
      setEditingConversation(true);
      setEditProposedPoints(String(expandedConversation.proposedPoints));
    }
  };

  const handleSaveConversation = () => {
    setValidationError(null);
    const pts = parseInt(editProposedPoints, 10);
    if (isNaN(pts) || pts < 0) {
      setValidationError(t("invalidPoints"));
      return;
    }
    updateConversation({ proposedPoints: pts });
  };

  const handleAddParticipantSubmit = () => {
    if (selectedParticipantId) {
      addParticipant(selectedParticipantId);
    }
  };

  // ---- Computed ----

  // Filter available participants (exclude existing ones and conversation initiator)
  const availableParticipants = projectMembers?.filter((member) => {
    if (!expandedConversation) return false;
    if (member.id === expandedConversation.initiator.id) return false;
    if (
      expandedConversation.participants.some((p) => p.id === member.id)
    )
      return false;
    return true;
  });

  const conversationCount = pointsReviewConversationCount;

  return (
    <div className="card">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Star className="h-5 w-5" />
            {t("title")}
            {conversationCount > 0 && (
              <span className="text-gray-500 dark:text-gray-400">
                ({conversationCount})
              </span>
            )}
          </h2>
          {canStartPointsReview && !showCreateForm && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-1 rounded-md bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              {t("startReview")}
            </button>
          )}
        </div>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <form
          onSubmit={handleCreateSubmit}
          className="border-b border-gray-200 dark:border-gray-700 px-6 py-4 bg-amber-50 dark:bg-amber-900/10"
        >
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t("proposedPoints")} *
              </label>
              <input
                type="number"
                min="0"
                value={proposedPoints}
                onChange={(e) => setProposedPoints(e.target.value)}
                placeholder={t("proposedPointsPlaceholder")}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-hidden focus:ring-1 focus:ring-amber-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                disabled={isCreating}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t("message")} *
              </label>
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={t("messagePlaceholder")}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-hidden focus:ring-1 focus:ring-amber-500 resize-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                rows={3}
                autoFocus
                disabled={isCreating}
                maxLength={2000}
              />
            </div>
          </div>
          {validationError && (
            <div className="mt-2 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
              {validationError}
            </div>
          )}
          <div className="mt-3 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setShowCreateForm(false);
                setNewMessage("");
                setProposedPoints("");
                setValidationError(null);
              }}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              disabled={isCreating}
            >
              {tCommon("cancel")}
            </button>
            <button
              type="submit"
              disabled={
                !newMessage.trim() || !proposedPoints.trim() || isCreating
              }
              className="flex items-center gap-1 rounded-md bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isCreating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {isCreating ? t("creating") : t("startReview")}
            </button>
          </div>
        </form>
      )}

      {/* Conversation List */}
      {canViewPointsReviews && (
        <>
          {isLoadingList ? (
            <div className="px-6 py-8 text-center">
              <Loader2 className="mx-auto h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : conversations && conversations.length > 0 ? (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {conversations.map((conv) => (
                <ConversationItem
                  key={conv.id}
                  summary={conv}
                  isExpanded={expandedConversationId === conv.id}
                  onToggle={() => handleToggleConversation(conv.id)}
                  expandedConversation={
                    expandedConversationId === conv.id
                      ? expandedConversation
                      : null
                  }
                  isLoadingDetail={
                    expandedConversationId === conv.id && isLoadingDetail
                  }
                  formatDateTime={formatDateTime}
                  // Reply
                  replyContent={replyContent}
                  onReplyContentChange={setReplyContent}
                  onReplySubmit={handleReplySubmit}
                  isSendingReply={isSendingReply}
                  // Edit message
                  editingMessageId={editingMessageId}
                  editContent={editContent}
                  onEditContentChange={setEditContent}
                  onStartEditMessage={handleStartEditMessage}
                  onSaveEditMessage={handleSaveEditMessage}
                  onCancelEditMessage={() => {
                    setEditingMessageId(null);
                    setEditContent("");
                  }}
                  isEditingMessage={isEditingMessage}
                  // Delete message
                  onDeleteMessage={(id) => setDeleteConfirmId(id)}
                  // Participants
                  showAddParticipant={showAddParticipant}
                  onToggleAddParticipant={() =>
                    setShowAddParticipant(!showAddParticipant)
                  }
                  availableParticipants={availableParticipants}
                  selectedParticipantId={selectedParticipantId}
                  onSelectParticipant={setSelectedParticipantId}
                  onAddParticipant={handleAddParticipantSubmit}
                  isAddingParticipant={isAddingParticipant}
                  onRemoveParticipant={removeParticipant}
                  // Edit conversation
                  editingConversation={editingConversation}
                  editProposedPoints={editProposedPoints}
                  onEditProposedPointsChange={setEditProposedPoints}
                  onStartEditConversation={handleStartEditConversation}
                  onSaveConversation={handleSaveConversation}
                  onCancelEditConversation={() => {
                    setEditingConversation(false);
                    setValidationError(null);
                  }}
                  isUpdatingConversation={isUpdatingConversation}
                  validationError={validationError}
                  t={t}
                  tCommon={tCommon}
                />
              ))}
            </ul>
          ) : (
            <div className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
              {t("noConversations")}
            </div>
          )}
        </>
      )}

      {/* Delete Message Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={() => {
          if (deleteConfirmId !== null) deleteMessage(deleteConfirmId);
        }}
        title={t("deleteMessageTitle")}
        message={t("confirmDeleteMessage")}
        confirmLabel={tCommon("delete")}
        isLoading={isDeletingMessage}
        variant="danger"
      />
    </div>
  );
});

// =============================================================================
// CONVERSATION ITEM (expandable)
// =============================================================================

interface ConversationItemProps {
  summary: PointsReviewConversationSummary;
  isExpanded: boolean;
  onToggle: () => void;
  expandedConversation: PointsReviewConversation | null | undefined;
  isLoadingDetail: boolean;
  formatDateTime: (date: string) => string;
  // Reply
  replyContent: string;
  onReplyContentChange: (val: string) => void;
  onReplySubmit: (e: React.FormEvent) => void;
  isSendingReply: boolean;
  // Edit message
  editingMessageId: number | null;
  editContent: string;
  onEditContentChange: (val: string) => void;
  onStartEditMessage: (msg: PointsReviewMessage) => void;
  onSaveEditMessage: (messageId: number) => void;
  onCancelEditMessage: () => void;
  isEditingMessage: boolean;
  // Delete message
  onDeleteMessage: (id: number) => void;
  // Participants
  showAddParticipant: boolean;
  onToggleAddParticipant: () => void;
  availableParticipants: UserPublic[] | undefined;
  selectedParticipantId: string;
  onSelectParticipant: (id: string) => void;
  onAddParticipant: () => void;
  isAddingParticipant: boolean;
  onRemoveParticipant: (userId: string) => void;
  // Edit conversation
  editingConversation: boolean;
  editProposedPoints: string;
  onEditProposedPointsChange: (val: string) => void;
  onStartEditConversation: () => void;
  onSaveConversation: () => void;
  onCancelEditConversation: () => void;
  isUpdatingConversation: boolean;
  validationError: string | null;
  t: ReturnType<typeof useTranslations>;
  tCommon: ReturnType<typeof useTranslations>;
}

function ConversationItem({
  summary,
  isExpanded,
  onToggle,
  expandedConversation,
  isLoadingDetail,
  formatDateTime,
  replyContent,
  onReplyContentChange,
  onReplySubmit,
  isSendingReply,
  editingMessageId,
  editContent,
  onEditContentChange,
  onStartEditMessage,
  onSaveEditMessage,
  onCancelEditMessage,
  isEditingMessage,
  onDeleteMessage,
  showAddParticipant,
  onToggleAddParticipant,
  availableParticipants,
  selectedParticipantId,
  onSelectParticipant,
  onAddParticipant,
  isAddingParticipant,
  onRemoveParticipant,
  editingConversation,
  editProposedPoints,
  onEditProposedPointsChange,
  onStartEditConversation,
  onSaveConversation,
  onCancelEditConversation,
  isUpdatingConversation,
  validationError,
  t,
  tCommon,
}: ConversationItemProps) {
  return (
    <li>
      {/* Summary Row */}
      <button
        onClick={onToggle}
        className="w-full px-6 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
      >
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
        )}
        <div
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-medium text-white"
          style={{
            backgroundColor: summary.initiator?.color || "#6b7280",
          }}
        >
          {summary.initiator?.fullName?.slice(0, 2).toUpperCase() ||
            summary.initiator?.username?.slice(0, 2).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900 dark:text-white text-sm truncate">
              {summary.initiator?.fullName || summary.initiator?.username}
            </span>
            <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
              {summary.proposedPoints} {t("pts")}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {summary.createdAt ? formatDateTime(summary.createdAt) : ""}
            </span>
            <span className="text-xs text-gray-400">
              <MessageSquare className="inline h-3 w-3 mr-0.5" />
              {summary.messageCount}
            </span>
          </div>
        </div>
      </button>

      {/* Expanded Detail */}
      {isExpanded && (
        <div className="border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          {isLoadingDetail ? (
            <div className="px-6 py-6 text-center">
              <Loader2 className="mx-auto h-5 w-5 animate-spin text-gray-400" />
            </div>
          ) : expandedConversation ? (
            <div className="px-6 py-4 space-y-4">
              {/* Proposed Points */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  {t("proposedPoints")}:
                </span>
                {editingConversation ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      value={editProposedPoints}
                      onChange={(e) =>
                        onEditProposedPointsChange(e.target.value)
                      }
                      className="w-20 rounded-md border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      disabled={isUpdatingConversation}
                    />
                    <button
                      onClick={onSaveConversation}
                      disabled={isUpdatingConversation}
                      className="rounded-md bg-amber-600 px-2 py-1 text-xs font-medium text-white hover:bg-amber-700 disabled:opacity-50 transition-colors"
                    >
                      {isUpdatingConversation ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        tCommon("save")
                      )}
                    </button>
                    <button
                      onClick={onCancelEditConversation}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      {tCommon("cancel")}
                    </button>
                    {validationError && (
                      <span className="text-xs text-red-600 dark:text-red-400">
                        {validationError}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-sm font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                      {expandedConversation.proposedPoints} {t("pts")}
                    </span>
                    {expandedConversation.canEdit && (
                      <button
                        onClick={onStartEditConversation}
                        className="rounded-sm p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300 transition-colors"
                        title={tCommon("edit")}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Similar Tasks */}
              {expandedConversation.similarTasks.length > 0 && (
                <div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    {t("similarTasks")}:
                  </span>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {expandedConversation.similarTasks.map((task) => (
                      <Link
                        key={task.id}
                        href={`/dashboard/tasks/${task.id}`}
                        className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors"
                      >
                        {task.taskKey || `#${task.id}`} -{" "}
                        {task.name.length > 30
                          ? `${task.name.substring(0, 30)}...`
                          : task.name}
                        {task.estimationPoints != null && (
                          <span className="ml-1 text-amber-600 dark:text-amber-400">
                            ({task.estimationPoints}pt)
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Participants */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  {t("participants")}:
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {expandedConversation.initiator.fullName ||
                    expandedConversation.initiator.username}
                </span>
                {expandedConversation.participants.map((p) => (
                  <span
                    key={p.id}
                    className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400"
                  >
                    {p.fullName || p.username}
                    {expandedConversation.canAddParticipant && (
                      <button
                        onClick={() => onRemoveParticipant(p.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                        title={t("removeParticipant")}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </span>
                ))}
                {expandedConversation.canAddParticipant && (
                  <button
                    onClick={onToggleAddParticipant}
                    className="inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-medium text-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-900/20 transition-colors"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    {t("addParticipant")}
                  </button>
                )}
              </div>

              {/* Add Participant Form */}
              {showAddParticipant &&
                expandedConversation.canAddParticipant && (
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedParticipantId}
                      onChange={(e) => onSelectParticipant(e.target.value)}
                      className="rounded-md border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      disabled={isAddingParticipant}
                    >
                      <option value="">{t("selectParticipant")}</option>
                      {availableParticipants?.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.fullName || member.username}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={onAddParticipant}
                      disabled={!selectedParticipantId || isAddingParticipant}
                      className="rounded-md bg-primary-600 px-2 py-1 text-xs font-medium text-white hover:bg-primary-700 disabled:opacity-50 transition-colors"
                    >
                      {isAddingParticipant ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        tCommon("confirm")
                      )}
                    </button>
                    <button
                      onClick={onToggleAddParticipant}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      {tCommon("cancel")}
                    </button>
                  </div>
                )}

              {/* Messages */}
              <div className="space-y-3">
                {expandedConversation.messages.map((msg) => {
                  const isEditing = editingMessageId === msg.id;
                  return (
                    <div key={msg.id} className="flex gap-2.5">
                      <div
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-medium text-white mt-0.5"
                        style={{
                          backgroundColor: msg.author?.color || "#6b7280",
                        }}
                      >
                        {msg.author?.fullName?.slice(0, 2).toUpperCase() ||
                          msg.author?.username?.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-gray-900 dark:text-white">
                              {msg.author?.fullName || msg.author?.username}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {msg.createdAt
                                ? formatDateTime(msg.createdAt)
                                : ""}
                            </span>
                          </div>
                          {!isEditing &&
                            (msg.canEdit || msg.canDelete) && (
                              <div className="flex items-center gap-1">
                                {msg.canEdit && (
                                  <button
                                    onClick={() => onStartEditMessage(msg)}
                                    className="rounded-sm p-0.5 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300 transition-colors"
                                    title={tCommon("edit")}
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </button>
                                )}
                                {msg.canDelete && (
                                  <button
                                    onClick={() => onDeleteMessage(msg.id)}
                                    className="rounded-sm p-0.5 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-colors"
                                    title={tCommon("delete")}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </div>
                            )}
                        </div>
                        {isEditing ? (
                          <div className="mt-1">
                            <textarea
                              value={editContent}
                              onChange={(e) =>
                                onEditContentChange(e.target.value)
                              }
                              className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm resize-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                              rows={2}
                              autoFocus
                              disabled={isEditingMessage}
                              maxLength={2000}
                            />
                            <div className="mt-1 flex items-center justify-end gap-2">
                              <button
                                onClick={onCancelEditMessage}
                                className="text-xs text-gray-500 hover:text-gray-700"
                                disabled={isEditingMessage}
                              >
                                {tCommon("cancel")}
                              </button>
                              <button
                                onClick={() => onSaveEditMessage(msg.id)}
                                disabled={
                                  !editContent.trim() || isEditingMessage
                                }
                                className="flex items-center gap-1 rounded-md bg-primary-600 px-2 py-1 text-xs font-medium text-white hover:bg-primary-700 disabled:opacity-50 transition-colors"
                              >
                                {isEditingMessage ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Send className="h-3 w-3" />
                                )}
                                {tCommon("save")}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="mt-0.5 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                            {msg.content}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Reply Form */}
              <form
                onSubmit={onReplySubmit}
                className="flex items-start gap-2 pt-2 border-t border-gray-200 dark:border-gray-600"
              >
                <textarea
                  value={replyContent}
                  onChange={(e) => onReplyContentChange(e.target.value)}
                  placeholder={t("writeReply")}
                  className="flex-1 rounded-md border border-gray-300 px-2.5 py-1.5 text-sm resize-none focus:border-amber-500 focus:outline-hidden focus:ring-1 focus:ring-amber-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  rows={2}
                  disabled={isSendingReply}
                  maxLength={2000}
                />
                <button
                  type="submit"
                  disabled={!replyContent.trim() || isSendingReply}
                  className="shrink-0 flex items-center gap-1 rounded-md bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSendingReply ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
              </form>
            </div>
          ) : null}
        </div>
      )}
    </li>
  );
}
