"use client";

import OneSignal from "react-onesignal";

export default function EnableNotificationsButton({
  onEnabled,
  className = "",
}: {
  onEnabled?: () => void;
  className?: string;
}) {
  const enableNotifications = async () => {
    await OneSignal.Slidedown.promptPush();
    onEnabled?.();
  };

  return (
    <button
      onClick={enableNotifications}
      className={
        className ||
        "bg-gradient-to-br from-indigo-500 to-purple-500 text-white px-4 py-2 rounded-xl shadow"
      }
    >
      Enable Notifications
    </button>
  );
}
