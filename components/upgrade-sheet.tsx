"use client";

export function UpgradeSheet({
  open,
  onUpgrade,
  onClose,
}: {
  open: boolean;
  onUpgrade: () => void;
  onClose: () => void;
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

          {/* Title */}
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            Upgrade to Basic
          </h3>

          <p className="text-sm text-slate-600 leading-relaxed">
            Free plan allows only 10 active tasks.
            <br />
            Basic plan gives unlimited task tracking and WhatsApp follow-ups.
          </p>

          {/* Primary Button */}
          <div className="mt-6">
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
              Upgrade to Basic ($5/month)
            </button>
          </div>

          {/* Secondary Button */}
          <div className="mt-3">
            <button
              onClick={onClose}
              className="
                w-full h-11 rounded-2xl text-sm font-medium
                text-slate-600
                hover:bg-slate-100
                transition-colors
              "
            >
              Not now
            </button>
          </div>

          {/* Muted Text */}
          <p className="text-[11px] text-slate-400 text-center mt-4">
            Pro plan coming soon
          </p>
        </div>
      </div>
    </div>
  );
}
