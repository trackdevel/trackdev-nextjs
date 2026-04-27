"use client";

import { DropdownMenu, type DropdownMenuItem } from "@/components/ui/DropdownMenu";
import { ChevronDown, UserPlus, UserMinus, Lock, Unlock, ArrowRightLeft, CalendarRange } from "lucide-react";
import { useTranslations } from "next-intl";

export type BulkAction =
  | "ASSIGN_TO_ME"
  | "UNASSIGN"
  | "FREEZE"
  | "UNFREEZE"
  | "CHANGE_STATUS"
  | "CHANGE_SPRINT";

interface BulkActionToolbarProps {
  selectedCount: number;
  totalSelectable: number;
  selectionState: "none" | "some" | "all";
  onToggleSelectAll: () => void;
  onClearSelection: () => void;
  availableActions: BulkAction[];
  onAction: (action: BulkAction) => void;
  isExecuting: boolean;
  isSelectingAll: boolean;
}

export function BulkActionToolbar({
  selectedCount,
  totalSelectable,
  selectionState,
  onToggleSelectAll,
  onClearSelection,
  availableActions,
  onAction,
  isExecuting,
  isSelectingAll,
}: BulkActionToolbarProps) {
  const t = useTranslations("tasks");

  const actionIcons: Record<BulkAction, React.ReactNode> = {
    ASSIGN_TO_ME: <UserPlus className="h-4 w-4" />,
    UNASSIGN: <UserMinus className="h-4 w-4" />,
    FREEZE: <Lock className="h-4 w-4" />,
    UNFREEZE: <Unlock className="h-4 w-4" />,
    CHANGE_STATUS: <ArrowRightLeft className="h-4 w-4" />,
    CHANGE_SPRINT: <CalendarRange className="h-4 w-4" />,
  };

  const actionLabels: Record<BulkAction, string> = {
    ASSIGN_TO_ME: t("bulkAssignToMe"),
    UNASSIGN: t("bulkUnassign"),
    FREEZE: t("bulkFreeze"),
    UNFREEZE: t("bulkUnfreeze"),
    CHANGE_STATUS: t("bulkChangeStatus"),
    CHANGE_SPRINT: t("bulkChangeSprint"),
  };

  const menuItems: DropdownMenuItem[] = availableActions.map((action) => ({
    label: actionLabels[action],
    icon: actionIcons[action],
    onClick: () => onAction(action),
    disabled: selectedCount === 0 || isExecuting,
  }));

  return (
    <div className="mb-3 flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 dark:border-gray-700 dark:bg-gray-800">
      <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
        <input
          type="checkbox"
          checked={selectionState === "all" && selectedCount > 0}
          ref={(el) => {
            if (el) el.indeterminate = selectionState === "some";
          }}
          onChange={onToggleSelectAll}
          disabled={totalSelectable === 0 || isSelectingAll}
          className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
        />
        <span>
          {isSelectingAll
            ? t("loading")
            : selectionState === "all" && selectedCount > 0
              ? t("deselectAll")
              : t("selectAllFiltered")}
        </span>
      </label>

      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {t("bulkSelectedCount", { count: selectedCount })}
      </span>

      {selectedCount > 0 && (
        <button
          type="button"
          onClick={onClearSelection}
          disabled={isExecuting}
          className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50"
        >
          {t("clearSelection")}
        </button>
      )}

      <div className="ml-auto">
        <DropdownMenu
          items={menuItems}
          trigger={
            <span className="flex items-center gap-2">
              {t("bulkActions")}
              <ChevronDown className="h-4 w-4" />
            </span>
          }
          triggerClassName={`inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            selectedCount === 0 || isExecuting
              ? "cursor-not-allowed bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500"
              : "bg-primary-600 text-white hover:bg-primary-700"
          }`}
        />
      </div>
    </div>
  );
}
