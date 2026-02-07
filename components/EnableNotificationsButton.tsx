"use client";

import { supabase } from "@/lib/supabase/client";

export default function EnableNotificationsButton() {
  const enableNotifications = async () => {
    const OneSignal = (await import("react-onesignal")).default;

    // Ask notification permission
    await OneSignal.Slidedown.promptPush();

    // Wait for subscription to register
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Get OneSignal subscription ID
    const subscriptionId = OneSignal.User?.PushSubscription?.id;

    console.log("OneSignal Subscription ID:", subscriptionId);

    if (!subscriptionId) {
      alert("Subscription ID not found. Please refresh and try again.");
      return;
    }

    // Get logged in user from Supabase Auth
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("Please login first.");
      return;
    }

    // Save subscription ID into profiles table
    const { error } = await supabase
      .from("profiles")
      .update({ onesignal_id: subscriptionId })
      .eq("id", user.id);

    if (error) {
      console.error("Error saving OneSignal ID:", error);
      alert("Failed to save notification subscription.");
      return;
    }

    alert("Notifications enabled successfully!");
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
