"use client";

import { supabase } from "@/lib/supabaseClient";

export default function EnableNotificationsButton() {
  const enableNotifications = async () => {
    const OneSignal = (await import("react-onesignal")).default;

    // Ask permission
    await OneSignal.Slidedown.promptPush();

    // Wait a bit to allow subscription to register
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Get subscription ID correctly
    const subscriptionId = OneSignal.User?.PushSubscription?.id;

    console.log("OneSignal Subscription ID:", subscriptionId);

    if (!subscriptionId) {
      alert("Subscription ID not found. Please refresh and try again.");
      return;
    }

    // Get logged-in user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("Please login first.");
      return;
    }

    // Save to profiles
    const { error } = await supabase
      .from("profiles")
      .update({ onesignal_id: subscriptionId })
      .eq("id", user.id);

    if (error) {
      console.error("Supabase update error:", error);
      alert("Error saving OneSignal ID in database.");
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
