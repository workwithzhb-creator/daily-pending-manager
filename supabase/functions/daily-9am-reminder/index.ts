import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const ONESIGNAL_APP_ID = Deno.env.get("ONESIGNAL_APP_ID")!;
const ONESIGNAL_REST_API_KEY = Deno.env.get("ONESIGNAL_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async () => {
  try {
    console.log("🚀 Daily reminder function started...");

    // Fetch all users who enabled notifications
    const profilesRes = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?select=user_id,onesignal_id`,
      {
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    );

    const profiles = await profilesRes.json();

    const validUsers = profiles.filter((p: any) => p.onesignal_id);

    console.log("Profiles fetched:", validUsers.length);

    if (validUsers.length === 0) {
      return new Response(
        JSON.stringify({ message: "No subscribed users found" }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    let sentCount = 0;

    for (const user of validUsers) {
      console.log("Checking tasks for user:", user.user_id);

      const tasksRes = await fetch(
        `${SUPABASE_URL}/rest/v1/tasks?select=id&user_id=eq.${user.user_id}&pending_type=neq.completed`,
        {
          headers: {
            apikey: SUPABASE_SERVICE_ROLE_KEY,
            Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          },
        }
      );

      const tasks = await tasksRes.json();

      if (!tasks || tasks.length === 0) {
        console.log("No pending tasks for user:", user.user_id);
        continue;
      }

      const taskCount = tasks.length;
      console.log(`Pending tasks for ${user.user_id}:`, taskCount);

      // Send OneSignal push
      const oneSignalRes = await fetch("https://onesignal.com/api/v1/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${ONESIGNAL_REST_API_KEY}`,
        },
        body: JSON.stringify({
          app_id: ONESIGNAL_APP_ID,

          // IMPORTANT: For OneSignal v16 web push use subscription ids
          include_subscription_ids: [user.onesignal_id],

          headings: { en: "Traderlify Reminder" },
          contents: {
            en: `You have ${taskCount} pending follow-ups today. Open Traderlify now.`,
          },
          url: "https://traderlify.vercel.app",
        }),
      });

      const oneSignalData = await oneSignalRes.json();
      console.log("OneSignal response:", oneSignalData);

      if (oneSignalRes.ok && oneSignalData?.id) {
        sentCount++;
      } else {
        console.log("❌ OneSignal push failed:", oneSignalData);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        total_users: validUsers.length,
        sent_to: sentCount,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("ERROR:", err);

    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
