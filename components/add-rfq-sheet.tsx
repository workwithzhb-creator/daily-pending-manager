"use client";

import { useState, useEffect } from "react";

/* --- COUNTRY CODES --- */
const COUNTRY_CODES = [
  { code: "+966", label: "Saudi Arabia" },
  { code: "+971", label: "UAE" },
  { code: "+974", label: "Qatar" },
  { code: "+965", label: "Kuwait" },
  { code: "+973", label: "Bahrain" },
  { code: "+968", label: "Oman" },
  { code: "+91", label: "India" },
];

/* --- RFQ NUMBER GENERATOR --- */
function generateRFQNumber() {
  const year = new Date().getFullYear();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `RFQ-${year}-${random}`;
}

/* --- AUTO COUNTRY DETECTION --- */
function detectCountryCode() {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (tz === "Asia/Riyadh") return "+966";
  if (tz === "Asia/Dubai") return "+971";
  return "+91";
}

export type RFQPayload = {
  customerName: string;
  whatsapp: string;
  note: string;
  rfqNumber: string;
};

export function AddRFQSheet({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: RFQPayload) => void;
}) {
  const [customer, setCustomer] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [whatsapp, setWhatsapp] = useState("");
  const [note, setNote] = useState("");
  const [rfqNumber, setRfqNumber] = useState("");

  useEffect(() => {
    if (open) {
      setRfqNumber(generateRFQNumber());
      setCustomer("");
      setWhatsapp("");
      setNote("");
      setCountryCode(detectCountryCode());
    }
  }, [open]);

  if (!open) return null;

  const canSave = customer.trim() !== "" && whatsapp.trim() !== "";

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      {/* Overlay */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />

      {/* Bottom Sheet */}
      <div className="relative mt-auto w-full">
        <div
          className="
            max-w-lg mx-auto
            rounded-t-3xl bg-white
            shadow-xl
            max-h-[90vh]
            flex flex-col
          "
        >
          {/* Drag Handle */}
          <div className="pt-3">
            <div className="h-1 w-10 bg-slate-300 rounded-full mx-auto" />
          </div>

          {/* Scrollable Content */}
          <div className="px-6 pt-4 pb-6 overflow-y-auto">
            <h3 className="text-lg font-semibold">
              Add RFQ / Inquiry
            </h3>

            {/* RFQ Reference */}
            <div className="mt-1 text-sm text-slate-500">
              <span className="font-medium text-slate-700">
                Internal RFQ Reference:
              </span>{" "}
              {rfqNumber}
              <div className="text-xs text-slate-400 mt-0.5">
                Used for future follow-ups and reminders
              </div>
            </div>

            {/* Form */}
            <div className="mt-5 space-y-4">
              <input
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                placeholder="Customer / Company name"
                className="w-full rounded-xl border px-4 py-3 text-sm"
              />

              {/* Country + WhatsApp */}
              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="w-full sm:w-[45%] rounded-xl border px-3 py-3 text-sm bg-white"
                >
                  {COUNTRY_CODES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} {c.label}
                    </option>
                  ))}
                </select>

                <input
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="WhatsApp number"
                  inputMode="numeric"
                  className="w-full sm:flex-1 rounded-xl border px-4 py-3 text-sm"
                />
              </div>

              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Note (Optional)"
                className="w-full rounded-xl border px-4 py-3 text-sm"
              />
            </div>
          </div>

          {/* Footer Buttons (sticky-safe) */}
          <div className="px-6 pb-[env(safe-area-inset-bottom)] pt-4 border-t flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 text-sm text-slate-500"
            >
              Cancel
            </button>

            <button
              disabled={!canSave}
              onClick={() =>
                onSave({
                  customerName: customer,
                  whatsapp: `${countryCode}${whatsapp}`,
                  note,
                  rfqNumber,
                })
              }
              className={`flex-1 py-3 rounded-xl text-sm font-semibold
                ${
                  canSave
                    ? "bg-gradient-to-br from-indigo-500 to-purple-500 text-white"
                    : "bg-slate-200 text-slate-400"
                }`}
            >
              Save RFQ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
