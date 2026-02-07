"use client";

import { supabase } from "@/lib/supabase/client";

const PERMISSION_POLL_MS = 500;
const PERMISSION_WAIT_MS = 15000;
const SUBSCRIPTION_RETRIES = 5;
const RETRY_DELAY_MS = 1000;

export default function EnableNotificationsButton() {
  const enableNotifications = async () => {
    const OneSignal = (await import("react-onesignal")).default;

    // 1. Prompt push permission
    await OneSignal.Slidedown.promptPush();

    // 2. Wait until permission is granted (poll)
    const permissionGranted = await new Promise<boolean>((resolve) => {
      const start = Date.now();
      const check = () => {
        const granted =
          OneSignal.Notifications?.permission === true ||
          OneSignal.User?.PushSubscription?.optedIn === true;
        if (granted) {
          resolve(true);
          return;
        }
        if (Date.now() - start >= PERMISSION_WAIT_MS) {
          resolve(false);
          return;
        }
        setTimeout(check, PERMISSION_POLL_MS);
      };
      check();
    });

    if (!permissionGranted) {
      alert("Notification permission was not granted. You can enable it later in your browser settings.");
      return;
    }

    // 3. Fetch OneSignal subscription ID with retries (up to 5 times, 1 sec each)
    let subscriptionId: string | null | undefined = null;
    for (let attempt = 0; attempt < SUBSCRIPTION_RETRIES; attempt++) {
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
      subscriptionId = OneSignal.User?.PushSubscription?.id;
      if (subscriptionId) break;
    }

    if (!subscriptionId) {
      alert(
        "We couldn’t register your device for notifications after a few tries. Please refresh the page and try again, or check your browser settings."
      );
      return;
    }

    // 4. Get logged in user and save to Supabase profiles
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("Please sign in first to save your notification preferences.");
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({ onesignal_id: subscriptionId })
      .eq("user_id", user.id);

    if (error) {
      console.error("Error saving OneSignal ID:", error);
      alert("Notifications were allowed but we couldn’t save your preference. Please try again.");
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
