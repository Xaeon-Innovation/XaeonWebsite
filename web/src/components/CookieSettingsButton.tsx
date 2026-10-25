"use client";

import { useEffect, useState } from "react";
import { analyticsEnabled, openConsentSettings } from "@/lib/analytics";

/** Footer link to reopen the consent bar; only rendered when analytics is configured. */
export default function CookieSettingsButton({ label }: { label: string }) {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => setEnabled(analyticsEnabled()), []);
  if (!enabled) return null;
  return (
    <button type="button" onClick={openConsentSettings} className="hover:text-fog">
      {label}
    </button>
  );
}
