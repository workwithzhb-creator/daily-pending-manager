"use client";

import { useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function OneSignalInit() {
  useEffect(() => {
    const initOneSignal = async () => {
      const OneSignal = (await import("react-onesignal")).default;

      await OneSignal.init({
        appId: "51a390df-a96d-4612-8468-3cd8848b8caf",
        allowLocalhostAsSecureOrigin: true,
      });

      // Get logged-in user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      // Get OneSignal subscription ID
      const subscriptionId = await OneSignal.User.PushSubscription.id;

      if (!subscriptionId) return;

      // Update subscription id in profiles table every time (safe)
      await supabase
        .from("profiles")
        .update({ onesignal_id: subscriptionId })
        .eq("user_id", user.id);
    };

    initOneSignal();
  }, []);

  return null;
}
