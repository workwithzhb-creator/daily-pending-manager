"use client";

import { useState, useEffect } from "react";

export function InvoiceDueDateSheet({
  open,
  onSave,
  onClose,
}: {
  open: boolean;
  onSave: (dueDate: string) => void;
  onClose: () => void;
}) {
  const [dueDate, setDueDate] = useState("");

  useEffect(() => {
    if (open) {
      // Set default to today's date in YYYY-MM-DD format
      const today = new Date();
      const defaultDate = today.toISOString().split("T")[0];
      setDueDate(defaultDate);
    }
  }, [open]);

  if (!open) return null;

  const canSave = dueDate.trim() !== "";

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Bottom sheet */}
      <div
        className="absolute bottom-0 left-0 right-0"
        onClick={(e) => e.stopPropagation()}
      >
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

          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            Invoice Due Date
          </h3>
          <p className="text-sm text-slate-600 mb-6">
            We need this to remind you before payment becomes overdue.
          </p>

          {/* Date picker */}
          <div className="mb-6">
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="
                w-full rounded-2xl
                bg-white/80
                px-4 py-3
                text-sm text-slate-800
                shadow-sm
                outline-none
                ring-1 ring-slate-200/70
                focus:ring-2 focus:ring-indigo-400
                transition
              "
            />
          </div>

          {/* Buttons */}
          <div className="space-y-3">
            <button
              disabled={!canSave}
              onClick={() => {
                if (canSave) {
                  onSave(dueDate);
                }
              }}
              className={`
                w-full h-12 rounded-2xl text-sm font-semibold
                transition-all duration-200
                active:scale-[0.98]
                ${
                  canSave
                    ? "bg-gradient-to-br from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/30"
                    : "bg-slate-200 text-slate-400"
                }
              `}
            >
              Save & Continue
            </button>
            <button
              onClick={onClose}
              className="
                w-full h-11 rounded-2xl text-sm font-medium
                text-slate-600
                hover:bg-slate-100
                transition-colors
              "
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
