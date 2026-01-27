"use client";

import { CourseForm, SubjectCard, SubjectForm } from "@/components/subjects";
import {
  ConfirmDialog,
  EmptyState,
  LoadingContainer,
  Modal,
  PageContainer,
  PageHeader,
  SearchInput,
  SimplePagination,
} from "@/components/ui";
import {
  coursesApi,
  subjectsApi,
  useAuth,
  useMutation,
  useQuery,
} from "@trackdev/api-client";
import type { Course, Subject } from "@trackdev/types";
import { BookOpen, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

const ITEMS_PER_PAGE = 10;

export default function SubjectsPage() {
  const { isAuthenticated, user } = useAuth();
  const t = useTranslations("subjects");
  const tCommon = useTranslations("common");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedSubjects, setExpandedSubjects] = useState<Set<number>>(
    new Set(),
  );

  // Check if user is admin or workspace admin (can manage subjects)
  const isAdmin = user?.roles?.includes("ADMIN") ?? false;
  const isWorkspaceAdmin = user?.roles?.includes("WORKSPACE_ADMIN") ?? false;
  const canManageSubjects = isAdmin || isWorkspaceAdmin;

  // Modal states
  const [showCreateSubject, setShowCreateSubject] = useState(false);
  const [showEditSubject, setShowEditSubject] = useState(false);
  const [showCreateCourse, setShowCreateCourse] = useState(false);
  const [showEditCourse, setShowEditCourse] = useState(false);
  const [showDeleteSubject, setShowDeleteSubject] = useState(false);
  const [showDeleteCourse, setShowDeleteCourse] = useState(false);

  // Selected items
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  // Form states
  const [subjectForm, setSubjectForm] = useState({ name: "", acronym: "" });
  const [courseForm, setCourseForm] = useState({
    startYear: new Date().getFullYear(),
    githubOrganization: "",
  });

  // API queries
  const {
    data: subjectsResponse,
    isLoading,
    error,
    refetch,
  } = useQuery(
    () => subjectsApi.getAll(searchQuery || undefined),
    [searchQuery],
    {
      enabled: isAuthenticated,
    },
  );

  const subjects = subjectsResponse?.subjects || [];

  // Pagination logic
  const totalPages = Math.ceil(subjects.length / ITEMS_PER_PAGE);
  const paginatedSubjects = subjects.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  // Reset page when search changes
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  // Mutations
  const createSubjectMutation = useMutation(
    (data: { name: string; acronym: string }) => subjectsApi.create(data),
    {
      onSuccess: () => {
        setShowCreateSubject(false);
        setSubjectForm({ name: "", acronym: "" });
        refetch();
      },
    },
  );

  const updateSubjectMutation = useMutation(
    (data: { id: number; name: string; acronym: string }) =>
      subjectsApi.update(data.id, { name: data.name, acronym: data.acronym }),
    {
      onSuccess: () => {
        setShowEditSubject(false);
        setSelectedSubject(null);
        refetch();
      },
    },
  );

  const deleteSubjectMutation = useMutation(
    (id: number) => subjectsApi.delete(id),
    {
      onSuccess: () => {
        setShowDeleteSubject(false);
        setSelectedSubject(null);
        refetch();
      },
    },
  );

  const createCourseMutation = useMutation(
    (data: {
      subjectId: number;
      startYear: number;
      githubOrganization?: string;
    }) =>
      subjectsApi.createCourse(data.subjectId, {
        startYear: data.startYear,
        githubOrganization: data.githubOrganization,
      }),
    {
      onSuccess: () => {
        setShowCreateCourse(false);
        setSelectedSubject(null);
        setCourseForm({
          startYear: new Date().getFullYear(),
          githubOrganization: "",
        });
        refetch();
      },
    },
  );

  const updateCourseMutation = useMutation(
    (data: { id: number; startYear?: number; githubOrganization?: string }) =>
      coursesApi.update(data.id, {
        startYear: data.startYear,
        githubOrganization: data.githubOrganization,
      }),
    {
      onSuccess: () => {
        setShowEditCourse(false);
        setSelectedCourse(null);
        refetch();
      },
    },
  );

  const deleteCourseMutation = useMutation(
    (id: number) => coursesApi.delete(id),
    {
      onSuccess: () => {
        setShowDeleteCourse(false);
        setSelectedCourse(null);
        refetch();
      },
    },
  );

  // Toggle subject expansion
  const toggleSubjectExpand = (id: number) => {
    const newExpanded = new Set(expandedSubjects);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedSubjects(newExpanded);
  };

  // Subject handlers
  const openCreateSubject = () => {
    setSubjectForm({ name: "", acronym: "" });
    setShowCreateSubject(true);
  };

  const openEditSubject = (subject: Subject) => {
    setSelectedSubject(subject);
    setSubjectForm({ name: subject.name, acronym: subject.acronym });
    setShowEditSubject(true);
  };

  const openDeleteSubject = (subject: Subject) => {
    setSelectedSubject(subject);
    setShowDeleteSubject(true);
  };

  const handleCreateSubject = () => {
    createSubjectMutation.mutate(subjectForm);
  };

  const handleEditSubject = () => {
    if (selectedSubject) {
      updateSubjectMutation.mutate({
        id: selectedSubject.id,
        name: subjectForm.name,
        acronym: subjectForm.acronym,
      });
    }
  };

  const handleDeleteSubject = () => {
    if (selectedSubject) {
      deleteSubjectMutation.mutate(selectedSubject.id);
    }
  };

  // Course handlers
  const openCreateCourse = (subject: Subject) => {
    setSelectedSubject(subject);
    setCourseForm({
      startYear: new Date().getFullYear(),
      githubOrganization: "",
    });
    setShowCreateCourse(true);
  };

  const openEditCourse = (course: Course) => {
    setSelectedCourse(course);
    setCourseForm({
      startYear: course.startYear,
      githubOrganization: course.githubOrganization || "",
    });
    setShowEditCourse(true);
  };

  const openDeleteCourse = (course: Course) => {
    setSelectedCourse(course);
    setShowDeleteCourse(true);
  };

  const handleCreateCourse = () => {
    if (selectedSubject) {
      createCourseMutation.mutate({
        subjectId: selectedSubject.id,
        startYear: courseForm.startYear,
        githubOrganization: courseForm.githubOrganization || undefined,
      });
    }
  };

  const handleEditCourse = () => {
    if (selectedCourse) {
      updateCourseMutation.mutate({
        id: selectedCourse.id,
        startYear: courseForm.startYear,
        githubOrganization: courseForm.githubOrganization || undefined,
      });
    }
  };

  const handleDeleteCourse = () => {
    if (selectedCourse) {
      deleteCourseMutation.mutate(selectedCourse.id);
    }
  };

  return (
    <PageContainer>
      {/* Header */}
      <PageHeader
        title={t("title")}
        description={
          canManageSubjects
            ? t("manageSubjectsDescription")
            : t("browseSubjectsDescription")
        }
        action={
          canManageSubjects ? (
            <button
              onClick={openCreateSubject}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              {t("newSubject")}
            </button>
          ) : undefined
        }
      />

      {/* Search */}
      <div className="mb-6">
        <SearchInput
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder={t("searchSubjectsPlaceholder")}
          className="max-w-md"
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <LoadingContainer />
      ) : error ? (
        <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 px-6 py-12 text-center text-red-600 dark:text-red-400">
          {t("failedToLoadSubjects")}
        </div>
      ) : subjects.length > 0 ? (
        <div className="space-y-4">
          {paginatedSubjects.map((subject) => (
            <SubjectCard
              key={subject.id}
              subject={subject}
              isExpanded={expandedSubjects.has(subject.id)}
              isAdmin={canManageSubjects}
              userId={user?.id}
              onToggleExpand={toggleSubjectExpand}
              onCreateCourse={openCreateCourse}
              onEditSubject={openEditSubject}
              onDeleteSubject={openDeleteSubject}
              onEditCourse={openEditCourse}
              onDeleteCourse={openDeleteCourse}
            />
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <SimplePagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={subjects.length}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={setCurrentPage}
              itemLabel={t("subjects")}
            />
          )}
        </div>
      ) : (
        <EmptyState
          icon={<BookOpen className="h-12 w-12" />}
          title={t("noSubjects")}
          description={
            canManageSubjects
              ? t("createFirstSubject")
              : t("contactAdministrator")
          }
          action={
            canManageSubjects ? (
              <button onClick={openCreateSubject} className="btn-primary">
                <Plus className="mr-2 h-4 w-4" />
                {t("createSubject")}
              </button>
            ) : undefined
          }
        />
      )}

      {/* Create Subject Modal */}
      <Modal
        isOpen={showCreateSubject}
        onClose={() => setShowCreateSubject(false)}
        title={t("createSubject")}
      >
        <SubjectForm
          data={subjectForm}
          onChange={setSubjectForm}
          onSubmit={handleCreateSubject}
          onCancel={() => setShowCreateSubject(false)}
          isLoading={createSubjectMutation.isLoading}
          error={createSubjectMutation.error}
          submitLabel={tCommon("create")}
          loadingLabel={t("creating")}
        />
      </Modal>

      {/* Edit Subject Modal */}
      <Modal
        isOpen={showEditSubject}
        onClose={() => setShowEditSubject(false)}
        title={t("editSubject")}
      >
        <SubjectForm
          data={subjectForm}
          onChange={setSubjectForm}
          onSubmit={handleEditSubject}
          onCancel={() => setShowEditSubject(false)}
          isLoading={updateSubjectMutation.isLoading}
          error={updateSubjectMutation.error}
          submitLabel={tCommon("save")}
          loadingLabel={t("saving")}
        />
      </Modal>

      {/* Create Course Modal */}
      <Modal
        isOpen={showCreateCourse}
        onClose={() => setShowCreateCourse(false)}
        title={t("addCourseTo", { name: selectedSubject?.name || "" })}
      >
        <CourseForm
          data={courseForm}
          onChange={setCourseForm}
          onSubmit={handleCreateCourse}
          onCancel={() => setShowCreateCourse(false)}
          isLoading={createCourseMutation.isLoading}
          error={createCourseMutation.error}
          submitLabel={t("createCourse")}
          loadingLabel={t("creating")}
        />
      </Modal>

      {/* Edit Course Modal */}
      <Modal
        isOpen={showEditCourse}
        onClose={() => setShowEditCourse(false)}
        title={t("editCourse")}
      >
        <CourseForm
          data={courseForm}
          onChange={setCourseForm}
          onSubmit={handleEditCourse}
          onCancel={() => setShowEditCourse(false)}
          isLoading={updateCourseMutation.isLoading}
          error={updateCourseMutation.error}
          submitLabel={tCommon("save")}
          loadingLabel={t("saving")}
        />
      </Modal>

      {/* Delete Subject Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteSubject}
        onClose={() => setShowDeleteSubject(false)}
        onConfirm={handleDeleteSubject}
        title={t("deleteSubject")}
        message={t("deleteSubjectMessage", {
          name: selectedSubject?.name || "",
        })}
        isLoading={deleteSubjectMutation.isLoading}
      />

      {/* Delete Course Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteCourse}
        onClose={() => setShowDeleteCourse(false)}
        onConfirm={handleDeleteCourse}
        title={t("deleteCourse")}
        message={t("deleteCourseMessage", {
          year: selectedCourse?.startYear || 0,
          nextYear: (selectedCourse?.startYear || 0) + 1,
        })}
        isLoading={deleteCourseMutation.isLoading}
      />
    </PageContainer>
  );
}
