import { CheckCircle2, Clock, PlayCircle } from "lucide-react";
import { memo } from "react";

interface SprintStatusBadgeProps {
  status: string;
  statusText: string;
}

export const SprintStatusBadge = memo(function SprintStatusBadge({
  status,
  statusText,
}: SprintStatusBadgeProps) {
  const getStatusStyle = () => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "FUTURE":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "CLOSED":
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
      default:
        return "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400";
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case "ACTIVE":
        return <PlayCircle className="h-3 w-3" />;
      case "FUTURE":
        return <Clock className="h-3 w-3" />;
      case "CLOSED":
        return <CheckCircle2 className="h-3 w-3" />;
      default:
        return null;
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${getStatusStyle()}`}
    >
      {getStatusIcon()}
      {statusText}
    </span>
  );
});
