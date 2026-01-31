"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  "aria-label"?: string;
}

/**
 * Custom Select component that renders a styled dropdown with consistent fonts.
 * Use this instead of native <select> to ensure the Inter font is used
 * in the dropdown menu across all browsers.
 */
export function Select({
  value,
  onChange,
  options,
  placeholder = "Select an option",
  disabled = false,
  required = false,
  className = "",
  "aria-label": ariaLabel,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setIsOpen(!isOpen);
    } else if (event.key === "ArrowDown" && !isOpen) {
      event.preventDefault();
      setIsOpen(true);
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Hidden native select for form submission and accessibility */}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        disabled={disabled}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Custom styled trigger */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`flex w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-left text-sm shadow-xs transition-colors focus:border-primary-500 focus:outline-hidden focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 ${
          disabled
            ? "cursor-not-allowed opacity-50"
            : "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
        }`}
      >
        <span
          className={
            selectedOption
              ? "text-gray-900 dark:text-white"
              : "text-gray-500 dark:text-gray-400"
          }
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-gray-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <ul
          role="listbox"
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-200 bg-white py-1 text-sm shadow-lg focus:outline-hidden dark:border-gray-600 dark:bg-gray-800"
        >
          {options.map((option) => (
            <li
              key={option.value}
              role="option"
              aria-selected={option.value === value}
              onClick={() => !option.disabled && handleSelect(option.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !option.disabled) {
                  handleSelect(option.value);
                }
              }}
              tabIndex={option.disabled ? -1 : 0}
              className={`cursor-pointer px-3 py-2 ${
                option.disabled
                  ? "cursor-not-allowed text-gray-400"
                  : option.value === value
                    ? "bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400"
                    : "text-gray-900 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
