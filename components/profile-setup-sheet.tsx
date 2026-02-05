"use client";

import { useEffect, useState } from "react";

/* --- COUNTRY CODES (flag + code only) --- */
const COUNTRY_OPTIONS = [
  { code: "+966", flag: "🇸🇦", tz: "Asia/Riyadh" },
  { code: "+971", flag: "🇦🇪", tz: "Asia/Dubai" },
  { code: "+974", flag: "🇶🇦", tz: "Asia/Qatar" },
  { code: "+965", flag: "🇰🇼", tz: "Asia/Kuwait" },
  { code: "+973", flag: "🇧🇭", tz: "Asia/Bahrain" },
  { code: "+968", flag: "🇴🇲", tz: "Asia/Muscat" },
  { code: "+91", flag: "🇮🇳", tz: "" },
] as const;

function getDefaultCountryCode(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const found = COUNTRY_OPTIONS.find((c) => c.tz && c.tz === tz);
    return found ? found.code : "+91";
  } catch {
    return "+91";
  }
}

export type UserProfile = {
  name: string;
  company?: string;
  countryCode: string;
  whatsapp: string;
};

export function ProfileSetupSheet({
  open,
  onSave,
  onClose,
  initialData,
}: {
  open: boolean;
  onSave: (data: UserProfile) => void;
  onClose?: () => void;
  initialData?: UserProfile | null;
}) {
  const isEditMode = !!initialData;
  
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [whatsapp, setWhatsapp] = useState("");
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);

  useEffect(() => {
    if (open) {
      if (isEditMode && initialData) {
        // Edit mode: prefill from initialData
        setName(initialData.name || "");
        setCompany(initialData.company || "");
        setCountryCode(initialData.countryCode || "+966");
        // Extract phone number without country code
        const phoneWithoutCode = initialData.whatsapp?.replace(initialData.countryCode || "", "") || "";
        setWhatsapp(phoneWithoutCode);
      } else {
        // Setup mode: clear fields, default country from timezone
        setName("");
        setCompany("");
        setWhatsapp("");
        setCountryCode(getDefaultCountryCode());
      }
      setShowCountryDropdown(false);
    }
  }, [open, isEditMode, initialData]);

  // ESC key support
  useEffect(() => {
    if (!open || !onClose) return;
    const closeHandler = onClose;
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") {
        closeHandler();
      }
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  if (!open) return null;

  const canSave = name.trim() !== "" && whatsapp.replace(/\D/g, "").trim() !== "";

  return (
    <div className="fixed inset-0 z-50">
      {/* Background blur - click to close */}
      <div
        onClick={onClose ? () => onClose() : undefined}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />

      {/* Bottom sheet */}
      <div className="absolute bottom-0 left-0 right-0" onClick={(e) => e.stopPropagation()}>
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

          {/* Header with close button in edit mode */}
          <div className="flex items-start justify-between mb-1">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-slate-900">
                {isEditMode ? "Edit Profile" : "Set up your profile"}
              </h3>
            </div>
            {isEditMode && onClose && (
              <button
                onClick={onClose}
                className="
                  -mt-1 -mr-2 p-2
                  rounded-full
                  text-slate-400
                  hover:text-slate-600
                  hover:bg-slate-100
                  transition-colors
                "
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>

          {!isEditMode && (
            <p className="text-sm text-slate-500 mt-1 leading-snug">
              This helps us organize your RFQs, reminders, and daily pending tasks.
            </p>
          )}

          {/* Form */}
          <div className="mt-6 space-y-4">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
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

            <input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Company name (Optional)"
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

            <div className="flex gap-2">
              <div className="relative shrink-0 w-[95px]">
                <button
                  type="button"
                  onClick={() => setShowCountryDropdown((v) => !v)}
                  className="flex items-center justify-center gap-1 w-[95px] rounded-xl bg-white/80 py-3 text-sm shadow-sm ring-1 ring-slate-200/70 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                >
                  <span className="text-base">{COUNTRY_OPTIONS.find((c) => c.code === countryCode)?.flag ?? "🇮🇳"}</span>
                  <span className="text-slate-600 text-xs font-medium">{countryCode}</span>
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
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, "").slice(0, 15))}
                placeholder="5 0123 4567"
                inputMode="numeric"
                className="
                  flex-1 min-w-0 rounded-xl
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
          </div>

          {/* Save Button */}
          <div className="mt-7">
            <button
              disabled={!canSave}
              onClick={() =>
                onSave({
                  name,
                  company,
                  countryCode,
                  whatsapp: `${countryCode}${whatsapp}`,
                })
              }
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
              {isEditMode ? "Save Changes" : "Save Profile"}
            </button>

            {!isEditMode && (
              <p className="text-[11px] text-slate-400 text-center mt-3">
                You can edit this later anytime.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
