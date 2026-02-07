"use client";

import OneSignal from "react-onesignal";
import { createClient } from "@/lib/supabase/client";

export default function EnableNotificationsButton() {
  const enableNotifications = async () => {
    try {
      // Ask notification permission
      await OneSignal.Slidedown.promptPush();

      // Wait until OneSignal generates subscription ID
      let subscriptionId: string | null = null;

      for (let i = 0; i < 15; i++) {
        subscriptionId = OneSignal?.User?.PushSubscription?.id ?? null;
        if (subscriptionId) break;
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      if (!subscriptionId) {
        alert("Subscription ID not found. Please refresh and try again.");
        return;
      }

      // Create supabase client
      const supabase = createClient();

      // Get logged in user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        alert("User not logged in.");
        return;
      }

      // Update profiles table
      const { error } = await supabase
        .from("profiles")
        .update({ onesignal_id: subscriptionId })
        .eq("user_id", user.id);

      if (error) {
        alert("Failed to save OneSignal subscription: " + error.message);
        return;
      }

      alert("Notification enabled successfully!");
    } catch (err: any) {
      alert("Error enabling notifications: " + err.message);
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
