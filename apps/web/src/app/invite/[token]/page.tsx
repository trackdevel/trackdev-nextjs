"use client";

import { useToast } from "@/components/ui/Toast";
import {
  ApiClientError,
  invitesApi,
  useMutation,
  useQuery,
} from "@trackdev/api-client";
import {
  AlertCircle,
  BookOpen,
  Calendar,
  CheckCircle2,
  Lock,
  Mail,
  User,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

export default function AcceptInvitePage() {
  const params = useParams();
  const token = params.token as string;
  const toast = useToast();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    data: inviteInfo,
    isLoading,
    error: fetchError,
  } = useQuery(() => invitesApi.getByToken(token), [token], {
    enabled: !!token,
  });

  const acceptMutation = useMutation(
    (pwd?: string) =>
      invitesApi.accept(token, pwd ? { password: pwd } : undefined),
    {
      onSuccess: () => {
        setSuccess(true);
      },
      onError: (err: Error) => {
        const errorMessage =
          err instanceof ApiClientError && (err as ApiClientError).body?.message
            ? (err as ApiClientError).body!.message
            : "Failed to accept invitation";
        toast.error(errorMessage);
      },
    }
  );

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  if (fetchError || !inviteInfo) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <h1 className="mt-4 text-xl font-bold text-gray-900">
            Invalid Invitation
          </h1>
          <p className="mt-2 text-gray-600">
            This invitation link is invalid or has expired.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-block rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  if (inviteInfo.status !== "PENDING" || inviteInfo.expired) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-yellow-500" />
          <h1 className="mt-4 text-xl font-bold text-gray-900">
            {inviteInfo.status === "ACCEPTED"
              ? "Invitation Already Used"
              : inviteInfo.expired
              ? "Invitation Expired"
              : "Invitation Unavailable"}
          </h1>
          <p className="mt-2 text-gray-600">
            {inviteInfo.status === "ACCEPTED"
              ? "This invitation has already been accepted. You can log in to access the course."
              : inviteInfo.expired
              ? "This invitation has expired. Please contact your professor for a new invitation."
              : "This invitation is no longer available."}
          </p>
          <Link
            href="/login"
            className="mt-6 inline-block rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
          <h1 className="mt-4 text-xl font-bold text-gray-900">
            Successfully Enrolled!
          </h1>
          <p className="mt-2 text-gray-600">
            You have been enrolled in <strong>{inviteInfo.courseName}</strong> (
            {inviteInfo.startYear} - {inviteInfo.startYear + 1}).
          </p>
          <Link
            href="/login"
            className="mt-6 inline-block rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            Log In to Continue
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // If password is provided, validate it
    if (password) {
      if (password.length < 8) {
        setValidationError("Password must be at least 8 characters");
        return;
      }
      if (password !== confirmPassword) {
        setValidationError("Passwords do not match");
        return;
      }
    }

    acceptMutation.mutate(password || undefined);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-100">
            <BookOpen className="h-8 w-8 text-primary-600" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">
            Course Invitation
          </h1>
          <p className="mt-1 text-gray-600">
            You&apos;ve been invited to join a course on TrackDev
          </p>
        </div>

        {/* Invitation Details Card */}
        <div className="rounded-lg bg-white p-6 shadow-lg">
          <div className="mb-6 rounded-lg bg-gray-50 p-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {inviteInfo.courseName}
            </h2>
            <div className="mt-2 flex items-center gap-2 text-gray-600">
              <Calendar className="h-4 w-4" />
              <span>
                {inviteInfo.startYear} - {inviteInfo.startYear + 1}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-2 text-gray-600">
              <User className="h-4 w-4" />
              <span>Invited by {inviteInfo.invitedBy}</span>
            </div>
            <div className="mt-2 flex items-center gap-2 text-gray-600">
              <Mail className="h-4 w-4" />
              <span>{inviteInfo.email}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
              <p className="font-medium">Account Setup</p>
              <p className="mt-1">
                If you don&apos;t have a TrackDev account yet, enter a password
                below to create one. If you already have an account, leave the
                password empty and click accept.
              </p>
            </div>

            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Password (for new accounts only)
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  placeholder="Enter password (min 8 characters)"
                />
              </div>
            </div>

            {password && (
              <div className="mb-4">
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    placeholder="Confirm password"
                  />
                </div>
              </div>
            )}

            {validationError && (
              <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
                {validationError}
              </div>
            )}

            <button
              type="submit"
              disabled={acceptMutation.isLoading}
              className="w-full rounded-md bg-primary-600 py-2.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {acceptMutation.isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Processing...
                </span>
              ) : (
                "Accept Invitation"
              )}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-primary-600 hover:text-primary-700"
          >
            Log in here
          </Link>
        </p>
      </div>
    </div>
  );
}
