import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const ONESIGNAL_APP_ID = Deno.env.get("ONESIGNAL_APP_ID")!;
const ONESIGNAL_API_KEY = Deno.env.get("ONESIGNAL_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async () => {
  try {
    // Fetch all users who enabled notifications
    const profilesRes = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?select=id,onesignal_id`,
      {
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    );

    const profiles = await profilesRes.json();

    const validUsers = profiles.filter((p: any) => p.onesignal_id);

    if (validUsers.length === 0) {
      return new Response(JSON.stringify({ message: "No subscribed users" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Send notification to each user
    for (const user of validUsers) {
      // Get pending tasks count
      const tasksRes = await fetch(
        `${SUPABASE_URL}/rest/v1/tasks?select=id&user_id=eq.${user.id}`,
        {
          headers: {
            apikey: SUPABASE_SERVICE_ROLE_KEY,
            Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          },
        }
      );

      const tasks = await tasksRes.json();

      if (!tasks || tasks.length === 0) continue;

      const taskCount = tasks.length;

      // Send OneSignal Push Notification
      await fetch("https://onesignal.com/api/v1/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${ONESIGNAL_API_KEY}`,
        },
        body: JSON.stringify({
          app_id: ONESIGNAL_APP_ID,
          include_player_ids: [user.onesignal_id],
          headings: { en: "Traderlify Reminder" },
          contents: {
            en: `You have ${taskCount} pending follow-ups today. Open Traderlify now.`,
          },
          url: "https://traderlify.vercel.app",
        }),
      });
    }

    return new Response(
      JSON.stringify({ success: true, sent_to: validUsers.length }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
