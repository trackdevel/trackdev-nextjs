"use client";

import { GitHubUsernameEditor } from "@/components/settings/GitHubUsernameEditor";
import { LanguageSelector } from "@/components/settings/LanguageSelector";
import { TimezoneSelector } from "@/components/settings/TimezoneSelector";
import { PageContainer, PageHeader } from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import {
  ApiClientError,
  authApi,
  useAuth,
  usersApi,
} from "@trackdev/api-client";
import {
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  Globe,
  Key,
  Loader2,
  Mail,
  Palette,
  Shield,
  User,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useActionState, useEffect, useState } from "react";

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const t = useTranslations("settings");
  const toast = useToast();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(tabParam || "profile");

  // Profile form state
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [color, setColor] = useState(user?.color || "");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Update form state when user data changes
  useEffect(() => {
    if (user) {
      setFullName(user.fullName || "");
      setEmail(user.email || "");
      setColor(user.color || "");
    }
  }, [user]);

  // Update active tab when URL param changes
  useEffect(() => {
    if (tabParam && ["profile", "preferences", "security"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // Handle profile save
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);

    try {
      await usersApi.updateSelf({
        fullName: fullName.trim() || undefined,
        email: email.trim() || undefined,
        color: color.trim() || undefined,
      });
      await refreshUser();
      toast.success(t("profileSavedSuccess"));
    } catch (err) {
      const errorMessage =
        err instanceof ApiClientError && err.body?.message
          ? err.body.message
          : t("unexpectedError");
      toast.error(errorMessage);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const userRoles = user?.roles || [];

  const tabs = [
    { id: "profile", label: t("profile"), icon: User },
    { id: "preferences", label: t("preferences"), icon: Globe },
    { id: "security", label: t("security"), icon: Key },
  ];

  return (
    <PageContainer>
      <PageHeader title={t("title")} description={t("subtitle")} />

      <div className="grid gap-8 lg:grid-cols-4">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-left text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? "bg-primary-50 text-primary-700"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          {activeTab === "profile" && (
            <div className="card">
              <div className="border-b px-6 py-4">
                <h2 className="font-semibold text-gray-900">
                  {t("profileInfo")}
                </h2>
                <p className="text-sm text-gray-500">
                  {t("profileInfoDescription")}
                </p>
              </div>
              <div className="p-6">
                {/* Avatar */}
                <div className="mb-6 flex items-center gap-4">
                  <div
                    className="flex h-20 w-20 items-center justify-center rounded-full text-2xl font-bold text-white"
                    style={{ backgroundColor: user?.color || "#3b82f6" }}
                  >
                    {user?.capitalLetters ||
                      user?.fullName?.slice(0, 2).toUpperCase() ||
                      user?.username?.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {user?.fullName || user?.username}
                    </p>
                    <p className="text-sm text-gray-500">{user?.email}</p>
                    <div className="mt-2 flex gap-2">
                      {userRoles.map((role) => (
                        <span
                          key={role}
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                            role === "ADMIN"
                              ? "bg-red-100 text-red-700"
                              : role === "PROFESSOR"
                                ? "bg-purple-100 text-purple-700"
                                : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          <Shield className="h-3 w-3" />
                          {role}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Form */}
                <form className="space-y-4" onSubmit={handleSaveProfile}>
                  <div>
                    <label htmlFor="username" className="label">
                      {t("username")}
                    </label>
                    <div className="relative mt-1">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="username"
                        type="text"
                        value={user?.username || ""}
                        readOnly
                        disabled
                        className="input pl-10 bg-gray-50 text-gray-500 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="fullName" className="label">
                      {t("fullName")}
                    </label>
                    <div className="relative mt-1">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="fullName"
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="input pl-10"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="email" className="label">
                      Email
                    </label>
                    <div className="relative mt-1">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Mail className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="input pl-10"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="color" className="label">
                      {t("avatarColor")}
                    </label>
                    <div className="relative mt-1">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Palette className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="color"
                        type="text"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="input pl-10"
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      {t("avatarColorHint")}
                    </p>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button
                      type="submit"
                      className="btn-primary inline-flex items-center gap-2"
                      disabled={isSavingProfile}
                    >
                      {isSavingProfile && (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      )}
                      {t("saveChanges")}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {activeTab === "preferences" && (
            <div className="card">
              <div className="border-b px-6 py-4">
                <h2 className="font-semibold text-gray-900">
                  {t("preferencesSettings")}
                </h2>
                <p className="text-sm text-gray-500">
                  {t("preferencesSettingsDescription")}
                </p>
              </div>
              <div className="p-6">
                <div className="space-y-6">
                  <div>
                    <label className="label">{t("language")}</label>
                    <p className="mb-2 text-sm text-gray-500">
                      {t("languageDescription")}
                    </p>
                    <LanguageSelector showLabel={false} />
                  </div>
                  <div>
                    <label className="label">{t("timezone")}</label>
                    <p className="mb-2 text-sm text-gray-500">
                      {t("timezoneDescription")}
                    </p>
                    <TimezoneSelector showLabel={false} />
                  </div>
                  <div>
                    <p className="mb-2 text-sm text-gray-500">
                      {t("githubUsernameDescription")}
                    </p>
                    <GitHubUsernameEditor showLabel={true} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "security" && <SecuritySettings />}
        </div>
      </div>
    </PageContainer>
  );
}

/**
 * Security settings component with password change functionality
 * Uses React 19 useActionState for form handling
 */

interface PasswordFormState {
  error: string | null;
  success: boolean;
}

function SecuritySettings() {
  const t = useTranslations("settings");
  const toast = useToast();

  // Form field state (controlled inputs for validation UI)
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Password validation
  const hasMinLength = newPassword.length >= 8;
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasNumber = /\d/.test(newPassword);
  const passwordsMatch =
    newPassword === confirmPassword && newPassword.length > 0;
  const isPasswordValid =
    hasMinLength && hasLowercase && hasUppercase && hasNumber;

  // React 19: useActionState for form submission
  const [state, formAction, isPending] = useActionState<
    PasswordFormState,
    FormData
  >(
    async (_prevState, formData) => {
      const oldPassword = formData.get("currentPassword") as string;
      const newPwd = formData.get("newPassword") as string;
      const confirmPwd = formData.get("confirmPassword") as string;

      // Client-side validation
      if (!oldPassword) {
        return { error: t("currentPasswordRequired"), success: false };
      }

      if (newPwd !== confirmPwd) {
        return { error: t("passwordsDoNotMatch"), success: false };
      }

      const pwdHasMinLength = newPwd.length >= 8;
      const pwdHasLowercase = /[a-z]/.test(newPwd);
      const pwdHasUppercase = /[A-Z]/.test(newPwd);
      const pwdHasNumber = /\d/.test(newPwd);
      const pwdIsValid =
        pwdHasMinLength && pwdHasLowercase && pwdHasUppercase && pwdHasNumber;

      if (!pwdIsValid) {
        return { error: t("passwordRequirements"), success: false };
      }

      try {
        await authApi.changePassword({
          oldPassword,
          newPassword: newPwd,
        });

        toast.success(t("passwordChangedSuccess"));

        // Clear form fields
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");

        return { error: null, success: true };
      } catch (err) {
        if (err instanceof ApiClientError) {
          return { error: err.getUserMessage(), success: false };
        }
        return { error: t("unexpectedError"), success: false };
      }
    },
    { error: null, success: false },
  );

  return (
    <div className="card">
      <div className="border-b px-6 py-4">
        <h2 className="font-semibold text-gray-900">{t("securitySettings")}</h2>
        <p className="text-sm text-gray-500">
          {t("securitySettingsDescription")}
        </p>
      </div>
      <div className="p-6">
        <form className="space-y-4" action={formAction}>
          {state.error && (
            <div className="flex items-center gap-2 rounded-md bg-red-50 p-4 text-sm text-red-700">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span>{state.error}</span>
            </div>
          )}

          {state.success && (
            <div className="flex items-center gap-2 rounded-md bg-green-50 p-4 text-sm text-green-700">
              <CheckCircle className="h-5 w-5 flex-shrink-0" />
              <span>{t("passwordChangedSuccess")}</span>
            </div>
          )}

          <div>
            <label htmlFor="current-password" className="label">
              {t("currentPassword")}
            </label>
            <div className="relative mt-1">
              <input
                id="current-password"
                name="currentPassword"
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="input pr-10"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3"
              >
                {showCurrentPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="new-password" className="label">
              {t("newPassword")}
            </label>
            <div className="relative mt-1">
              <input
                id="new-password"
                name="newPassword"
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="input pr-10"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3"
              >
                {showNewPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirm-password" className="label">
              {t("confirmNewPassword")}
            </label>
            <div className="relative mt-1">
              <input
                id="confirm-password"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input pr-10"
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
          {newPassword.length > 0 && (
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
          )}

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={
                isPending ||
                !isPasswordValid ||
                !passwordsMatch ||
                !currentPassword
              }
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                t("updatePassword")
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
