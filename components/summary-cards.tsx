"use client";

type Priority = "urgent" | "today" | null;

export function SummaryCards({
  urgent,
  today,
  active,
  onSelect,
}: {
  urgent: number;
  today: number;
  active: Priority;
  onSelect: (p: Priority) => void;
}) {
  return (
    <div className="flex gap-3 items-start -mt-4 w-full">
      {/* OVERDUE */}
      <button
        onClick={() => onSelect("urgent")}
        className={`
          relative flex-1 min-h-[56px]
          rounded-2xl px-4 py-2
          flex flex-col justify-between
          transition-all duration-200 ease-out
          ${
            active === "urgent"
              ? "bg-gradient-to-br from-rose-500 via-pink-500 to-orange-400 shadow-[0_12px_26px_rgba(251,113,133,0.4)] shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] scale-[0.98]"
              : "bg-gradient-to-br from-rose-400 via-pink-400 to-orange-300 shadow-[0_6px_16px_rgba(0,0,0,0.12)] opacity-75"
          }
          hover:-translate-y-[1px] hover:brightness-[1.05]
          active:translate-y-[0.5px]
        `}
      >
        {/* Count badge */}
        {urgent > 0 && (
          <span
            className="
              absolute -top-2 -right-2
              min-w-[22px] h-[22px] px-1
              rounded-full bg-white
              text-rose-600 text-[11px] font-bold
              flex items-center justify-center
              shadow-md
            "
          >
            {urgent}
          </span>
        )}

        {/* Label */}
        <div
          className="
            inline-flex items-center self-start
            px-2 py-[2px]
            rounded-full bg-white/85
            text-[10px] font-semibold tracking-wide
            text-rose-600
            whitespace-nowrap
          "
        >
          OVERDUE
        </div>
      </button>

      {/* DUE TODAY */}
      <button
        onClick={() => onSelect("today")}
        className={`
          relative flex-1 min-h-[56px]
          rounded-2xl px-4 py-2
          flex flex-col justify-between
          transition-all duration-200 ease-out
          ${
            active === "today"
              ? "bg-gradient-to-br from-yellow-500 via-amber-500 to-orange-400 shadow-[0_12px_26px_rgba(251,191,36,0.4)] shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] scale-[0.98]"
              : "bg-gradient-to-br from-yellow-400 via-amber-400 to-orange-300 shadow-[0_6px_16px_rgba(0,0,0,0.12)] opacity-75"
          }
          hover:-translate-y-[1px] hover:brightness-[1.05]
          active:translate-y-[0.5px]
        `}
      >
        {/* Count badge */}
        {today > 0 && (
          <span
            className="
              absolute -top-2 -right-2
              min-w-[22px] h-[22px] px-1
              rounded-full bg-white
              text-amber-700 text-[11px] font-bold
              flex items-center justify-center
              shadow-md
            "
          >
            {today}
          </span>
        )}

        {/* Label */}
        <div
          className="
            inline-flex items-center self-start
            px-2 py-[2px]
            rounded-full bg-white/90
            text-[10px] font-semibold tracking-wide
            text-amber-700
            whitespace-nowrap
          "
        >
          DUE TODAY
        </div>
      </button>
    </div>
  );
}
