"use client";

interface MemberAvatarProps {
  /** Username to display initials from */
  username?: string;
  /** Pre-computed capital letters (overrides username) */
  capitalLetters?: string;
  /** Background color (defaults to blue if not provided) */
  color?: string;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Additional className */
  className?: string;
}

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
};

/**
 * Reusable member avatar component showing colored circle with initials.
 * Used for displaying team members, assignees, reporters, etc.
 */
export function MemberAvatar({
  username,
  capitalLetters,
  color = "#3b82f6",
  size = "md",
  className = "",
}: MemberAvatarProps) {
  const initials =
    capitalLetters || username?.slice(0, 2).toUpperCase() || "??";

  return (
    <div
      className={`flex items-center justify-center rounded-full font-medium text-white ${sizeClasses[size]} ${className}`}
      style={{ backgroundColor: color }}
    >
      {initials}
    </div>
  );
}

interface MemberItemProps {
  /** Member display name (fullName preferred) */
  name: string;
  /** Member email */
  email?: string;
  /** Pre-computed capital letters */
  capitalLetters?: string;
  /** Avatar background color */
  color?: string;
  /** Optional right-side content (buttons, badges) */
  rightContent?: React.ReactNode;
  /** Click handler */
  onClick?: () => void;
  /** Additional className */
  className?: string;
}

/**
 * Complete member list item with avatar, name, email, and optional actions.
 */
export function MemberItem({
  name,
  email,
  capitalLetters,
  color,
  rightContent,
  onClick,
  className = "",
}: MemberItemProps) {
  const Component = onClick ? "button" : "div";

  return (
    <Component
      className={`flex w-full items-center gap-3 px-6 py-3 ${
        onClick ? "cursor-pointer text-left hover:bg-gray-50" : ""
      } ${className}`}
      onClick={onClick}
      type={onClick ? "button" : undefined}
    >
      <MemberAvatar
        username={name}
        capitalLetters={capitalLetters}
        color={color}
      />
      <div className="flex-1">
        <p className="font-medium text-gray-900">{name}</p>
        {email && <p className="text-sm text-gray-500">{email}</p>}
      </div>
      {rightContent}
    </Component>
  );
}
