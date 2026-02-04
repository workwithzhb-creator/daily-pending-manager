"use client";

export type PaymentTerm = "credit" | "advance" | "partial";

export function POPaymentTermsSheet({
  open,
  onSelect,
  onClose,
}: {
  open: boolean;
  onSelect: (term: PaymentTerm) => void;
  onClose: () => void;
}) {
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
            PO Received?
          </h3>
          <p className="text-sm text-slate-600 mb-6">
            Select payment terms mentioned in the PO
          </p>

          <div className="space-y-3">
            <button
              onClick={() => {
                onSelect("credit");
                onClose();
              }}
              className="
                w-full h-12 rounded-2xl px-4
                text-sm font-medium text-slate-700
                bg-white border border-slate-200
                hover:bg-slate-50
                active:scale-[0.98]
                transition-all
              "
            >
              100% Credit
            </button>

            <button
              onClick={() => {
                onSelect("advance");
                onClose();
              }}
              className="
                w-full h-12 rounded-2xl px-4
                text-sm font-medium text-slate-700
                bg-white border border-slate-200
                hover:bg-slate-50
                active:scale-[0.98]
                transition-all
              "
            >
              100% Advance
            </button>

            <button
              onClick={() => {
                onSelect("partial");
                onClose();
              }}
              className="
                w-full h-12 rounded-2xl px-4
                text-sm font-medium text-slate-700
                bg-white border border-slate-200
                hover:bg-slate-50
                active:scale-[0.98]
                transition-all
              "
            >
              Partial Advance + Balance After Delivery
            </button>
          </div>

          {/* Helper text */}
          <p className="text-xs text-slate-400 text-center mt-6">
            ★ This helps us plan your task workflow correctly based on the PO payment term.
          </p>
        </div>
      </div>
    </div>
  );
}
