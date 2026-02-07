"use client";

import OneSignal from "react-onesignal";
import { createClient } from "@/lib/supabase/client";

export default function EnableNotificationsButton() {
  const enableNotifications = async () => {
    try {
      await OneSignal.Slidedown.promptPush();

      let subscriptionId: string | null = null;

      for (let i = 0; i < 20; i++) {
        subscriptionId = (OneSignal as any)?.User?.PushSubscription?.id ?? null;
        if (subscriptionId) break;
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      if (!subscriptionId) {
        alert("Subscription ID not found. Please refresh and try again.");
        return;
      }

      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert("User not logged in.");
        return;
      }

      // ✅ UPDATE USING user_id COLUMN (NOT id)
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
