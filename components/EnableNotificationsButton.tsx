"use client";

import { supabase } from "@/lib/supabase/client";

export default function EnableNotificationsButton() {
  const enableNotifications = async () => {
    const OneSignal = (await import("react-onesignal")).default as any;

    try {
      // Show permission prompt
      await OneSignal.Slidedown.promptPush();

      // wait 2 seconds
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // DEBUG LOGS (VERY IMPORTANT)
      console.log("OneSignal object:", OneSignal);
      console.log("OneSignal.User:", OneSignal?.User);
      console.log("PushSubscription:", OneSignal?.User?.PushSubscription);

      let subscriptionId: string | null = null;

      // Retry to fetch subscription ID (10 seconds max)
      for (let i = 0; i < 10; i++) {
        subscriptionId = OneSignal?.User?.PushSubscription?.id || null;

        console.log("Retry", i + 1, "Subscription ID:", subscriptionId);

        if (subscriptionId) break;

        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      if (!subscriptionId) {
        alert("Subscription ID not found. Please refresh and try again.");
        return;
      }

      // Get logged in user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert("Please login first.");
        return;
      }

      // Save in profiles table
      const { error } = await supabase
        .from("profiles")
        .update({ onesignal_id: subscriptionId })
        .eq("id", user.id);

      if (error) {
        console.error("Supabase update error:", error);
        alert("Failed to save OneSignal subscription in database.");
        return;
      }

      alert("Notifications enabled successfully!");
    } catch (err) {
      console.error("Enable notification error:", err);
      alert("Error enabling notifications. Please try again.");
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
