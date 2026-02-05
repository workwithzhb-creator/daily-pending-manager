"use client";

export function MigrationModal({
  open,
  onImport,
  onSkip,
}: {
  open: boolean;
  onImport: () => void;
  onSkip: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onSkip}
        aria-hidden
      />
      <div
        className="relative max-w-sm w-full rounded-3xl bg-gradient-to-b from-white to-slate-50/95 px-6 py-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-slate-900 text-center mb-2">
          Import Existing Tasks?
        </h2>
        <p className="text-sm text-slate-600 text-center mt-4 leading-relaxed">
          We found tasks saved on this device. Would you like to import them to
          your account?
        </p>
        <div className="mt-8 space-y-3">
          <button
            onClick={onImport}
            className="w-full h-12 rounded-2xl text-sm font-semibold bg-gradient-to-br from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/25 active:scale-[0.98] transition-transform"
          >
            Import Tasks
          </button>
          <button
            onClick={onSkip}
            className="w-full h-11 rounded-2xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}
