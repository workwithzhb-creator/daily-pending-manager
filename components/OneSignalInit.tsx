"use client";

import { useEffect } from "react";

export default function OneSignalInit() {
  useEffect(() => {
    const initOneSignal = async () => {
      const OneSignal = (await import("react-onesignal")).default;

      await OneSignal.init({
        appId: "51a390df-a96d-4612-8468-3cd8848b8caf",
        allowLocalhostAsSecureOrigin: true,
        notifyButton: {
          enable: false,
        },
      });
    };

    initOneSignal();
  }, []);

  return null;
}
