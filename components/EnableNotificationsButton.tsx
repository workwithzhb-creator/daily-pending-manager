"use client";

import OneSignal from "react-onesignal";
import { createClient } from "@/lib/supabase/client";

export default function EnableNotificationsButton() {
  const enableNotifications = async () => {
    try {
      alert("Step 1: Prompting notification...");

      await OneSignal.Slidedown.promptPush();

      alert("Step 2: Permission given. Fetching subscription ID...");

      let subscriptionId: string | null = null;

      for (let i = 0; i < 20; i++) {
        subscriptionId = (OneSignal as any)?.User?.PushSubscription?.id ?? null;
        if (subscriptionId) break;
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      alert("Step 3: Subscription ID = " + subscriptionId);

      if (!subscriptionId) {
        alert("FAILED: Subscription ID still null.");
        return;
      }

      const supabase = createClient();

      alert("Step 4: Checking logged-in user...");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      alert("User Error = " + JSON.stringify(userError));
      alert("User = " + JSON.stringify(user));

      if (!user) {
        alert("FAILED: User not logged in.");
        return;
      }

      alert("Step 5: Updating Supabase profiles table...");

      const { data, error } = await supabase
        .from("profiles")
        .update({ onesignal_id: subscriptionId })
        .eq("id", user.id)
        .select();

      alert("Update Error = " + JSON.stringify(error));
      alert("Update Data = " + JSON.stringify(data));

      if (error) {
        alert("FAILED: " + error.message);
        return;
      }

      alert("SUCCESS: OneSignal ID saved.");
    } catch (err: any) {
      alert("CRASH ERROR: " + err.message);
      console.error(err);
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
