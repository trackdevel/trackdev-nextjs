"use client";

import { ApiClientError, authApi } from "@trackdev/api-client";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  Eye,
  EyeOff,
  Layers,
  Lock,
  XCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function ResetPasswordContent() {
  const t = useTranslations("auth");
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Password validation
  const hasMinLength = password.length >= 8;
  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const passwordsMatch = password === confirmPassword && password.length > 0;
  const isPasswordValid =
    hasMinLength && hasLowercase && hasUppercase && hasNumber;

  // Validate token on mount
  useEffect(() => {
    async function validateToken() {
      if (!token) {
        setIsValidating(false);
        setIsTokenValid(false);
        return;
      }

      try {
        const response = await authApi.validateResetToken(token);
        setIsTokenValid(response.valid);
      } catch {
        setIsTokenValid(false);
      } finally {
        setIsValidating(false);
      }
    }

    validateToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!passwordsMatch) {
      setError(t("passwordsDoNotMatch"));
      return;
    }

    if (!isPasswordValid) {
      setError(t("passwordRequirements"));
      return;
    }

    if (!token) {
      setError(t("invalidResetToken"));
      return;
    }

    setIsLoading(true);

    try {
      await authApi.resetPasswordWithToken({ token, newPassword: password });
      setSuccess(true);
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.getUserMessage());
      } else {
        setError(t("unexpectedError"));
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state while validating token
  if (isValidating) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
          <p className="mt-4 text-gray-600">{t("validatingToken")}</p>
        </div>
      </div>
    );
  }

  // Invalid or expired token
  if (!isTokenValid) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <Link href="/" className="inline-flex items-center gap-2">
              <Layers className="h-10 w-10 text-primary-600" />
              <span className="text-2xl font-bold text-gray-900">TrackDev</span>
            </Link>
            <div className="mt-8 flex justify-center">
              <XCircle className="h-16 w-16 text-red-500" />
            </div>
            <h2 className="mt-4 text-2xl font-bold tracking-tight text-gray-900">
              {t("invalidOrExpiredLink")}
            </h2>
            <p className="mt-4 text-gray-600">
              {t("invalidOrExpiredLinkDescription")}
            </p>
          </div>

          <div className="mt-6 space-y-4">
            <Link
              href="/forgot-password"
              className="btn-primary block w-full py-3 text-center"
            >
              {t("requestNewLink")}
            </Link>
            <Link
              href="/login"
              className="block text-center text-sm font-medium text-primary-600 hover:text-primary-500"
            >
              <span className="inline-flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                {t("backToLogin")}
              </span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <Link href="/" className="inline-flex items-center gap-2">
              <Layers className="h-10 w-10 text-primary-600" />
              <span className="text-2xl font-bold text-gray-900">TrackDev</span>
            </Link>
            <div className="mt-8 flex justify-center">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <h2 className="mt-4 text-2xl font-bold tracking-tight text-gray-900">
              {t("passwordResetSuccess")}
            </h2>
            <p className="mt-4 text-gray-600">
              {t("passwordResetSuccessDescription")}
            </p>
          </div>

          <div className="mt-6 text-center">
            <Link href="/login" className="btn-primary inline-block px-6 py-3">
              {t("goToLogin")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Reset password form
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <Layers className="h-10 w-10 text-primary-600" />
            <span className="text-2xl font-bold text-gray-900">TrackDev</span>
          </Link>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
            {t("resetPasswordTitle")}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {t("resetPasswordDescription")}
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="flex items-center gap-2 rounded-md bg-red-50 p-4 text-sm text-red-700">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="password" className="label">
                {t("newPassword")}
              </label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pl-10 pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="label">
                {t("confirmPassword")}
              </label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input pl-10 pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Password requirements */}
            <div className="rounded-md bg-gray-50 p-4">
              <p className="text-sm font-medium text-gray-700 mb-2">
                {t("passwordMustContain")}
              </p>
              <ul className="space-y-1 text-sm">
                <li
                  className={`flex items-center gap-2 ${hasMinLength ? "text-green-600" : "text-gray-500"}`}
                >
                  {hasMinLength ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border border-current" />
                  )}
                  {t("atLeast8Characters")}
                </li>
                <li
                  className={`flex items-center gap-2 ${hasLowercase ? "text-green-600" : "text-gray-500"}`}
                >
                  {hasLowercase ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border border-current" />
                  )}
                  {t("oneLowercaseLetter")}
                </li>
                <li
                  className={`flex items-center gap-2 ${hasUppercase ? "text-green-600" : "text-gray-500"}`}
                >
                  {hasUppercase ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border border-current" />
                  )}
                  {t("oneUppercaseLetter")}
                </li>
                <li
                  className={`flex items-center gap-2 ${hasNumber ? "text-green-600" : "text-gray-500"}`}
                >
                  {hasNumber ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border border-current" />
                  )}
                  {t("oneNumber")}
                </li>
                <li
                  className={`flex items-center gap-2 ${passwordsMatch ? "text-green-600" : "text-gray-500"}`}
                >
                  {passwordsMatch ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border border-current" />
                  )}
                  {t("passwordsMatch")}
                </li>
              </ul>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !isPasswordValid || !passwordsMatch}
            className="btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              t("resetPassword")
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
