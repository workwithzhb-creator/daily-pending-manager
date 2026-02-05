"use client";

import { UserProfile } from "./profile-setup-sheet";

export function AccountPlanSheet({
  open,
  onClose,
  profile,
  plan,
  onUpgrade,
  onEditProfile,
  onLogout,
}: {
  open: boolean;
  onClose: () => void;
  profile: UserProfile | null;
  plan: "free" | "basic";
  onUpgrade: () => void;
  onEditProfile: () => void;
  onLogout: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Background blur */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Bottom sheet */}
      <div className="absolute bottom-0 left-0 right-0">
        <div
          className="
            max-w-lg mx-auto
            rounded-t-3xl
            bg-gradient-to-b from-white to-slate-50
            px-6 pt-5 pb-7
            shadow-2xl
          "
        >
          {/* Drag handle */}
          <div className="h-1 w-10 bg-slate-300/70 rounded-full mx-auto mb-4" />

          {/* Header with close button */}
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">
              Account & Plan
            </h3>
            <button
              onClick={onClose}
              className="
                -mt-1 -mr-2 p-2
                rounded-full
                text-slate-400
                hover:text-slate-600
                hover:bg-slate-100
                transition-colors
              "
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* User Name */}
          <div className="mb-6">
            <p className="text-sm text-slate-500 mb-1">User</p>
            <p className="text-base font-medium text-slate-900">
              {profile?.name || "Guest"}
            </p>
          </div>

          {/* Current Plan */}
          <div className="mb-6">
            <p className="text-sm text-slate-500 mb-2">Current Plan</p>
            <div className="flex items-center gap-2 mb-3">
              <span
                className={`
                  px-3 py-1 rounded-full text-xs font-semibold
                  ${
                    plan === "basic"
                      ? "bg-gradient-to-br from-indigo-500 to-purple-500 text-white"
                      : "bg-slate-200 text-slate-600"
                  }
                `}
              >
                {plan === "basic" ? "Basic" : "Free"}
              </span>
            </div>
            {plan === "basic" && (
              <p className="text-sm text-slate-600">
                Basic – $5/month · Unlimited tasks
              </p>
            )}
            {plan === "free" && (
              <p className="text-sm text-slate-600">
                Free – 10 active tasks limit
              </p>
            )}
          </div>

          {/* Upgrade Button (only show for free plan) */}
          {plan === "free" && (
            <div className="mb-4">
              <button
                onClick={onUpgrade}
                className="
                  w-full h-12 rounded-2xl text-sm font-semibold
                  bg-gradient-to-br from-indigo-500 to-purple-500
                  text-white shadow-lg shadow-indigo-500/30
                  transition-all duration-200
                  active:scale-[0.98]
                "
              >
                Upgrade to Basic
              </button>
            </div>
          )}

          {/* Pro Plan Coming Soon */}
          <p className="text-[11px] text-slate-400 text-center mb-4">
            Pro plan coming soon
          </p>

          {/* Edit Profile Button */}
          <button
            onClick={onEditProfile}
            className="
              w-full h-11 rounded-2xl text-sm font-medium
              text-slate-600
              border border-slate-200
              hover:bg-slate-50
              transition-colors
              mb-3
            "
          >
            Edit Profile
          </button>

          {/* Logout Button */}
          <button
            onClick={onLogout}
            className="
              w-full h-11 rounded-2xl text-sm font-medium
              text-red-600
              border border-red-200
              hover:bg-red-50
              transition-colors
            "
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
