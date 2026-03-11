"use client";

import { MemberAvatar } from "@/components/ui/MemberAvatar";
import type { Task } from "@trackdev/types";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const HOVER_DELAY_MS = 750;

interface TaskHoverPreviewProps {
  task: Task;
  children: React.ReactNode;
  disabled?: boolean;
}

export function TaskHoverPreview({
  task,
  children,
  disabled,
}: TaskHoverPreviewProps) {
  const t = useTranslations("tasks");
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const elementRef = useRef<HTMLDivElement>(null);

  const clearTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const handleMouseEnter = useCallback(() => {
    if (disabled) return;
    clearTimer();
    timeoutRef.current = setTimeout(() => {
      if (elementRef.current) {
        const rect = elementRef.current.getBoundingClientRect();
        setPosition({
          top: rect.top - 8,
          left: rect.left + rect.width / 2,
        });
        setIsVisible(true);
      }
    }, HOVER_DELAY_MS);
  }, [disabled, clearTimer]);

  const handleMouseLeave = useCallback(() => {
    clearTimer();
    setIsVisible(false);
  }, [clearTimer]);

  useEffect(() => {
    if (disabled) {
      clearTimer();
      setIsVisible(false);
    }
  }, [disabled, clearTimer]);

  useEffect(() => {
    return clearTimer;
  }, [clearTimer]);

  return (
    <div
      ref={elementRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {isVisible &&
        createPortal(
          <div
            className="pointer-events-none fixed z-[9999] -translate-x-1/2 -translate-y-full"
            style={{ top: position.top, left: position.left }}
          >
            <div className="max-w-xs rounded-lg bg-gray-900 p-3 text-white shadow-lg dark:bg-gray-800 dark:ring-1 dark:ring-gray-700">
              {task.taskKey && (
                <p className="mb-1 text-xs text-gray-400">{task.taskKey}</p>
              )}
              <p className="text-sm font-medium leading-snug">{task.name}</p>
              {(() => {
                const user = task.assignee ?? task.reporter;
                if (!user) return null;
                const role = task.assignee ? t("assignee") : t("reporter");
                return (
                  <div className="mt-2 flex items-center gap-2 border-t border-gray-700 pt-2">
                    <MemberAvatar
                      size="xxs"
                      username={user.fullName || user.username}
                      capitalLetters={user.capitalLetters}
                      color={user.color}
                    />
                    <span className="text-xs text-gray-300">
                      {user.fullName || user.username}
                    </span>
                    <span className="text-xs text-gray-500">
                      ({role})
                    </span>
                  </div>
                );
              })()}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
