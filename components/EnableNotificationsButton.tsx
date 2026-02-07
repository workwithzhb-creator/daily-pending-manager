"use client";

import { supabase } from "@/lib/supabase/client";

export default function EnableNotificationsButton() {
  const enableNotifications = async () => {
    const OneSignal = (await import("react-onesignal")).default;

    // Prompt user
    await OneSignal.Slidedown.promptPush();

    // Force opt-in (important)
    await OneSignal.User.PushSubscription.optIn();

    // Retry to fetch subscription ID
    let subscriptionId: string | null = null;

    for (let i = 0; i < 10; i++) {
      subscriptionId = OneSignal.User.PushSubscription.id;

      if (subscriptionId) break;

      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    console.log("OneSignal Subscription ID:", subscriptionId);

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

    // Save to profiles table
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
