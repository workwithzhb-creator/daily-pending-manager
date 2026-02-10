"use client";

import { useState, useEffect } from "react";

/* --- COUNTRY OPTIONS (flag + code only) --- */
const COUNTRY_OPTIONS = [
  { code: "+966", flag: "🇸🇦", tz: "Asia/Riyadh" },
  { code: "+971", flag: "🇦🇪", tz: "Asia/Dubai" },
  { code: "+974", flag: "🇶🇦", tz: "Asia/Qatar" },
  { code: "+965", flag: "🇰🇼", tz: "Asia/Kuwait" },
  { code: "+973", flag: "🇧🇭", tz: "Asia/Bahrain" },
  { code: "+968", flag: "🇴🇲", tz: "Asia/Muscat" },
  { code: "+91", flag: "🇮🇳", tz: "" },
] as const;

/* --- RFQ NUMBER GENERATOR --- */
function generateRFQNumber() {
  const year = new Date().getFullYear();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `RFQ-${year}-${random}`;
}

/* --- AUTO COUNTRY DETECTION --- */
function getDefaultCountryCode(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const found = COUNTRY_OPTIONS.find((c) => c.tz && c.tz === tz);
    return found ? found.code : "+91";
  } catch {
    return "+91";
  }
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
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [note, setNote] = useState("");
  const [rfqNumber, setRfqNumber] = useState("");
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);

  useEffect(() => {
    if (open) {
      setRfqNumber(generateRFQNumber());
      setCustomer("");
      setWhatsappNumber("");
      setNote("");
      setCountryCode(getDefaultCountryCode());
      setShowCountryDropdown(false);
    }
  }, [open]);

  if (!open) return null;

  const whatsappDigits = whatsappNumber.replace(/\D/g, "");
  const canSave = customer.trim() !== "" && whatsappDigits.trim() !== "";
  const selectedCountry = COUNTRY_OPTIONS.find((c) => c.code === countryCode);

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

              {/* WhatsApp (required): Country dropdown + number */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  WhatsApp number <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <div className="relative shrink-0 w-[95px]">
                    <button
                      type="button"
                      onClick={() => setShowCountryDropdown((v) => !v)}
                      className="flex items-center justify-center gap-1 w-[95px] rounded-xl bg-white py-3 text-sm shadow-sm ring-1 ring-slate-200/70 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                    >
                      <span className="text-base">{selectedCountry?.flag ?? "🇮🇳"}</span>
                      <span className="text-slate-600 text-xs font-medium">{selectedCountry?.code ?? "+91"}</span>
                      <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {showCountryDropdown && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setShowCountryDropdown(false)} aria-hidden />
                        <div className="absolute left-0 top-full mt-1 z-20 w-[95px] rounded-xl bg-white shadow-lg py-1 ring-1 ring-slate-200/70 max-h-52 overflow-auto">
                          {COUNTRY_OPTIONS.map((c) => (
                            <button
                              key={c.code}
                              type="button"
                              onClick={() => {
                                setCountryCode(c.code);
                                setShowCountryDropdown(false);
                              }}
                              className="w-full flex items-center justify-center gap-1 px-2 py-2 text-sm hover:bg-slate-50 transition"
                            >
                              <span className="text-base">{c.flag}</span>
                              <span className="text-slate-600 text-xs">{c.code}</span>
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                  <input
                    type="tel"
                    inputMode="numeric"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value.replace(/\D/g, "").slice(0, 15))}
                    placeholder="5 0123 4567"
                    className="flex-1 min-w-0 rounded-xl bg-white px-4 py-3 text-sm shadow-sm ring-1 ring-slate-200/70 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  />
                </div>
              </div>

              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Note (Optional)"
                className="w-full rounded-xl border px-4 py-3 text-sm"
              />
              <p className="text-xs text-slate-400 mt-1">
  Tip: Add short material reference & project name so you don’t forget this RFQ.
</p>
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
                  customerName: customer.trim(),
                  whatsapp: `${countryCode}${whatsappDigits}`,
                  note: note.trim(),
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
