"use client";

import { useAuth } from "@trackdev/api-client";
import { ArrowRight, CheckCircle, Layers, Users } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Navigation */}
      <nav className="border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xs">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <Layers className="h-8 w-8 text-primary-600" />
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              TrackDev
            </span>
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  Welcome, {user?.fullName || user?.username}
                </span>
                <Link href="/dashboard" className="btn-primary">
                  Dashboard
                </Link>
              </>
            ) : (
              <Link href="/login" className="btn-primary">
                Sign In
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl md:text-6xl">
            <span className="block">Agile Project Management</span>
            <span className="block text-primary-600 dark:text-primary-400">
              for Education
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600 dark:text-gray-300">
            TrackDev helps students learn agile methodologies by working
            together on real projects. Manage sprints, tasks, and track your
            team's progress.
          </p>
          <div className="mt-10 flex justify-center gap-4">
            {isAuthenticated ? (
              <Link
                href="/dashboard"
                className="btn-primary flex items-center gap-2 px-6 py-3 text-base"
              >
                Go to Dashboard
                <ArrowRight className="h-5 w-5" />
              </Link>
            ) : (
              <Link
                href="/login"
                className="btn-primary flex items-center gap-2 px-6 py-3 text-base"
              >
                Sign In
                <ArrowRight className="h-5 w-5" />
              </Link>
            )}
          </div>
        </div>

        {/* Features */}
        <div className="mt-24 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div className="card p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900/30">
              <Layers className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
              Sprint Management
            </h3>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              Plan and track sprints with your team. Visualize progress with
              burn-down charts and sprint boards.
            </p>
          </div>

          <div className="card p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900/30">
              <CheckCircle className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
              Task Tracking
            </h3>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              Create user stories and tasks. Track status, assign members, and
              estimate points for each item.
            </p>
          </div>

          <div className="card p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900/30">
              <Users className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
              Team Collaboration
            </h3>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              Work together with your team members. Comment on tasks, track
              history, and review contributions.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
