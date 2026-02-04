"use client";

export function FooterNav({
  onAddRFQ,
  onHome,
  onTasks,
}: {
  onAddRFQ: () => void;
  onHome: () => void;
  onTasks: () => void;
}) {
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40">
      <div className="flex items-center gap-2 px-3 py-2
        rounded-2xl bg-white/90 backdrop-blur shadow-lg">
        
        {/* Home */}
        <button
          onClick={onHome}
          className="px-4 py-2 rounded-xl text-sm
            text-slate-600 hover:bg-slate-100 transition"
        >
          Home
        </button>

        {/* Add RFQ */}
        <button
          onClick={onAddRFQ}
          className="px-5 py-2 rounded-xl text-sm font-semibold
            bg-gradient-to-br from-indigo-500 to-purple-500
            text-white shadow-md whitespace-nowrap"
        >
          + Add RFQ
        </button>

        {/* Tasks */}
        <button
          onClick={onTasks}
          className="px-4 py-2 rounded-xl text-sm
            text-slate-600 hover:bg-slate-100 transition"
        >
          Tasks
        </button>
      </div>
    </div>
  );
}
