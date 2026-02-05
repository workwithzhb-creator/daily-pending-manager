"use client";

import { useState, useRef, useEffect } from "react";
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
import { AuthSheet } from "@/components/auth-sheet";
import { createClient } from "@/lib/supabase/client";

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
  if (item.pendingType === "paymentFollowup" && item.invoiceDueDate) {
    const daysUntil = getDaysUntilDueDate(item.invoiceDueDate);
    if (daysUntil !== null) {
      return {
        days: daysUntil < 0 ? Math.abs(daysUntil) : 0,
        daysUntil,
      };
    }
  }

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
  const supabase = createClient();
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
  const [showAuthSheet, setShowAuthSheet] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  const tasksRef = useRef<HTMLDivElement>(null);
  const summaryCardsRef = useRef<HTMLDivElement>(null);
  const pipelineStagesRef = useRef<HTMLDivElement>(null);

  /* ---------------- LOAD EVERYTHING ON FIRST OPEN ---------------- */

  useEffect(() => {
    async function loadData() {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (!currentUser) {
        setShowAuthSheet(true);
        setLoading(false);
        return;
      }

      setUser(currentUser);
      setShowAuthSheet(false);

      // Load profile from Supabase
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (profileData) {
        // Load from localStorage if available for full profile data
        const savedProfile = localStorage.getItem("dp_user_profile");
        if (savedProfile) {
          try {
            const parsed = JSON.parse(savedProfile);
            setProfile(parsed);
          } catch {
            // If parsing fails, create minimal profile from Supabase data
            setProfile({
              name: profileData.name || "",
              countryCode: "+966",
              whatsapp: "",
            });
          }
        } else {
          // Create minimal profile from Supabase data
          setProfile({
            name: profileData.name || "",
            countryCode: "+966",
            whatsapp: "",
          });
        }
      } else {
        // Fallback to localStorage for migration
        const savedProfile = localStorage.getItem("dp_user_profile");
        if (savedProfile) {
          try {
            const parsed = JSON.parse(savedProfile);
            setProfile(parsed);
            // Save to Supabase
            await supabase.from("profiles").insert({
              user_id: user.id,
              name: parsed.name || "",
            });
          } catch {
            localStorage.removeItem("dp_user_profile");
          }
        }
      }

      // Load plan from Supabase
      const { data: planData } = await supabase
        .from("user_plans")
        .select("plan")
        .eq("user_id", user.id)
        .single();

      if (planData && (planData.plan === "basic" || planData.plan === "free")) {
        setPlan(planData.plan);
      } else {
        // Fallback to localStorage
        const savedPlan = localStorage.getItem("dp_plan");
        if (savedPlan === "basic" || savedPlan === "free") {
          setPlan(savedPlan);
          await supabase.from("user_plans").upsert({
            user_id: user.id,
            plan: savedPlan,
          });
        } else {
          setPlan("free");
          await supabase.from("user_plans").upsert({
            user_id: user.id,
            plan: "free",
          });
        }
      }

      // Load items from Supabase
      const { data: itemsData, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", currentUser.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading tasks:", error);
      }

      if (itemsData && itemsData.length > 0) {
        // Convert Supabase data to PendingItem format
        const convertedItems: PendingItem[] = itemsData.map((item: any) => ({
          id: item.id,
          customerName: item.customer_name,
          pendingType: item.pending_type,
          createdAt: item.created_at ? new Date(item.created_at) : undefined,
          timePending: "",
          label: item.label || "",
          value: item.value || undefined,
          invoiceDueDate: item.invoice_due_date || undefined,
          paymentStage: item.payment_stage || undefined,
          whatsapp: item.whatsapp || undefined,
          rfqNumber: item.rfq_number || undefined,
          completedAt: item.completed_at || undefined,
        }));
        setItems(convertedItems);
        setLoading(false);
      } else {
        // Check for localStorage data for migration (only if user just signed in)
        const savedItems = localStorage.getItem("dp_items");
        if (savedItems) {
          const parsed = safeParsePendingItems(savedItems);
          if (parsed && parsed.length > 0) {
            // Show migration modal
            setShowMigrationModal(true);
            setLoading(false);
            return;
          }
        }
        // Empty dashboard for new users
        setItems([]);
        setLoading(false);
      }

      // First-time onboarding: show only once
      const { data: onboardingData } = await supabase
        .from("user_settings")
        .select("onboarding_done")
        .eq("user_id", currentUser.id)
        .single();

      if (!onboardingData?.onboarding_done) {
        const localOnboarding = localStorage.getItem("dp_onboarding_done");
        if (localOnboarding === "yes") {
          await supabase.from("user_settings").upsert({
            user_id: currentUser.id,
            onboarding_done: true,
          });
        } else {
          setShowOnboarding(true);
        }
      }
    }

    loadData();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: string, session: any) => {
      if (event === "SIGNED_IN" && session) {
        setUser(session.user);
        setShowAuthSheet(false);
        loadData();
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setShowAuthSheet(true);
        setItems([]);
        setProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router, supabase]);

  /* ---------------- SAVE ITEMS TO SUPABASE ---------------- */

  useEffect(() => {
    async function saveItems() {
      if (loading || !user || items.length === 0) return;

      // Convert items to Supabase format and upsert
      const tasksToSave = items.map((item) => ({
        id: item.id,
        user_id: user.id,
        customer_name: item.customerName,
        pending_type: item.pendingType,
        created_at: item.createdAt?.toISOString() || new Date().toISOString(),
        label: item.label || "",
        value: item.value || null,
        invoice_due_date: item.invoiceDueDate || null,
        payment_stage: item.paymentStage || null,
        whatsapp: item.whatsapp || null,
        rfq_number: item.rfqNumber || null,
        completed_at: item.completedAt || null,
      }));

      // Delete all existing tasks and insert new ones (simple approach)
      await supabase.from("tasks").delete().eq("user_id", user.id);

      if (tasksToSave.length > 0) {
        await supabase.from("tasks").insert(tasksToSave);
      }
    }

    if (!loading && user) {
      saveItems();
    }
  }, [items, loading, user, supabase]);

  async function dismissOnboarding() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await supabase.from("user_settings").upsert({
        user_id: user.id,
        onboarding_done: true,
      });
    }

    localStorage.setItem("dp_onboarding_done", "yes");
    setShowOnboarding(false);
  }

  async function handleSaveProfile(data: UserProfile) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await supabase.from("profiles").upsert({
        user_id: user.id,
        name: data.name || "",
      });
    }

    // Also save to localStorage for backward compatibility
    localStorage.setItem("dp_user_profile", JSON.stringify(data));
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

    // Convert and save to Supabase
    const tasksToSave = parsed.map((item) => ({
      id: item.id,
      user_id: user.id,
      customer_name: item.customerName,
      pending_type: item.pendingType,
      created_at: item.createdAt?.toISOString() || new Date().toISOString(),
      label: item.label || "",
      value: item.value || null,
      invoice_due_date: item.invoiceDueDate || null,
      payment_stage: item.paymentStage || null,
      whatsapp: item.whatsapp || null,
      rfq_number: item.rfqNumber || null,
      completed_at: item.completedAt || null,
    }));

    await supabase.from("tasks").insert(tasksToSave);

    // Clear localStorage
    localStorage.removeItem("dp_items");

    // Reload items
    const { data: itemsData } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (itemsData) {
      const convertedItems: PendingItem[] = itemsData.map((item: any) => ({
        id: item.id,
        customerName: item.customer_name,
        pendingType: item.pending_type,
        createdAt: item.created_at ? new Date(item.created_at) : undefined,
        timePending: "",
        label: item.label || "",
        value: item.value || undefined,
        invoiceDueDate: item.invoice_due_date || undefined,
        paymentStage: item.payment_stage || undefined,
        whatsapp: item.whatsapp || undefined,
        rfqNumber: item.rfq_number || undefined,
        completedAt: item.completed_at || undefined,
      }));
      setItems(convertedItems);
    }

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
    await supabase.auth.signOut();
    setUser(null);
    setItems([]);
    setProfile(null);
    setShowAuthSheet(true);
  }

  function handleAuthSuccess() {
    // Auth success will trigger auth state change listener
    // which will reload data
  }

  /* ---------------- RFQ SAVE ---------------- */

  const activeTaskCount = items.filter((i) => i.pendingType !== "completed")
    .length;

  async function handleSaveRFQ(data: RFQPayload) {
    if (!user) {
      setShowAuthSheet(true);
      return;
    }

    if (plan === "free" && activeTaskCount >= 10) {
      setShowAddRFQ(false);
      setShowFreeLimitModal(true);
      return;
    }

    const newItem: PendingItem = {
      id: crypto.randomUUID(),
      customerName: data.customerName,
      pendingType: "quotation",
      createdAt: new Date(),
      timePending: "",
      label: data.note || data.rfqNumber,
      whatsapp: data.whatsapp,
      rfqNumber: data.rfqNumber,
    };

    // Update local state immediately
    setItems((prev) => [newItem, ...prev]);

    // Save to Supabase
    await supabase.from("tasks").insert({
      id: newItem.id,
      user_id: user.id,
      customer_name: newItem.customerName,
      pending_type: newItem.pendingType,
      created_at: newItem.createdAt?.toISOString() || new Date().toISOString(),
      label: newItem.label || "",
      whatsapp: newItem.whatsapp || null,
      rfq_number: newItem.rfqNumber || null,
    });

    setShowAddRFQ(false);
  }

  async function updateItemStatus(
    id: string,
    status: PendingType,
    paymentStage?: "advance" | "balance",
    invoiceDueDate?: string
  ) {
    if (!user) return;

    const isCompleted = status === "completed";
    const completedAtValue = isCompleted ? new Date().toISOString() : undefined;

    // Update local state immediately
    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i;

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
            ...(completedAtValue && { completedAt: completedAtValue }),
          };
        }

        return {
          ...i,
          pendingType: status,
          ...(paymentStage !== undefined && { paymentStage }),
          ...(invoiceDueDate && { invoiceDueDate }),
          ...(completedAtValue && { completedAt: completedAtValue }),
        };
      })
    );

    // Update in Supabase
    const updatedItem = items.find((i) => i.id === id);
    if (updatedItem) {
      await supabase
        .from("tasks")
        .update({
          pending_type: status,
          payment_stage: paymentStage || null,
          invoice_due_date: invoiceDueDate || null,
          completed_at: completedAtValue || null,
        })
        .eq("id", id)
        .eq("user_id", user.id);
    }

    setSelectedItem(null);
  }

  async function handleDeleteItem(id: string) {
    if (!user) return;

    // Update local state immediately
    setItems((prev) => prev.filter((i) => i.id !== id));
    setSelectedItem(null);

    // Delete from Supabase
    await supabase.from("tasks").delete().eq("id", id).eq("user_id", user.id);
  }

  async function handleMoveBack(id: string) {
    if (!user) return;

    const moveBackMap: Record<PendingType, PendingType | null> = {
      quotation: null, // Cannot go back
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

    // Update local state immediately
    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i;

        return {
          ...i,
          pendingType: previousStage,
          // Clear completedAt if moving back from completed
          ...(i.pendingType === "completed" && { completedAt: undefined }),
        };
      })
    );

    // Update in Supabase
    await supabase
      .from("tasks")
      .update({
        pending_type: previousStage,
        completed_at: currentItem.pendingType === "completed" ? null : currentItem.completedAt || null,
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

  function isCreatedToday(createdAt?: Date): boolean {
    if (!createdAt) return false;
    const now = new Date();
    const created = new Date(createdAt);
    return (
      now.getFullYear() === created.getFullYear() &&
      now.getMonth() === created.getMonth() &&
      now.getDate() === created.getDate()
    );
  }

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

    // Calculate today tasks for ProgressRing
    const isTodayTask =
      days === 0 ||
      (i.pendingType === "paymentFollowup" &&
        i.invoiceDueDate &&
        daysUntil !== undefined &&
        daysUntil >= 0 &&
        daysUntil <= 7);

    // Count today tasks (excluding completed)
    if (isTodayTask && i.pendingType !== "completed") {
      todayTotalCount++;
    }

    // Count completed tasks completed today (using completedAt)
    if (i.pendingType === "completed" && isCompletedToday(i.completedAt)) {
      todayCompletedCount++;
    }
  });

  let visibleItems = [...items];

  if (activePriority) {
    visibleItems = visibleItems.filter((i) => {
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
    if (!profile) {
      setPendingRFQOpen(true);
      setShowProfileSetup(true);
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
          {profile?.name ? profile.name.charAt(0).toUpperCase() : "A"}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold">
              {user
                ? profile?.name
                  ? `${getGreeting()}, ${profile.name}`
                  : user.email
                  ? `${getGreeting()}, ${user.email.split("@")[0]}`
                  : getGreeting()
                : "Welcome"}
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
          <ProgressRing completed={todayCompletedCount} total={todayTotalCount} />
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
            {visibleItems.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-500 text-sm">
                  {user ? "No tasks yet" : "Sign in to manage your tasks"}
                </p>
              </div>
            ) : (
              visibleItems.map((item) => (
                <DealCard
                  key={item.id}
                  item={{
                    ...item,
                    timePending: getTimePending(item.createdAt),
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
                  timePending: getTimePending(selectedItem.createdAt),
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

        {/* Free plan limit modal */}
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
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold text-slate-900 text-center">
                You&apos;re at your Free Plan limit
              </h2>
              <p className="text-sm text-slate-600 text-center mt-4 leading-relaxed">
                Free plan allows only 10 active tasks. Upgrade to track unlimited
                quotations, invoices, and payments.
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
          onLogout={handleLogout}
        />

        {/* Migration Modal */}
        <MigrationModal
          open={showMigrationModal}
          onImport={handleMigrationImport}
          onSkip={handleMigrationSkip}
        />

        {/* Auth Sheet */}
        <AuthSheet open={showAuthSheet} onSuccess={handleAuthSuccess} />
      </div>
    </div>
  );
}
