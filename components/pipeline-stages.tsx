"use client";

import { PendingItem, PendingType } from "./deal-card";

const COLOR_MAP: Record<PendingType, string> = {
  quotation: "bg-cyan-500",
  followup: "bg-purple-500",
  delivery: "bg-emerald-500",
  invoice: "bg-blue-500",
  paymentFollowup: "bg-rose-500",
  completed: "bg-lime-500",
};

export function PipelineStages({
  stages,
  activeStage,
  onSelect,
  items,
}: {
  stages: { type: PendingType; label: string }[];
  activeStage: PendingType | "all";
  onSelect: (stage: PendingType | "all") => void;
  items: PendingItem[];
}) {
  function getCount(type: PendingType) {
    return items.filter((i) => i.pendingType === type).length;
  }

  return (
    <div className="space-y-3">
      <p className="text-xs uppercase tracking-wide text-slate-400 px-1">
  Filter by activity
</p>

      <div className="space-y-2">
        {stages.map((stage) => {
          const count = getCount(stage.type);
          const active = activeStage === stage.type;

          return (
            <button
  key={stage.type}
  onClick={(e) => {
    e.stopPropagation();
    onSelect(stage.type);
  }}
              className={`
                w-full flex items-center justify-between
                rounded-2xl px-4 py-3
                bg-white
                border
                transition
                ${
                  active
                    ? "border-indigo-400 shadow-md"
                    : "border-slate-200"
                }
                hover:shadow-sm
                active:scale-[0.99]
              `}
            >
              {/* Left */}
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${COLOR_MAP[stage.type]}`}
                />

                <span
                  className="
                    text-sm font-medium text-slate-800
                    truncate
                  "
                >
                  {stage.label}
                </span>
              </div>

              {/* Count */}
              <span
                className="
                  text-sm font-semibold text-slate-700
                  min-w-[24px] text-right
                "
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
