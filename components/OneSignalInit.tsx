"use client";

import { useEffect } from "react";
import OneSignal from "react-onesignal";

export default function OneSignalInit() {
  useEffect(() => {
    async function runOneSignal() {
      await OneSignal.init({
        appId: "51a390df-a96d-4612-8468-3cd8848b8caf",
        allowLocalhostAsSecureOrigin: true,
        notifyButton: {
          enable: false,
        },
      });
    }

    runOneSignal();
  }, []);

  return null;
}
