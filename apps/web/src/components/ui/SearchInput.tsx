"use client";

import { Search, X } from "lucide-react";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
  className = "max-w-md",
}: SearchInputProps) {
  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 py-2 pl-10 pr-10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-primary-500 focus:outline-hidden focus:ring-1 focus:ring-primary-500"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-sm p-0.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600 hover:text-gray-600 dark:hover:text-gray-200"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
