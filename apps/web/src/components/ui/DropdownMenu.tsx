"use client";

import { MoreVertical } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export interface DropdownMenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: "default" | "danger";
  disabled?: boolean;
}

export interface DropdownMenuProps {
  items: DropdownMenuItem[];
  /** Custom trigger button. If not provided, uses the default 3-dot icon */
  trigger?: React.ReactNode;
  /** Position of the dropdown relative to the trigger */
  align?: "left" | "right";
  /** Additional class names for the trigger button */
  triggerClassName?: string;
}

export function DropdownMenu({
  items,
  trigger,
  align = "right",
  triggerClassName = "",
}: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Close dropdown on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen]);

  const handleItemClick = (item: DropdownMenuItem) => {
    if (!item.disabled) {
      item.onClick();
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={
          triggerClassName ||
          "rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
        }
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        {trigger || <MoreVertical className="h-5 w-5" />}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute z-50 mt-1 min-w-[160px] rounded-lg border border-gray-200 bg-white py-1 shadow-lg ${
            align === "right" ? "right-0" : "left-0"
          }`}
          role="menu"
        >
          {items.map((item, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleItemClick(item)}
              disabled={item.disabled}
              className={`flex w-full items-center gap-2 px-4 py-2 text-left text-sm transition-colors ${
                item.disabled
                  ? "cursor-not-allowed text-gray-300"
                  : item.variant === "danger"
                    ? "text-red-600 hover:bg-red-50"
                    : "text-gray-700 hover:bg-gray-100"
              }`}
              role="menuitem"
            >
              {item.icon && <span className="h-4 w-4">{item.icon}</span>}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
