"use client";

import { EntityAttributes } from "@/components/EntityAttributes";
import { tasksApi } from "@trackdev/api-client";
import { memo } from "react";

interface TaskAttributesProps {
  taskId: number;
  isProfessor: boolean;
  isAssignee: boolean;
}

export const TaskAttributes = memo(function TaskAttributes({
  taskId,
  isProfessor,
  isAssignee,
}: TaskAttributesProps) {
  // Attribute editing is intentionally allowed even when the task/project is
  // frozen — freezing blocks task changes but not student-applied attributes.
  const canEditScalar = (
    appliedBy: "STUDENT" | "PROFESSOR" | undefined,
  ): boolean => {
    if (isProfessor) return true;
    if (appliedBy === "STUDENT" && isAssignee) return true;
    return false;
  };

  return (
    <EntityAttributes
      entityId={taskId}
      fetchValues={() => tasksApi.getAttributeValues(taskId)}
      fetchAvailable={() => tasksApi.getAvailableAttributes(taskId)}
      setValue={(attrId, data) =>
        tasksApi.setAttributeValue(taskId, attrId, data)
      }
      deleteValue={(attrId) => tasksApi.deleteAttributeValue(taskId, attrId)}
      canEditScalar={canEditScalar}
      isProfessor={isProfessor}
    />
  );
});
