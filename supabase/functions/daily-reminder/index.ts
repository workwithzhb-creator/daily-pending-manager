import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async () => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const oneSignalAppId = Deno.env.get("ONESIGNAL_APP_ID")!;
  const oneSignalApiKey = Deno.env.get("ONESIGNAL_REST_API_KEY")!;

  // Fetch profiles
  const profileRes = await fetch(
    `${supabaseUrl}/rest/v1/profiles?select=id,onesignal_id`,
    {
      headers: {
        apikey: supabaseServiceKey,
        Authorization: `Bearer ${supabaseServiceKey}`,
      },
    }
  );

  const profiles = await profileRes.json();

  for (const profile of profiles) {
    if (!profile.onesignal_id) continue;

    // Fetch tasks excluding completed
    const taskRes = await fetch(
      `${supabaseUrl}/rest/v1/tasks?select=id&user_id=eq.${profile.id}&pending_type=neq.completed`,
      {
        headers: {
          apikey: supabaseServiceKey,
          Authorization: `Bearer ${supabaseServiceKey}`,
        },
      }
    );

    const tasks = await taskRes.json();
    const pendingCount = tasks.length;

    if (pendingCount === 0) continue;

    const message = `You have ${pendingCount} pending follow-ups. Open Traderlify to check your quotations, invoices & payments.`;

    await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${oneSignalApiKey}`,
      },
      body: JSON.stringify({
        app_id: oneSignalAppId,
        include_player_ids: [profile.onesignal_id],
        headings: { en: "Traderlify Reminder" },
        contents: { en: message },
      }),
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
