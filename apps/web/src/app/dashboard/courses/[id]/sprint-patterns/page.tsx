"use client";

import { BackButton } from "@/components/BackButton";
import { useDateFormat } from "@/utils/useDateFormat";
import {
  coursesApi,
  sprintPatternsApi,
  useAuth,
  useMutation,
  useQuery,
} from "@trackdev/api-client";
import type {
  SprintPattern,
  SprintPatternItemRequest,
  SprintPatternRequest,
} from "@trackdev/types";
import {
  AlertCircle,
  Calendar,
  Clock,
  Copy,
  Edit2,
  Layers,
  Loader2,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";

interface PatternFormData {
  name: string;
  items: SprintPatternItemRequest[];
}

const defaultItem: SprintPatternItemRequest = {
  name: "",
  startDate: "",
  endDate: "",
  orderIndex: 0,
};

export default function SprintPatternsPage() {
  const params = useParams();
  const courseId = Number(params.id);
  const { user } = useAuth();
  const { formatDateTimeRange, toLocal, toUTC } = useDateFormat();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPattern, setEditingPattern] = useState<SprintPattern | null>(
    null,
  );
  const [formData, setFormData] = useState<PatternFormData>({
    name: "",
    items: [{ ...defaultItem }],
  });

  // Fetch course details for authorization check
  const { data: course } = useQuery(
    () => coursesApi.getDetails(courseId),
    [courseId],
    { enabled: !!courseId },
  );

  // Fetch sprint patterns for this course
  const {
    data: patternsData,
    isLoading,
    error,
    refetch,
  } = useQuery(() => sprintPatternsApi.getByCourse(courseId), [courseId], {
    enabled: !!courseId,
  });

  const patterns = patternsData?.sprintPatterns || [];

  const userRoles = user?.roles || [];
  const isAdmin = userRoles.includes("ADMIN");
  const isProfessor = userRoles.includes("PROFESSOR");
  const canManage = isAdmin || (isProfessor && course?.ownerId === user?.id);

  // Create mutation
  const createMutation = useMutation(
    (data: SprintPatternRequest) => sprintPatternsApi.create(courseId, data),
    {
      onSuccess: () => {
        setShowCreateModal(false);
        resetForm();
        refetch();
      },
    },
  );

  // Update mutation
  const updateMutation = useMutation(
    ({ id, data }: { id: number; data: SprintPatternRequest }) =>
      sprintPatternsApi.update(id, data),
    {
      onSuccess: () => {
        setEditingPattern(null);
        resetForm();
        refetch();
      },
    },
  );

  // Delete mutation
  const deleteMutation = useMutation(
    (id: number) => sprintPatternsApi.delete(id),
    {
      onSuccess: () => {
        refetch();
      },
    },
  );

  const resetForm = () => {
    setFormData({ name: "", items: [{ ...defaultItem }] });
  };

  const openEditModal = (pattern: SprintPattern) => {
    setEditingPattern(pattern);
    setFormData({
      name: pattern.name,
      items: pattern.items.map((item, idx) => ({
        name: item.name,
        // Convert UTC dates to local timezone for datetime-local input
        startDate: toLocal(item.startDate),
        endDate: toLocal(item.endDate),
        orderIndex: item.orderIndex ?? idx,
      })),
    });
  };

  const openDuplicateModal = (pattern: SprintPattern) => {
    setShowCreateModal(true);
    setFormData({
      name: `Copy of ${pattern.name}`,
      items: pattern.items.map((item, idx) => ({
        name: item.name,
        // Convert UTC dates to local timezone for datetime-local input
        startDate: toLocal(item.startDate),
        endDate: toLocal(item.endDate),
        orderIndex: item.orderIndex ?? idx,
      })),
    });
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setEditingPattern(null);
    resetForm();
  };

  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { ...defaultItem, orderIndex: prev.items.length }],
    }));
  };

  const removeItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const updateItem = (
    index: number,
    field: keyof SprintPatternItemRequest,
    value: string | number,
  ) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item,
      ),
    }));
  };

  const handleSubmit = () => {
    const request: SprintPatternRequest = {
      name: formData.name,
      items: formData.items.map((item, idx) => ({
        ...item,
        orderIndex: idx,
        // Convert local datetime input to UTC for API
        startDate: toUTC(item.startDate) || undefined,
        endDate: toUTC(item.endDate) || undefined,
      })),
    };

    if (editingPattern) {
      updateMutation.mutate({ id: editingPattern.id, data: request });
    } else {
      createMutation.mutate(request);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this sprint pattern?")) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="card px-6 py-12 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            Failed to load sprint patterns
          </h3>
          <p className="mt-2 text-gray-500">Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <BackButton
          fallbackHref={`/dashboard/courses/${courseId}`}
          label="Back"
          className="mb-4"
        />

        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-indigo-600">
              <Layers className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Sprint Patterns
              </h1>
              <p className="mt-1 text-gray-600">
                Create reusable sprint templates for your projects
              </p>
            </div>
          </div>

          {canManage && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              New Pattern
            </button>
          )}
        </div>
      </div>

      {/* Patterns List */}
      {patterns.length === 0 ? (
        <div className="card px-6 py-12 text-center">
          <Layers className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            No sprint patterns yet
          </h3>
          <p className="mt-2 text-gray-500">
            Create a sprint pattern to define reusable sprint templates.
          </p>
          {canManage && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary mt-4"
            >
              Create First Pattern
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {patterns.map((pattern) => (
            <div key={pattern.id} className="card p-4">
              <div className="mb-3 flex items-start justify-between">
                <h3 className="font-semibold text-gray-900">{pattern.name}</h3>
                {canManage && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEditModal(pattern)}
                      className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                      title="Edit"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => openDuplicateModal(pattern)}
                      className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                      title="Duplicate"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(pattern.id)}
                      className="rounded p-1 text-gray-400 hover:bg-red-100 hover:text-red-600"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                {pattern.items.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="flex items-center gap-2 rounded bg-gray-50 px-3 py-2 text-sm"
                  >
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-xs font-medium text-indigo-700">
                      {idx + 1}
                    </span>
                    <span className="flex-1 font-medium text-gray-700">
                      {item.name}
                    </span>
                    {item.startDate && item.endDate && (
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Calendar className="h-3 w-3" />
                        {formatDateTimeRange(item.startDate, item.endDate)}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
                <Clock className="h-4 w-4" />
                {pattern.items.length} sprint
                {pattern.items.length !== 1 ? "s" : ""}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {(showCreateModal || editingPattern) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingPattern
                  ? "Edit Sprint Pattern"
                  : "Create Sprint Pattern"}
              </h2>
              <button
                onClick={closeModal}
                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Pattern Name */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Pattern Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="e.g., Standard 2-Week Sprints"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>

              {/* Sprint Items */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700">
                    Sprints
                  </label>
                  <button
                    onClick={addItem}
                    className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"
                  >
                    <Plus className="h-4 w-4" />
                    Add Sprint
                  </button>
                </div>

                <div className="space-y-3">
                  {formData.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg border border-gray-200 bg-gray-50 p-3"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-sm font-medium text-indigo-700">
                          {idx + 1}
                        </span>
                        {formData.items.length > 1 && (
                          <button
                            onClick={() => removeItem(idx)}
                            className="rounded p-1 text-gray-400 hover:bg-red-100 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid gap-3 sm:grid-cols-3">
                        <div>
                          <label className="mb-1 block text-xs text-gray-500">
                            Sprint Name
                          </label>
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) =>
                              updateItem(idx, "name", e.target.value)
                            }
                            placeholder="Sprint 1"
                            className="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs text-gray-500">
                            Start Date & Time
                          </label>
                          <input
                            type="datetime-local"
                            value={item.startDate || ""}
                            onChange={(e) =>
                              updateItem(idx, "startDate", e.target.value)
                            }
                            className="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs text-gray-500">
                            End Date & Time
                          </label>
                          <input
                            type="datetime-local"
                            value={item.endDate || ""}
                            onChange={(e) =>
                              updateItem(idx, "endDate", e.target.value)
                            }
                            className="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={closeModal} className="btn-secondary">
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={
                  !formData.name ||
                  formData.items.some((item) => !item.name) ||
                  createMutation.isLoading ||
                  updateMutation.isLoading
                }
                className="btn-primary flex items-center gap-2"
              >
                {(createMutation.isLoading || updateMutation.isLoading) && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                <Save className="h-4 w-4" />
                {editingPattern ? "Save Changes" : "Create Pattern"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
