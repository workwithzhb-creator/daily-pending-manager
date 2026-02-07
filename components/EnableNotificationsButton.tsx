"use client";

import OneSignal from "react-onesignal";
import { createClient } from "@/lib/supabase/client";

export default function EnableNotificationsButton() {
  const enableNotifications = async () => {
    try {
      // 1) Ask permission
      await OneSignal.Slidedown.promptPush();

      // 2) Get subscription ID
      const subscriptionId = OneSignal?.User?.PushSubscription?.id;

      if (!subscriptionId) {
        alert("Subscription ID not found. Please refresh and try again.");
        return;
      }

      // 3) Get logged-in user
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert("User not logged in.");
        return;
      }

      // 4) Save subscriptionId in profiles table
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
