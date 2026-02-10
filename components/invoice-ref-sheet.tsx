"use client";

import { useState, useEffect } from "react";

export function InvoiceRefSheet({
  open,
  onSave,
  onClose,
}: {
  open: boolean;
  onSave: (ref: string | null) => void;
  onClose: () => void;
}) {
  const [ref, setRef] = useState("");

  useEffect(() => {
    if (open) {
      setRef("");
    }
  }, [open]);

  if (!open) return null;

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
            Invoice Reference No. (Optional)
          </h3>
          <p className="text-sm text-slate-600 mb-6">
            Enter the invoice reference number if available.
          </p>

          {/* Input */}
          <div className="mb-6">
            <input
              type="text"
              value={ref}
              onChange={(e) => setRef(e.target.value)}
              placeholder="Enter reference number"
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
              onClick={() => {
                onSave(ref.trim() || null);
              }}
              className="
                w-full h-12 rounded-2xl text-sm font-semibold
                bg-gradient-to-br from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/30
                transition-all duration-200
                active:scale-[0.98]
              "
            >
              Continue
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
