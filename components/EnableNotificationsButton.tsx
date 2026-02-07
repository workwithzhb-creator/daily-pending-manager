"use client";

import OneSignal from "react-onesignal";
import { createClient } from "@/lib/supabase/client";

export default function EnableNotificationsButton() {
  const enableNotifications = async () => {
    try {
      // 1) Ask user permission
      await OneSignal.Slidedown.promptPush();

      // 2) Wait until OneSignal generates subscription id
      let subscriptionId: string | null = null;

      for (let i = 0; i < 20; i++) {
        subscriptionId = (OneSignal as any)?.User?.PushSubscription?.id ?? null;

        if (subscriptionId) break;

        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      console.log("Subscription ID:", subscriptionId);

      if (!subscriptionId) {
        alert("Subscription ID not found. Please refresh and try again.");
        return;
      }

      // 3) Create Supabase client
      const supabase = createClient();

      // 4) Get logged-in user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        alert("User not logged in.");
        return;
      }

      // 5) Update profile with OneSignal ID
      const { error } = await supabase
        .from("profiles")
        .update({ onesignal_id: subscriptionId })
        .eq("id", user.id);

      if (error) {
        console.error("Supabase update error:", error);
        alert("Failed to save OneSignal ID: " + error.message);
        return;
      }

      alert("Notifications enabled successfully!");
    } catch (err: any) {
      console.error("Enable notification error:", err);
      alert("Error: " + err.message);
    }
  };

  return (
    <button
      onClick={enableNotifications}
      className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white px-4 py-2 rounded-xl shadow"
    >
      Enable Notifications
    </button>
  );
}
