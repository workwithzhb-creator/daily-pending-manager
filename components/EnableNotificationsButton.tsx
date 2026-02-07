"use client";

import OneSignal from "react-onesignal";
import { createClient } from "@/lib/supabase/client";

export default function EnableNotificationsButton() {
  const enableNotifications = async () => {
    try {
      await OneSignal.Slidedown.promptPush();

      let subscriptionId: string | null = null;

      for (let i = 0; i < 30; i++) {
        const optedIn = (OneSignal as any)?.User?.PushSubscription?.optedIn;

        if (optedIn) {
          subscriptionId =
            (OneSignal as any)?.User?.PushSubscription?.id || null;
        }

        if (subscriptionId) break;

        await new Promise((res) => setTimeout(res, 1000));
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

      // ✅ FORCE SAVE (Upsert)
      const { error } = await supabase.from("profiles").upsert(
        {
          id: user.id,
          onesignal_id: subscriptionId,
        },
        { onConflict: "id" }
      );

      if (error) {
        console.error("Supabase upsert error:", error);
        alert("Failed to save OneSignal subscription: " + error.message);
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
