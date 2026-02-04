"use client";

import { useState, useRef, useEffect } from "react";
import { PipelineStages } from "@/components/pipeline-stages";
import { SummaryCards } from "@/components/summary-cards";
import { DealCard, PendingItem, PendingType } from "@/components/deal-card";
import { ItemDetailSheet } from "@/components/item-detail-sheet";
import { ProgressRing } from "@/components/progress-ring";
import { FooterNav } from "@/components/footer-nav";
import { AddRFQSheet, RFQPayload } from "@/components/add-rfq-sheet";
import {
  ProfileSetupSheet,
  UserProfile,
} from "@/components/profile-setup-sheet";
import { UpgradeSheet } from "@/components/upgrade-sheet";
import { AccountPlanSheet } from "@/components/account-plan-sheet";

/* ---------------- MOCK DATA ---------------- */

const mockPendingItems: PendingItem[] = [
  {
    id: "1",
    customerName: "Sharma Constructions",
    pendingType: "quotation",
    createdAt: new Date("2026-02-04T09:00:00"),
    timePending: "",
    label: "TMT Steel Bars • 50 tonnes",
  },
  {
    id: "2",
    customerName: "Patel Infrastructure",
    pendingType: "quotation",
    createdAt: new Date("2026-02-03T15:00:00"),
    timePending: "",
    label: "Cement • 200 bags",
  },
  {
    id: "3",
    customerName: "Singh Builders",
    pendingType: "followup",
    createdAt: new Date("2026-02-02T11:00:00"),
    timePending: "",
    label: "Sent quote on Jan 28",
  },
  {
    id: "4",
    customerName: "Sunrise Realty",
    pendingType: "delivery",
    createdAt: new Date("2026-02-04T07:30:00"),
    timePending: "",
    label: "Ready for dispatch",
  },
  {
    id: "5",
    customerName: "RK Constructions",
    pendingType: "invoice",
    createdAt: new Date("2026-02-01T10:00:00"),
    timePending: "",
    label: "Delivery completed",
  },
  {
    id: "6",
    customerName: "Agarwal Infra",
    pendingType: "paymentFollowup",
    createdAt: new Date("2026-01-28T09:00:00"),
    timePending: "",
    label: "₹4,50,000 due",
  },
];

/* ---------------- HELPERS ---------------- */

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

function formatDate(d: Date) {
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function getDaysPending(createdAt?: Date): number {
  if (!createdAt) return 0;
  const now = new Date();
  return Math.floor(
    (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
  );
}

function getDaysUntilDueDate(dueDate?: string): number | null {
  if (!dueDate) return null;
  const now = new Date();
  const due = new Date(dueDate);
  const diff = Math.floor(
    (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
  return diff;
}

function getItemDays(item: PendingItem): { days: number; daysUntil?: number } {
  // For paymentFollowup items with invoiceDueDate, use due date
  if (
    item.pendingType === "paymentFollowup" &&
    item.invoiceDueDate
  ) {
    const daysUntil = getDaysUntilDueDate(item.invoiceDueDate);
    if (daysUntil !== null) {
      // If due date is passed (negative), return positive days overdue
      // If due date is in future, return 0 (not overdue yet) but keep daysUntil
      return {
        days: daysUntil < 0 ? Math.abs(daysUntil) : 0,
        daysUntil,
      };
    }
  }
  // For other items, use createdAt
  const days = getDaysPending(item.createdAt);
  return { days };
}

function getTimePending(createdAt?: Date): string {
  if (!createdAt) return "";
  const diffHours = Math.floor(
    (Date.now() - createdAt.getTime()) / (1000 * 60 * 60)
  );
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d`;
  return `${Math.floor(diffDays / 7)}w`;
}

type PriorityFilter = "urgent" | "today" | null;

/* ---------------- PAGE ---------------- */

export default function Page() {
  const [items, setItems] = useState<PendingItem[]>(mockPendingItems);
  const [activeStage, setActiveStage] = useState<PendingType | "all">("all");
  const [activePriority, setActivePriority] = useState<PriorityFilter>(null);
  const [selectedItem, setSelectedItem] = useState<PendingItem | null>(null);

  const [showAddRFQ, setShowAddRFQ] = useState(false);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [showAccountPlan, setShowAccountPlan] = useState(false);

  // If user clicked Add RFQ but profile missing, after saving profile we open RFQ
  const [pendingRFQOpen, setPendingRFQOpen] = useState(false);

  // Plan management
  const [plan, setPlan] = useState<"free" | "basic">("free");
  const [showUpgradeSheet, setShowUpgradeSheet] = useState(false);
  const [showFreeLimitModal, setShowFreeLimitModal] = useState(false);

  const [showOnboarding, setShowOnboarding] = useState(false);

  const tasksRef = useRef<HTMLDivElement>(null);
  const summaryCardsRef = useRef<HTMLDivElement>(null);
  const pipelineStagesRef = useRef<HTMLDivElement>(null);

  /* ---------------- LOAD PROFILE (NO AUTO POPUP) ---------------- */

  useEffect(() => {
    const saved = localStorage.getItem("dp_user_profile");
    if (saved) {
      try {
        setProfile(JSON.parse(saved));
      } catch {
        localStorage.removeItem("dp_user_profile");
      }
    }

    // Load plan from localStorage
    const savedPlan = localStorage.getItem("dp_plan");
    if (savedPlan === "basic" || savedPlan === "free") {
      setPlan(savedPlan);
    } else {
      localStorage.setItem("dp_plan", "free");
      setPlan("free");
    }

    // First-time onboarding: show only once
    if (localStorage.getItem("dp_onboarding_done") !== "yes") {
      setShowOnboarding(true);
    }
  }, []);

  function dismissOnboarding() {
    localStorage.setItem("dp_onboarding_done", "yes");
    setShowOnboarding(false);
  }

  function handleSaveProfile(data: UserProfile) {
    localStorage.setItem("dp_user_profile", JSON.stringify(data));
    setProfile(data);
    setShowProfileSetup(false);

    // If user originally wanted to add RFQ, open RFQ after profile saved
    if (pendingRFQOpen) {
      setPendingRFQOpen(false);
      setShowAddRFQ(true);
    }
  }

  function handleOpenProfile() {
    setShowAccountPlan(true);
  }

  function handleCloseProfile() {
    setShowProfileSetup(false);
  }

  function handleCloseAccountPlan() {
    setShowAccountPlan(false);
  }

  function handleEditProfileFromAccount() {
    setShowAccountPlan(false);
    setShowProfileSetup(true);
  }

  function handleUpgradeFromAccount() {
    setShowAccountPlan(false);
    handleUpgrade();
  }

  /* ---------------- PLAN MANAGEMENT ---------------- */

  function handleUpgrade() {
    localStorage.setItem("dp_plan", "basic");
    setPlan("basic");
    setShowUpgradeSheet(false);
    // If user was trying to add RFQ, open it now
    if (pendingRFQOpen) {
      setPendingRFQOpen(false);
      setShowAddRFQ(true);
    }
  }

  /* ---------------- RFQ SAVE ---------------- */

  function handleSaveRFQ(data: RFQPayload) {
    // Free plan: max 10 active tasks (excluding completed)
    if (plan === "free" && activeTaskCount >= 10) {
      setShowAddRFQ(false);
      setShowFreeLimitModal(true);
      return;
    }
    setItems((prev) => [
      {
        id: crypto.randomUUID(),
        customerName: data.customerName,
        pendingType: "quotation",
        createdAt: new Date(),
        timePending: "",
        label: data.note || data.rfqNumber,
      },
      ...prev,
    ]);
    setShowAddRFQ(false);
  }

  function updateItemStatus(
    id: string,
    status: PendingType,
    paymentStage?: "advance" | "balance",
    invoiceDueDate?: string
  ) {
    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i;
        
        // Handle invoice → paymentFollowup: if coming from partial advance flow, set balance
        if (
          i.pendingType === "invoice" &&
          status === "paymentFollowup" &&
          i.paymentStage === "advance"
        ) {
          return {
            ...i,
            pendingType: status,
            paymentStage: "balance",
            ...(invoiceDueDate && { invoiceDueDate }),
          };
        }
        
        // Normal update with paymentStage and invoiceDueDate if provided
        return {
          ...i,
          pendingType: status,
          ...(paymentStage !== undefined && { paymentStage }),
          ...(invoiceDueDate && { invoiceDueDate }),
        };
      })
    );
    setSelectedItem(null);
  }

  /* ---------------- TASK HEADER ---------------- */

  function getTaskHeading() {
    if (activePriority === "urgent") return "Overdue tasks";
    if (activePriority === "today") return "Due today";
    if (activeStage !== "all") {
      const map: Record<PendingType, string> = {
        quotation: "Quotation to be sent",
        followup: "Quotation to be followed up",
        delivery: "Delivery to be done",
        invoice: "Invoice to be submitted",
        paymentFollowup: "Payment to be followed up",
        completed: "Payment received",
      };
      return map[activeStage];
    }
    return "Your tasks";
  }

  function getTaskHeaderColor() {
    if (activePriority === "urgent") return "bg-rose-500";
    if (activePriority === "today") return "bg-amber-500";
    if (activeStage !== "all") {
      const map: Record<PendingType, string> = {
        quotation: "bg-cyan-500",
        followup: "bg-purple-500",
        delivery: "bg-emerald-500",
        invoice: "bg-blue-500",
        paymentFollowup: "bg-rose-500",
        completed: "bg-lime-500",
      };
      return map[activeStage];
    }
    return "bg-indigo-500";
  }

  function getTasksContainerBg() {
    if (activeStage !== "all" || activePriority !== null) {
      return "bg-gradient-to-br from-indigo-50/40 to-purple-50/40";
    }
    return "bg-white";
  }

  /* ---------------- COUNTS ---------------- */

  let urgent = 0;
  let today = 0;

  items.forEach((i) => {
    const { days, daysUntil } = getItemDays(i);
    if (days >= 1) {
      urgent++;
    } else if (days === 0) {
      // For paymentFollowup with invoiceDueDate: count as today if due within 7 days
      if (
        i.pendingType === "paymentFollowup" &&
        i.invoiceDueDate &&
        daysUntil !== undefined
      ) {
        if (daysUntil >= 0 && daysUntil <= 7) {
          today++;
        }
      } else {
        // Regular items: count as today
        today++;
      }
    }
  });

  // Count active tasks (pendingType !== "completed")
  const activeTaskCount = items.filter(
    (i) => i.pendingType !== "completed"
  ).length;

  let visibleItems = [...items];

  if (activePriority) {
    visibleItems = visibleItems.filter((i) => {
      const { days, daysUntil } = getItemDays(i);
      if (activePriority === "urgent") {
        return days >= 1;
      } else {
        // today: days === 0 AND (regular item OR paymentFollowup with due date within 7 days)
        if (days === 0) {
          if (
            i.pendingType === "paymentFollowup" &&
            i.invoiceDueDate &&
            daysUntil !== undefined
          ) {
            return daysUntil >= 0 && daysUntil <= 7;
          }
          return true; // Regular items with days === 0
        }
        return false;
      }
    });
  } else if (activeStage !== "all") {
    visibleItems = visibleItems.filter((i) => i.pendingType === activeStage);
  }

  const hideFooter =
    selectedItem !== null ||
    showAddRFQ ||
    showProfileSetup ||
    showUpgradeSheet ||
    showAccountPlan ||
    showFreeLimitModal;

  /* ---------------- CLICK OUTSIDE RESET ---------------- */

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as HTMLElement;

      if (
        summaryCardsRef.current?.contains(target) ||
        pipelineStagesRef.current?.contains(target) ||
        tasksRef.current?.contains(target) ||
        target.closest("[data-footer-nav]") ||
        target.closest("[data-sheet]") ||
        selectedItem !== null ||
        showAddRFQ ||
        showProfileSetup ||
        showUpgradeSheet ||
        showAccountPlan ||
        showFreeLimitModal
      ) {
        return;
      }

      if (activeStage !== "all" || activePriority !== null) {
        setActiveStage("all");
        setActivePriority(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [
    activeStage,
    activePriority,
    selectedItem,
    showAddRFQ,
    showProfileSetup,
    showUpgradeSheet,
    showAccountPlan,
    showFreeLimitModal,
  ]);

  /* ---------------- ADD RFQ CLICK ---------------- */

  function handleAddRFQClick() {
    // If profile not saved, open profile setup first
    if (!profile) {
      setPendingRFQOpen(true);
      setShowProfileSetup(true);
      return;
    }

    // Check plan limits: free plan max 10 active tasks
    if (plan === "free" && activeTaskCount >= 10) {
      setPendingRFQOpen(true);
      setShowUpgradeSheet(true);
      return;
    }

    setShowAddRFQ(true);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/40 to-purple-50/30">
      {/* First-time onboarding modal */}
      {showOnboarding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            aria-hidden
          />
          <div
            className="relative max-w-sm w-full rounded-3xl bg-gradient-to-b from-white to-slate-50/95 px-6 py-8 shadow-2xl"
            role="dialog"
            aria-labelledby="onboarding-title"
          >
            <h2
              id="onboarding-title"
              className="text-xl font-bold text-slate-900 text-center"
            >
              Close Deals. Get Paid. On Time.
            </h2>
            <p className="text-sm text-slate-600 text-center mt-4 leading-relaxed">
              This app helps traders and suppliers track quotations, follow-ups,
              and payments.
            </p>
            <p className="text-sm text-slate-600 text-center mt-2 leading-relaxed">
              So nothing slips on WhatsApp — and no money is forgotten.
            </p>
            <p className="text-xs text-slate-400 text-center mt-4 leading-relaxed">
              Built for daily deal follow-ups, not complex CRMs.
            </p>
            <div className="mt-8">
              <button
                onClick={dismissOnboarding}
                className="w-full h-12 rounded-2xl text-sm font-semibold bg-gradient-to-br from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/25 active:scale-[0.98] transition-transform"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="px-6 pt-14 pb-6 max-w-lg mx-auto flex items-center gap-4">
        <button
          onClick={handleOpenProfile}
          className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center text-white font-semibold hover:opacity-90 active:scale-95 transition-all cursor-pointer"
        >
          {profile?.name ? profile.name.charAt(0).toUpperCase() : "A"}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold">
              {getGreeting()}, {profile?.name || "Ahmed"}
            </h1>
            <span
              className={`
                px-2 py-0.5 rounded-full text-[10px] font-semibold
                ${
                  plan === "basic"
                    ? "bg-gradient-to-br from-indigo-500 to-purple-500 text-white"
                    : "bg-slate-200 text-slate-600"
                }
              `}
            >
              {plan === "basic" ? "Basic" : "Free"}
            </span>
          </div>
          <p className="text-sm text-slate-500">{formatDate(new Date())}</p>
          <p className="text-xs text-slate-400 mt-1">
            We remind you automatically so you don&apos;t have to remember.
          </p>
        </div>
      </header>

      <main className="px-6 pb-32 max-w-lg mx-auto space-y-8">
        <div ref={summaryCardsRef} className="flex items-center gap-4">
          <ProgressRing completed={0} total={items.length} />
          <SummaryCards
            urgent={urgent}
            today={today}
            active={activePriority}
            onSelect={(p) => {
              setActiveStage("all");
              setActivePriority((prev) => (prev === p ? null : p));
            }}
          />
        </div>

        <div ref={pipelineStagesRef}>
          <PipelineStages
            stages={[
              { type: "quotation", label: "Quotation to be sent" },
              { type: "followup", label: "Quotation to be followed up" },
              { type: "delivery", label: "Delivery to be done" },
              { type: "invoice", label: "Invoice to be submitted" },
              { type: "paymentFollowup", label: "Payment to be followed up" },
              { type: "completed", label: "Payment Received" },
            ]}
            activeStage={activeStage}
            onSelect={(s) => {
              setActivePriority(null);
              setActiveStage((prev) => (prev === s ? "all" : s));
            }}
            items={items}
          />
        </div>

        <div
          ref={tasksRef}
          className={`rounded-3xl p-4 ${getTasksContainerBg()} shadow border`}
        >
          <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
            <span
              className={`w-1.5 h-1.5 rounded-full ${getTaskHeaderColor()}`}
            />
            {getTaskHeading()}
          </h2>

          <div className="space-y-3">
            {visibleItems.map((item) => (
              <DealCard
                key={item.id}
                item={{
                  ...item,
                  timePending: getTimePending(item.createdAt),
                }}
                onClick={() => setSelectedItem(item)}
              />
            ))}
          </div>
        </div>
      </main>

      <div data-sheet>
        <ItemDetailSheet
          item={
            selectedItem
              ? {
                  ...selectedItem,
                  timePending: getTimePending(selectedItem.createdAt),
                }
              : null
          }
          onClose={() => setSelectedItem(null)}
          onStatusChange={updateItemStatus}
          plan={plan}
        />
      </div>

      {!hideFooter && (
        <div data-footer-nav>
          <FooterNav
            onAddRFQ={handleAddRFQClick}
            onHome={() => {
              setActiveStage("all");
              setActivePriority(null);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            onTasks={() => {
              tasksRef.current?.scrollIntoView({ behavior: "smooth" });
            }}
          />
        </div>
      )}

      <div data-sheet>
        <AddRFQSheet
          open={showAddRFQ}
          onClose={() => setShowAddRFQ(false)}
          onSave={handleSaveRFQ}
        />
      </div>

      <div data-sheet>
        <ProfileSetupSheet
          open={showProfileSetup}
          onSave={handleSaveProfile}
          onClose={handleCloseProfile}
          initialData={profile}
        />

        <UpgradeSheet
          open={showUpgradeSheet}
          onUpgrade={handleUpgrade}
          onClose={() => {
            setShowUpgradeSheet(false);
            setPendingRFQOpen(false);
          }}
        />

        {/* Free plan limit modal (when Save RFQ at 10 tasks) */}
        {showFreeLimitModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-6"
            onClick={() => setShowFreeLimitModal(false)}
          >
            <div
              className="absolute inset-0 bg-black/30 backdrop-blur-sm"
              aria-hidden
            />
            <div
              className="relative max-w-sm w-full rounded-3xl bg-gradient-to-b from-white to-slate-50/95 px-6 py-8 shadow-2xl"
              role="dialog"
              aria-labelledby="free-limit-title"
              onClick={(e) => e.stopPropagation()}
            >
              <h2
                id="free-limit-title"
                className="text-xl font-bold text-slate-900 text-center"
              >
                You&apos;re at your Free Plan limit
              </h2>
              <p className="text-sm text-slate-600 text-center mt-4 leading-relaxed">
                Free plan allows only 10 active tasks. Upgrade to track
                unlimited quotations, invoices, and payments.
              </p>
              <div className="mt-6 space-y-3">
                <button
                  onClick={() => {
                    setShowFreeLimitModal(false);
                    handleUpgrade();
                  }}
                  className="w-full h-12 rounded-2xl text-sm font-semibold bg-gradient-to-br from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/25 active:scale-[0.98] transition-transform"
                >
                  Upgrade to Basic
                </button>
                <button
                  onClick={() => setShowFreeLimitModal(false)}
                  className="w-full h-11 rounded-2xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Not now
                </button>
              </div>
            </div>
          </div>
        )}

        <AccountPlanSheet
          open={showAccountPlan}
          onClose={handleCloseAccountPlan}
          profile={profile}
          plan={plan}
          onUpgrade={handleUpgradeFromAccount}
          onEditProfile={handleEditProfileFromAccount}
        />
      </div>
    </div>
  );
}
