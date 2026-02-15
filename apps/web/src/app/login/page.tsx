"use client";

import { ApiClientError, useAuth } from "@trackdev/api-client";
import { AlertCircle, Layers, Lock, Mail } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

interface LoginFormState {
  error: string | null;
}

function LoginSubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary w-full py-3">
      {pending ? (
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
      ) : (
        label
      )}
    </button>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const t = useTranslations("auth");

  const [state, formAction] = useActionState<LoginFormState, FormData>(
    async (_prev, formData) => {
      const email = formData.get("email") as string;
      const password = formData.get("password") as string;

      try {
        await login({ email, password });
        router.push("/dashboard");
        return { error: null };
      } catch (err) {
        if (err instanceof ApiClientError) {
          return { error: err.getUserMessage() };
        }
        return { error: t("unexpectedError") };
      }
    },
    { error: null },
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8 dark:bg-gray-900">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <Layers className="h-10 w-10 text-primary-600" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              TrackDev
            </span>
          </Link>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            {t("signInTitle")}
          </h2>
        </div>

        <form className="mt-8 space-y-6" action={formAction}>
          {state.error && (
            <div className="flex items-center gap-2 rounded-md bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{state.error}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="label">
                {t("emailAddress")}
              </label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="input pl-10"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="label">
                {t("password")}
              </label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="input pl-10"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 rounded-sm border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700"
              />
              <label
                htmlFor="remember-me"
                className="ml-2 block text-sm text-gray-900 dark:text-gray-300"
              >
                {t("rememberMe")}
              </label>
            </div>

            <div className="text-sm">
              <Link
                href="/forgot-password"
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                {t("forgotPassword")}
              </Link>
            </div>
          </div>

          <LoginSubmitButton label={t("login")} />
        </form>
      </div>
    </div>
  );
}
