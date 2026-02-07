"use client";

import OneSignal from "react-onesignal";
import { createClient } from "@/lib/supabase/client";

export default function EnableNotificationsButton() {
  const enableNotifications = async () => {
    try {
      // 1) Prompt push permission
      await OneSignal.Slidedown.promptPush();

      // 2) Wait until OneSignal is fully ready + subscribed
      let subscriptionId: string | null = null;

      for (let i = 0; i < 30; i++) {
        const optedIn = (OneSignal as any)?.User?.PushSubscription?.optedIn;

        if (optedIn) {
          subscriptionId = (OneSignal as any)?.User?.PushSubscription?.id || null;
        }

        if (subscriptionId) break;

        await new Promise((res) => setTimeout(res, 1000));
      }

      console.log("OneSignal optedIn:", (OneSignal as any)?.User?.PushSubscription?.optedIn);
      console.log("OneSignal subscriptionId:", subscriptionId);

      if (!subscriptionId) {
        alert(
          "Subscription ID not found yet. Please wait 5 seconds and refresh the page, then try again."
        );
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

      // 4) Save subscription id to profiles table
      const { error } = await supabase
        .from("profiles")
        .update({ onesignal_id: subscriptionId })
        .eq("user_id", user.id);

      if (error) {
        console.error("Supabase error:", error);
        alert("Failed to save OneSignal subscription in database.");
        return;
      }

      alert("Notifications enabled successfully!");
    } catch (err) {
      console.error("Enable notification error:", err);
      alert("Something went wrong enabling notifications.");
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
