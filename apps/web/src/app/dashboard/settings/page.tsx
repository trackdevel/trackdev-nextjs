"use client";

import { LanguageSelector } from "@/components/settings/LanguageSelector";
import { TimezoneSelector } from "@/components/settings/TimezoneSelector";
import { PageContainer, PageHeader } from "@/components/ui";
import { useAuth } from "@trackdev/api-client";
import { Globe, Key, Mail, Palette, Shield, User } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

export default function SettingsPage() {
  const { user } = useAuth();
  const t = useTranslations("settings");
  const [activeTab, setActiveTab] = useState("profile");

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
                <form className="space-y-4">
                  <div>
                    <label htmlFor="username" className="label">
                      {t("profile")}
                    </label>
                    <div className="relative mt-1">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="username"
                        type="text"
                        defaultValue={user?.username}
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
                        defaultValue={user?.email}
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
                        defaultValue={user?.color}
                        className="input pl-10"
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      {t("avatarColorHint")}
                    </p>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button type="submit" className="btn-primary">
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
                </div>
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="card">
              <div className="border-b px-6 py-4">
                <h2 className="font-semibold text-gray-900">
                  {t("securitySettings")}
                </h2>
                <p className="text-sm text-gray-500">
                  {t("securitySettingsDescription")}
                </p>
              </div>
              <div className="p-6">
                <form className="space-y-4">
                  <div>
                    <label htmlFor="current-password" className="label">
                      {t("currentPassword")}
                    </label>
                    <input
                      id="current-password"
                      type="password"
                      className="input mt-1"
                      placeholder="••••••••"
                    />
                  </div>

                  <div>
                    <label htmlFor="new-password" className="label">
                      {t("newPassword")}
                    </label>
                    <input
                      id="new-password"
                      type="password"
                      className="input mt-1"
                      placeholder="••••••••"
                    />
                  </div>

                  <div>
                    <label htmlFor="confirm-password" className="label">
                      {t("confirmNewPassword")}
                    </label>
                    <input
                      id="confirm-password"
                      type="password"
                      className="input mt-1"
                      placeholder="••••••••"
                    />
                  </div>

                  <div className="flex justify-end pt-4">
                    <button type="submit" className="btn-primary">
                      {t("updatePassword")}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
