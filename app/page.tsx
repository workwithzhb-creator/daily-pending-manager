"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
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
import { MigrationModal } from "@/components/migration-modal";
import EnableNotificationsButton from "@/components/EnableNotificationsButton";
import { createClient } from "@/lib/supabase/client";
import OneSignal from "react-onesignal";

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

function getDaysPending(stageUpdatedAt?: Date): number {
  if (!stageUpdatedAt) return 0;
  const now = new Date();
  return Math.floor(
    (now.getTime() - stageUpdatedAt.getTime()) / (1000 * 60 * 60 * 24)
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
  if (item.pendingType === "paymentFollowup" && item.invoiceDueDate) {
    const daysUntil = getDaysUntilDueDate(item.invoiceDueDate);
    if (daysUntil !== null) {
      return {
        days: daysUntil < 0 ? Math.abs(daysUntil) : 0,
        daysUntil,
      };
    }
  }

  const days = getDaysPending(item.stageUpdatedAt);
  return { days };
}

function getTimePending(stageUpdatedAt?: Date): string {
  if (!stageUpdatedAt) return "";
  const diffHours = Math.floor(
    (Date.now() - stageUpdatedAt.getTime()) / (1000 * 60 * 60)
  );
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d`;
  return `${Math.floor(diffDays / 7)}w`;
}

type PriorityFilter = "urgent" | "today" | null;

/* ---------------- STORAGE HELPERS ---------------- */

function safeParsePendingItems(raw: string): PendingItem[] | null {
  try {
    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) return null;

    const fixed = parsed.map((item: any) => ({
      ...item,
      createdAt: item.createdAt ? new Date(item.createdAt) : undefined,
    }));

    return fixed;
  } catch {
    return null;
  }
}

/* ---------------- PAGE ---------------- */

export default function Page() {
  const router = useRouter();

  const supabase = useMemo(() => createClient(), []);

  const [items, setItems] = useState<PendingItem[]>([]);
  const [activeStage, setActiveStage] = useState<PendingType | "all">("all");
  const [activePriority, setActivePriority] = useState<PriorityFilter>(null);
  const [selectedItem, setSelectedItem] = useState<PendingItem | null>(null);

  const [showAddRFQ, setShowAddRFQ] = useState(false);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [showAccountPlan, setShowAccountPlan] = useState(false);

  const [pendingRFQOpen, setPendingRFQOpen] = useState(false);

  const [plan, setPlan] = useState<"free" | "basic">("free");
  const [showUpgradeSheet, setShowUpgradeSheet] = useState(false);
  const [showFreeLimitModal, setShowFreeLimitModal] = useState(false);

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showMigrationModal, setShowMigrationModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [showNotificationBanner, setShowNotificationBanner] = useState(true);

  const tasksRef = useRef<HTMLDivElement>(null);
  const summaryCardsRef = useRef<HTMLDivElement>(null);
  const pipelineStagesRef = useRef<HTMLDivElement>(null);

  async function refetchTasks(userId: string) {
    const { data: itemsData, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading tasks:", error);
      setItems([]);
      return [];
    }

    const convertedItems: PendingItem[] = (itemsData || []).map((item: any) => ({
      id: item.id,
      customerName: item.customer_name,
      pendingType: item.pending_type,
      createdAt: item.created_at ? new Date(item.created_at) : undefined,
      stageUpdatedAt: item.stage_updated_at
        ? new Date(item.stage_updated_at)
        : undefined,
      timePending: "",
      label: item.label || "",
      value: item.value || undefined,
      invoiceDueDate: item.invoice_due_date || undefined,
      paymentStage: item.payment_stage || undefined,
      whatsapp: item.whatsapp || undefined,
      rfqNumber: item.rfq_number || undefined,
      completedAt: item.completed_at || undefined,
      quotationRef: item.quotation_ref || undefined,
      invoiceRef: item.invoice_ref || undefined,
    }));

    setItems(convertedItems);
    return convertedItems;
  }

  /* ---------------- LOAD EVERYTHING ON FIRST OPEN ---------------- */

  useEffect(() => {
    async function loadData() {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (!currentUser) {
        setUser(null);
        setItems([]);
        setLoading(false);

        if (
          typeof window !== "undefined" &&
          localStorage.getItem("dp_onboarding_done") !== "yes"
        ) {
          setShowOnboarding(true);
        }
        return;
      }

      setUser(currentUser);

      // Load profile from Supabase only (no localStorage)
      const { data: profileData } = await supabase
        .from("profiles")
        .select("name, company_name, mobile")
        .eq("id", currentUser.id)
        .single();

      if (
        profileData?.name ||
        profileData?.company_name ||
        profileData?.mobile
      ) {
        setProfile({
          name: profileData.name || "",
          countryCode: "+966",
          whatsapp: profileData.mobile || "",
        });
      }

      // Load plan from Supabase
      const { data: planData } = await supabase
        .from("user_plans")
        .select("plan")
        .eq("user_id", currentUser.id)
        .single();

      if (planData && (planData.plan === "basic" || planData.plan === "free")) {
        setPlan(planData.plan);
      } else {
        // Fallback to localStorage
        const savedPlan = localStorage.getItem("dp_plan");
        if (savedPlan === "basic" || savedPlan === "free") {
          setPlan(savedPlan);
          await supabase.from("user_plans").upsert({
            user_id: currentUser.id,
            plan: savedPlan,
          });
        } else {
          setPlan("free");
          await supabase.from("user_plans").upsert({
            user_id: currentUser.id,
            plan: "free",
          });
        }
      }

      // Load items from Supabase (source of truth)
      const convertedItems = await refetchTasks(currentUser.id);

      if (convertedItems.length === 0) {
        const savedItems = localStorage.getItem("dp_items");
        if (savedItems) {
          const parsed = safeParsePendingItems(savedItems);
          if (parsed && parsed.length > 0) {
            setShowMigrationModal(true);
            setLoading(false);
            return;
          }
        }
        setItems([]);
      }

      setLoading(false);

      if (
        typeof window !== "undefined" &&
        localStorage.getItem("dp_onboarding_done") !== "yes"
      ) {
        setShowOnboarding(true);
      }
    }

    loadData();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: string, session: any) => {
      if (event === "SIGNED_IN" && session) {
        setUser(session.user);
        loadData();
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setItems([]);
        setProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router, supabase]);

  // Check notification permission and hide banner when already enabled
  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkNotificationPermission = () => {
      try {
        const optedIn = OneSignal?.User?.PushSubscription?.optedIn;
        const permission = OneSignal?.Notifications?.permission;
        if (optedIn === true || permission === true) {
          setShowNotificationBanner(false);
        }
      } catch {
        // OneSignal may not be ready yet
      }
    };

    const t = setTimeout(checkNotificationPermission, 500);
    const interval = setInterval(checkNotificationPermission, 2000);

    const handleChange = () => checkNotificationPermission();
    OneSignal?.User?.PushSubscription?.addEventListener?.("change", handleChange);
    OneSignal?.Notifications?.addEventListener?.(
      "permissionChange",
      handleChange
    );

    return () => {
      clearTimeout(t);
      clearInterval(interval);
      OneSignal?.User?.PushSubscription?.removeEventListener?.(
        "change",
        handleChange
      );
      OneSignal?.Notifications?.removeEventListener?.(
        "permissionChange",
        handleChange
      );
    };
  }, []);

  function dismissOnboarding() {
    if (typeof window !== "undefined") {
      localStorage.setItem("dp_onboarding_done", "yes");
    }
    setShowOnboarding(false);
  }

  async function handleSaveProfile(data: UserProfile) {
    if (!user) return;
    await supabase.from("profiles").upsert({
      id: user.id,
      name: data.name || "",
    });
    setProfile(data);
    setShowProfileSetup(false);
    if (pendingRFQOpen) {
      setPendingRFQOpen(false);
      setShowAddRFQ(true);
    }
  }

  async function handleMigrationImport() {
    const savedItems = localStorage.getItem("dp_items");
    if (!savedItems) {
      setShowMigrationModal(false);
      return;
    }

    const parsed = safeParsePendingItems(savedItems);
    if (!parsed || parsed.length === 0) {
      setShowMigrationModal(false);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setShowMigrationModal(false);
      return;
    }

    const now = new Date().toISOString();
    const tasksToSave = parsed.map((item) => ({
      id: item.id,
      user_id: user.id,
      customer_name: item.customerName,
      pending_type: item.pendingType,
      created_at: item.createdAt?.toISOString() || now,
      stage_updated_at: now,
      label: item.label || "",
      value: item.value || null,
      invoice_due_date: item.invoiceDueDate || null,
      payment_stage: item.paymentStage || null,
      whatsapp: item.whatsapp || null,
      rfq_number: item.rfqNumber || null,
      completed_at: item.completedAt || null,
    }));

    await supabase.from("tasks").insert(tasksToSave);

    localStorage.removeItem("dp_items");

    await refetchTasks(user.id);

    setShowMigrationModal(false);
  }

  function handleMigrationSkip() {
    localStorage.removeItem("dp_items");
    setShowMigrationModal(false);
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

  async function handleUpgrade() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await supabase.from("user_plans").upsert({
        user_id: user.id,
        plan: "basic",
      });
    }

    localStorage.setItem("dp_plan", "basic");
    setPlan("basic");
    setShowUpgradeSheet(false);

    if (pendingRFQOpen) {
      setPendingRFQOpen(false);
      setShowAddRFQ(true);
    }
  }

  async function handleLogout() {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        alert(`Failed to sign out: ${error.message}`);
        return;
      }

      if (typeof window !== "undefined") {
        localStorage.removeItem("dp_onboarding_done");
        localStorage.removeItem("dp_plan");
        localStorage.removeItem("dp_items");
      }

      setUser(null);
      setItems([]);
      setProfile(null);

      router.push("/login");
    } catch (err) {
      alert(
        `Failed to sign out: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    }
  }

  /* ---------------- RFQ SAVE ---------------- */

  const activeTaskCount = items.filter((i) => i.pendingType !== "completed")
    .length;

  async function handleSaveRFQ(data: RFQPayload) {
    if (!user) return;

    if (plan === "free" && activeTaskCount >= 10) {
      setShowAddRFQ(false);
      setShowFreeLimitModal(true);
      return;
    }

    const newId = crypto.randomUUID();
    const now = new Date().toISOString();
    await supabase.from("tasks").insert({
      id: newId,
      user_id: user.id,
      customer_name: data.customerName,
      pending_type: "quotation",
      stage_updated_at: now,
      label: data.note || data.rfqNumber || "",
      whatsapp: data.whatsapp || null,
      rfq_number: data.rfqNumber || null,
    });

    await refetchTasks(user.id);
    setShowAddRFQ(false);
  }

  async function updateItemStatus(
    id: string,
    status: PendingType,
    paymentStage?: "advance" | "balance",
    invoiceDueDate?: string,
    quotationRef?: string | null,
    invoiceRef?: string | null
  ) {
    if (!user) return;

    const isCompleted = status === "completed";
    const completedAtValue = isCompleted ? new Date().toISOString() : undefined;

    const currentItem = items.find((i) => i.id === id);
    if (!currentItem) return;

    let paymentStageToWrite: "advance" | "balance" | null =
      paymentStage !== undefined
        ? paymentStage
        : currentItem.paymentStage ?? null;

    if (
      currentItem.pendingType === "invoice" &&
      status === "paymentFollowup" &&
      currentItem.paymentStage === "advance"
    ) {
      paymentStageToWrite = "balance";
    }

    const updatePayload: Record<string, any> = {
      pending_type: status,
      stage_updated_at: new Date().toISOString(),
      payment_stage: paymentStageToWrite,
      ...(invoiceDueDate !== undefined && {
        invoice_due_date: invoiceDueDate || null,
      }),
      ...(quotationRef !== undefined && {
        quotation_ref: quotationRef || null,
      }),
      ...(invoiceRef !== undefined && {
        invoice_ref: invoiceRef || null,
      }),
      completed_at: completedAtValue || null,
    };

    const { error } = await supabase
      .from("tasks")
      .update(updatePayload)
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error updating task:", error);
    }

    await refetchTasks(user.id);

    setSelectedItem(null);
  }

  async function handleDeleteItem(id: string) {
    if (!user) return;

    setItems((prev) => prev.filter((i) => i.id !== id));
    setSelectedItem(null);

    await supabase.from("tasks").delete().eq("id", id).eq("user_id", user.id);
  }

  async function handleMoveBack(id: string) {
    if (!user) return;

    const moveBackMap: Record<PendingType, PendingType | null> = {
      quotation: null,
      followup: "quotation",
      delivery: "followup",
      invoice: "delivery",
      paymentFollowup: "invoice",
      completed: "paymentFollowup",
    };

    const currentItem = items.find((i) => i.id === id);
    if (!currentItem) return;

    const previousStage = moveBackMap[currentItem.pendingType];
    if (!previousStage) return;

    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i;

        return {
          ...i,
          pendingType: previousStage,
          ...(i.pendingType === "completed" && { completedAt: undefined }),
        };
      })
    );

    await supabase
      .from("tasks")
      .update({
        pending_type: previousStage,
        stage_updated_at: new Date().toISOString(),
        completed_at:
          currentItem.pendingType === "completed"
            ? null
            : currentItem.completedAt || null,
      })
      .eq("id", id)
      .eq("user_id", user.id);

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

  function isCompletedToday(completedAt?: string): boolean {
    if (!completedAt) return false;
    const now = new Date();
    const completed = new Date(completedAt);
    return (
      now.getFullYear() === completed.getFullYear() &&
      now.getMonth() === completed.getMonth() &&
      now.getDate() === completed.getDate()
    );
  }

  let urgent = 0;
  let today = 0;
  let todayTotalCount = 0;
  let todayCompletedCount = 0;

  items.forEach((i) => {
    if (i.pendingType === "completed") {
      if (isCompletedToday(i.completedAt)) {
        todayCompletedCount++;
      }
      return;
    }

    const { days, daysUntil } = getItemDays(i);

    if (days >= 1) {
      urgent++;
    } else if (days === 0) {
      if (
        i.pendingType === "paymentFollowup" &&
        i.invoiceDueDate &&
        daysUntil !== undefined
      ) {
        if (daysUntil >= 0 && daysUntil <= 7) {
          today++;
        }
      } else {
        today++;
      }
    }

    const isTodayTask =
      days === 0 ||
      (i.pendingType === "paymentFollowup" &&
        i.invoiceDueDate &&
        daysUntil !== undefined &&
        daysUntil >= 0 &&
        daysUntil <= 7);

    if (isTodayTask) {
      todayTotalCount++;
    }
  });

  let visibleItems = [...items];

  if (activePriority) {
    visibleItems = visibleItems.filter((i) => {
      if (i.pendingType === "completed") {
        return false;
      }

      const { days, daysUntil } = getItemDays(i);

      if (activePriority === "urgent") {
        return days >= 1;
      } else {
        if (days === 0) {
          if (
            i.pendingType === "paymentFollowup" &&
            i.invoiceDueDate &&
            daysUntil !== undefined
          ) {
            return daysUntil >= 0 && daysUntil <= 7;
          }
          return true;
        }
        return false;
      }
    });
  } else if (activeStage !== "all") {
    visibleItems = visibleItems.filter((i) => i.pendingType === activeStage);
  }

  const completedCount = items.filter((i) => i.pendingType === "completed")
    .length;
  const totalCount = items.length;

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
    if (!user) {
      router.push("/login");
      return;
    }
    if (plan === "free" && activeTaskCount >= 10) {
      setPendingRFQOpen(true);
      setShowUpgradeSheet(true);
      return;
    }
    setShowAddRFQ(true);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/40 to-purple-50/30 flex items-center justify-center">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
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
          <div className="relative max-w-sm w-full rounded-3xl bg-gradient-to-b from-white to-slate-50/95 px-6 py-8 shadow-2xl">
            <h2 className="text-xl font-bold text-slate-900 text-center">
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
          {profile?.name
            ? profile.name.charAt(0).toUpperCase()
            : user?.email?.charAt(0).toUpperCase() ?? "A"}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold">
              {profile?.name
                ? `${getGreeting()}, ${profile.name}`
                : user?.email
                ? `${getGreeting()}, ${user.email.split("@")[0]}`
                : getGreeting()}
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
        {showNotificationBanner && (
          <div className="rounded-2xl border border-slate-200/80 bg-white/90 backdrop-blur px-4 py-3 flex items-center justify-between gap-4 shadow-sm">
            <p className="text-sm text-slate-600 flex-1 min-w-0">
              Enable Notifications to get quotation, invoice & payment reminders.
            </p>
            <EnableNotificationsButton />
          </div>
        )}

        <div ref={summaryCardsRef} className="flex items-center gap-4">
          <ProgressRing completed={completedCount} total={totalCount} />
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
            <span className={`w-1.5 h-1.5 rounded-full ${getTaskHeaderColor()}`} />
            {getTaskHeading()}
          </h2>

          <div className="space-y-3">
            {visibleItems.length === 0 ? (
              <div className="text-center py-12">
                {user ? (
                  <p className="text-slate-500 text-sm">No tasks yet</p>
                ) : (
                  <p className="text-slate-500 text-sm">
                    <button
                      onClick={() => router.push("/login")}
                      className="text-indigo-600 hover:text-indigo-700 font-medium underline underline-offset-2 transition-colors"
                    >
                      Sign in
                    </button>{" "}
                    to manage your pending RFQs and follow-ups.
                  </p>
                )}
              </div>
            ) : (
              visibleItems.map((item) => (
                <DealCard
                  key={item.id}
                  item={{
                    ...item,
                    timePending: getTimePending(item.stageUpdatedAt),
                  }}
                  onClick={() => setSelectedItem(item)}
                />
              ))
            )}
          </div>
        </div>
      </main>

      <div data-sheet>
        <ItemDetailSheet
          item={
            selectedItem
              ? {
                  ...selectedItem,
                  timePending: getTimePending(selectedItem.stageUpdatedAt),
                }
              : null
          }
          onClose={() => setSelectedItem(null)}
          onStatusChange={updateItemStatus}
          onDelete={handleDeleteItem}
          onMoveBack={handleMoveBack}
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
          onClose={() => setShowProfileSetup(false)}
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

        <AccountPlanSheet
          open={showAccountPlan}
          onClose={() => setShowAccountPlan(false)}
          profile={profile}
          plan={plan}
          onUpgrade={handleUpgradeFromAccount}
          onEditProfile={handleEditProfileFromAccount}
          onLogout={handleLogout}
        />

        <MigrationModal
          open={showMigrationModal}
          onImport={handleMigrationImport}
          onSkip={handleMigrationSkip}
        />
      </div>
    </div>
  );
}
