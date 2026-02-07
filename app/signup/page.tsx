"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

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

export default function SignupPage() {
  const supabase = createClient();
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [mobileNumber, setMobileNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setCountryCode(getDefaultCountryCode());
  }, []);

  const selectedCountry = COUNTRY_OPTIONS.find((c) => c.code === countryCode);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    const digits = mobileNumber.replace(/\D/g, "");
    if (!digits.trim()) {
      setError("Mobile number is required");
      return;
    }
    setLoading(true);
    setError(null);

    const mobileFull = countryCode + digits;

    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    const user = authData?.user;
    if (user?.id) {
      const { error: profileError } = await supabase.from("profiles").insert({
        id: user.id,
        name: name.trim() || null,
        company_name: companyName.trim() || null,
        mobile: mobileFull,
        created_at: new Date().toISOString(),
      });

      if (profileError) {
        setError(profileError.message);
        setLoading(false);
        return;
      }
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/40 to-purple-50/30 flex items-center justify-center p-6">
      <div className="max-w-sm w-full">
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Create Account
          </h1>
          <p className="text-sm text-slate-600">
            Start managing your tasks today
          </p>
        </div>

        {/* Form Card */}
        <div className="rounded-3xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/60 p-6">
          <form onSubmit={handleSignup} className="space-y-4">
            {/* Name */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                placeholder="Your name"
                disabled={loading}
              />
            </div>

            {/* Company Name */}
            <div>
              <label
                htmlFor="company"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Company Name
              </label>
              <input
                id="company"
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                placeholder="Your company"
                disabled={loading}
              />
            </div>

            {/* Mobile Number */}
            <div>
              <label
                htmlFor="mobile"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Mobile Number <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <div className="relative shrink-0 w-[95px]">
                  <button
                    type="button"
                    onClick={() => setShowCountryDropdown((v) => !v)}
                    disabled={loading}
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
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowCountryDropdown(false)}
                        aria-hidden
                      />
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
                  id="mobile"
                  type="tel"
                  inputMode="numeric"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, "").slice(0, 15))}
                  required
                  className="flex-1 min-w-0 rounded-xl bg-white px-4 py-3 text-sm shadow-sm ring-1 ring-slate-200/70 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  placeholder="5 0123 4567"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                placeholder="you@example.com"
                disabled={loading}
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                placeholder="At least 6 characters"
                disabled={loading}
              />
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl text-sm font-semibold bg-gradient-to-br from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/25 active:scale-[0.98] transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating account..." : "Sign Up"}
            </button>
          </form>

          {/* Sign In Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-medium text-indigo-600 hover:text-indigo-700"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
