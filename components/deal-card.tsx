"use client";

export type PendingType =
  | "quotation"
  | "followup"
  | "delivery"
  | "invoice"
  | "paymentFollowup"
  | "completed";

export type PendingItem = {
  id: string;
  customerName: string;
  pendingType: PendingType;

  // ✅ FIX FOR VERCEL BUILD ERROR
  createdAt?: Date;
  stageUpdatedAt?: Date; // When task moved to current stage

  timePending: string;
  label: string;
  value?: string;

  // NEW (safe, optional)
  invoiceDueDate?: string;
  paymentStage?: "advance" | "balance";

  // optional future use
  whatsapp?: string;
  rfqNumber?: string;
  completedAt?: string;
};

const bgMap: Record<PendingType, string> = {
  quotation: "bg-cyan-50",
  followup: "bg-purple-50",
  delivery: "bg-emerald-50",
  invoice: "bg-blue-50",
  paymentFollowup: "bg-rose-50",
  completed: "bg-slate-100",
};

/* ---------- HELPERS ---------- */

function getPaymentReminder(dueDate?: string) {
  if (!dueDate) return null;

  const now = new Date();
  const due = new Date(dueDate);

  const diff = Math.ceil(
    (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diff < 0) return `Payment overdue by ${Math.abs(diff)} days`;
  if (diff <= 7) return `Payment due in ${diff} days`;

  return null;
}

/* ---------- COMPONENT ---------- */

export function DealCard({
  item,
  onClick,
}: {
  item: PendingItem;
  onClick: () => void;
}) {
  const reminder =
    item.pendingType === "paymentFollowup"
      ? getPaymentReminder(item.invoiceDueDate)
      : null;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-2xl p-4 transition
        ${bgMap[item.pendingType]}
        hover:shadow-md hover:scale-[1.01]
        border border-slate-200/60`}
    >
      <div className="flex justify-between items-start gap-3">
        <div className="min-w-0">
          <p className="font-medium text-slate-800 truncate">
            {item.customerName}
          </p>

          <p className="text-sm text-slate-600 mt-1 break-words">
            {item.label}
          </p>

          {/* 🔔 PAYMENT REMINDER */}
          {reminder && (
            <p className="mt-1 text-xs font-medium text-rose-600">
              ⏰ {reminder}
            </p>
          )}
        </div>

        <span className="text-xs text-slate-500 whitespace-nowrap shrink-0">
          {item.timePending}
        </span>
      </div>
    </button>
  );
}
