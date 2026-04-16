export const SITE_EMAIL = "info@xaeons.com";

export function isMeetingSchedulerUrlConfigured(): boolean {
  return Boolean(import.meta.env.VITE_MEETING_SCHEDULE_URL?.trim());
}

export type MeetingScheduleLink = {
  href: string;
  opensInNewTab: boolean;
};

/**
 * Uses VITE_MEETING_SCHEDULE_URL (Cal.com, Calendly, etc.) when set;
 * otherwise a mailto: template for scheduling.
 */
export function getMeetingScheduleLink(options?: {
  serviceTitle?: string;
}): MeetingScheduleLink {
  const scheduleMeetingUrl =
    import.meta.env.VITE_MEETING_SCHEDULE_URL?.trim() || null;
  if (scheduleMeetingUrl) {
    return { href: scheduleMeetingUrl, opensInNewTab: true };
  }

  const title = options?.serviceTitle;
  const subject = title
    ? `Schedule a consultation — ${title}`
    : "Schedule a call with Xaeon";
  const body = title
    ? `Hi Xaeon,\n\nI'd like to schedule a consultation about: ${title}\n\nPreferred times:\n\n`
    : `Hi Xaeon,\n\nI'd like to schedule a call.\n\nPreferred times:\n\n`;

  return {
    href: `mailto:${SITE_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
    opensInNewTab: false,
  };
}
