"use client";

import OneSignal from "react-onesignal";
import { createClient } from "@/lib/supabase/client";

export default function EnableNotificationsButton() {
  const enableNotifications = async () => {
    try {
      await OneSignal.Slidedown.promptPush();

      const supabase = createClient();

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        alert("User not logged in. Please login again.");
        console.log("User Error:", userError);
        return;
      }

      // Get subscription id
      const subscriptionId = OneSignal.User.PushSubscription.id;

      console.log("Subscription ID:", subscriptionId);

      if (!subscriptionId) {
        alert("Subscription ID not found. Please refresh and try again.");
        return;
      }

      const { data, error } = await supabase.from("profiles").upsert({
        id: user.id,
        onesignal_id: subscriptionId,
      });

      console.log("UPSERT DATA:", data);
      console.log("UPSERT ERROR:", error);

      if (error) {
        alert("Database error: " + error.message);
        return;
      }

      alert("OneSignal subscription saved successfully!");
    } catch (err: any) {
      console.log("Unexpected Error:", err);
      alert("Unexpected error: " + err.message);
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
