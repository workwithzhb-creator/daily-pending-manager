"use client";

export function ProgressRing({
  completed,
  total,
}: {
  completed: number;
  total: number;
}) {
  const size = 64;
  const stroke = 6;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  const progress =
    total === 0 ? 0 : Math.min(completed / total, 1);

  const offset = circumference * (1 - progress);

  return (
    <div className="flex flex-col items-center justify-center w-24">
      {/* Glass container */}
      <div className="relative rounded-full p-2 bg-white/70 backdrop-blur-xl shadow-[0_8px_24px_rgba(0,0,0,0.08)] border border-white/60">
        {/* Ring */}
        <svg
          width={size}
          height={size}
          className="rotate-[-90deg]"
        >
          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(0,0,0,0.08)"
            strokeWidth={stroke}
            fill="transparent"
          />

          {/* Progress */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="url(#todayGradient)"
            strokeWidth={stroke}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{
              transition: "stroke-dashoffset 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          />

          {/* Gradient */}
          <defs>
            <linearGradient
              id="todayGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#fde68a" />
              <stop offset="60%" stopColor="#86efac" />
              <stop offset="100%" stopColor="#22c55e" />
            </linearGradient>
          </defs>
        </svg>

        {/* Inner soft disc */}
        <div className="absolute inset-3 rounded-full bg-white/90 shadow-inner" />

        {/* Soft highlight */}
        <div className="absolute inset-0 rounded-full pointer-events-none shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)]" />
      </div>

      {/* Label */}
      <span className="mt-2 text-[11px] text-slate-500">
        Today
      </span>
    </div>
  );
}
