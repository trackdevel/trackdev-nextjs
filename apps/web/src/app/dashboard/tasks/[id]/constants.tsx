import { AlertCircle, CheckCircle2, Clock, FileText } from "lucide-react";

// Status configuration for display
export const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bgColor: string; icon: React.ReactNode }
> = {
  BACKLOG: {
    label: "Backlog",
    color: "text-gray-700 dark:text-gray-300",
    bgColor: "bg-gray-100 dark:bg-gray-700",
    icon: <FileText className="h-4 w-4" />,
  },
  TODO: {
    label: "To Do",
    color: "text-gray-700 dark:text-gray-300",
    bgColor: "bg-gray-100 dark:bg-gray-700",
    icon: <Clock className="h-4 w-4" />,
  },
  INPROGRESS: {
    label: "In Progress",
    color: "text-blue-700 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
    icon: <Clock className="h-4 w-4" />,
  },
  VERIFY: {
    label: "Verify",
    color: "text-yellow-700 dark:text-yellow-400",
    bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
    icon: <AlertCircle className="h-4 w-4" />,
  },
  DONE: {
    label: "Done",
    color: "text-green-700 dark:text-green-400",
    bgColor: "bg-green-100 dark:bg-green-900/30",
    icon: <CheckCircle2 className="h-4 w-4" />,
  },
  DEFINED: {
    label: "Defined",
    color: "text-purple-700 dark:text-purple-400",
    bgColor: "bg-purple-100 dark:bg-purple-900/30",
    icon: <FileText className="h-4 w-4" />,
  },
};

export const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  USER_STORY: {
    label: "User Story",
    color:
      "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  },
  TASK: {
    label: "Task",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  BUG: {
    label: "Bug",
    color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
};
