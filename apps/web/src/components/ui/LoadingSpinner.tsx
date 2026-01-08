"use client";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "h-4 w-4 border-2",
  md: "h-8 w-8 border-4",
  lg: "h-12 w-12 border-4",
};

export function LoadingSpinner({
  size = "md",
  className = "",
}: LoadingSpinnerProps) {
  return (
    <div
      className={`animate-spin rounded-full border-primary-600 border-t-transparent ${sizeClasses[size]} ${className}`}
    />
  );
}

interface LoadingContainerProps {
  className?: string;
}

export function LoadingContainer({
  className = "py-12",
}: LoadingContainerProps) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <LoadingSpinner />
    </div>
  );
}
