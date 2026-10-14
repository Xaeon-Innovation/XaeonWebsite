import { randomUUID } from "crypto";
import { google } from "googleapis";

const SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.events.freebusy",
];

export class GoogleAuthError extends Error {
  constructor(message = "Google Calendar needs to be reconnected") {
    super(message);
    this.name = "GoogleAuthError";
  }
}

export function googleOAuthConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID?.trim() &&
      process.env.GOOGLE_CLIENT_SECRET?.trim() &&
      process.env.GOOGLE_REDIRECT_URI?.trim(),
  );
}

function oauthClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  const redirectUri = process.env.GOOGLE_REDIRECT_URI?.trim();
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("Google Calendar OAuth is not configured");
  }
  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

function authedClient(refreshToken: string) {
  const client = oauthClient();
  client.setCredentials({ refresh_token: refreshToken });
  return client;
}

function asGoogleAuthError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const message = err instanceof Error ? err.message : "";
  const code =
    "code" in err && (err.code === 401 || err.code === "invalid_grant")
      ? true
      : false;
  const responseData =
    "response" in err && err.response && typeof err.response === "object"
      ? (err.response as { data?: { error?: string } }).data
      : undefined;
  return (
    code ||
    message.includes("invalid_grant") ||
    responseData?.error === "invalid_grant"
  );
}

export function buildGoogleAuthUrl(state: string): string {
  return oauthClient().generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
    state,
  });
}

export async function exchangeGoogleCode(code: string): Promise<{
  refreshToken: string;
  email: string;
}> {
  const client = oauthClient();
  const { tokens } = await client.getToken(code);
  if (!tokens.refresh_token) {
    throw new Error("Google did not return a refresh token. Remove the app's access in the Google account and connect again.");
  }
  client.setCredentials(tokens);
  const calendar = google.calendar({ version: "v3", auth: client });
  const primary = await calendar.calendars.get({ calendarId: "primary" });
  const email = primary.data.id?.trim() || "";
  return { refreshToken: tokens.refresh_token, email };
}

export type BusyInterval = { start: Date; end: Date };

export async function listBusy(
  refreshToken: string,
  timeMin: Date,
  timeMax: Date,
  timeZone: string,
): Promise<BusyInterval[]> {
  try {
    const calendar = google.calendar({ version: "v3", auth: authedClient(refreshToken) });
    const result = await calendar.freebusy.query({
      requestBody: {
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        timeZone,
        items: [{ id: "primary" }],
      },
    });
    const calendarResult = result.data.calendars?.primary;
    if (calendarResult?.errors?.length) {
      throw new Error(calendarResult.errors.map((e) => e.reason).filter(Boolean).join(", ") || "Freebusy failed");
    }
    return (calendarResult?.busy ?? []).flatMap((block) => {
      if (!block.start || !block.end) return [];
      const start = new Date(block.start);
      const end = new Date(block.end);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return [];
      return [{ start, end }];
    });
  } catch (err) {
    if (asGoogleAuthError(err)) throw new GoogleAuthError();
    throw err;
  }
}

export async function primaryCalendarEmail(refreshToken: string): Promise<string> {
  try {
    const calendar = google.calendar({ version: "v3", auth: authedClient(refreshToken) });
    const primary = await calendar.calendars.get({ calendarId: "primary" });
    return primary.data.id?.trim() || "";
  } catch (err) {
    if (asGoogleAuthError(err)) throw new GoogleAuthError();
    throw err;
  }
}

function meetLinkFromEvent(data: {
  hangoutLink?: string | null;
  conferenceData?: {
    entryPoints?: { entryPointType?: string | null; uri?: string | null }[] | null;
  } | null;
}): string {
  if (data.hangoutLink?.startsWith("https://")) return data.hangoutLink;
  const video = data.conferenceData?.entryPoints?.find(
    (entry) => entry.entryPointType === "video" && entry.uri?.startsWith("https://"),
  );
  return video?.uri ?? "";
}

export async function createMeetEvent(options: {
  refreshToken: string;
  summary: string;
  description: string;
  start: Date;
  end: Date;
  timeZone: string;
  attendees: string[];
}): Promise<{ eventId: string; meetLink: string }> {
  try {
    const calendar = google.calendar({ version: "v3", auth: authedClient(options.refreshToken) });
    const inserted = await calendar.events.insert({
      calendarId: "primary",
      conferenceDataVersion: 1,
      sendUpdates: "all",
      requestBody: {
        summary: options.summary,
        description: options.description,
        start: { dateTime: options.start.toISOString(), timeZone: options.timeZone },
        end: { dateTime: options.end.toISOString(), timeZone: options.timeZone },
        attendees: options.attendees.map((email) => ({ email })),
        conferenceData: {
          createRequest: {
            requestId: randomUUID(),
            conferenceSolutionKey: { type: "hangoutsMeet" },
          },
        },
      },
    });

    let meetLink = meetLinkFromEvent(inserted.data);
    const eventId = inserted.data.id ?? "";
    if (!meetLink && eventId) {
      const again = await calendar.events.get({ calendarId: "primary", eventId });
      meetLink = meetLinkFromEvent(again.data);
    }
    if (!eventId || !meetLink) {
      if (eventId) {
        await calendar.events.delete({ calendarId: "primary", eventId, sendUpdates: "all" }).catch(() => undefined);
      }
      throw new Error("Google Calendar did not return a Meet link");
    }
    return { eventId, meetLink };
  } catch (err) {
    if (err instanceof GoogleAuthError || (err instanceof Error && err.message === "Google Calendar did not return a Meet link")) {
      throw err;
    }
    if (asGoogleAuthError(err)) throw new GoogleAuthError();
    throw err;
  }
}

export async function deleteMeetEvent(refreshToken: string, eventId: string): Promise<void> {
  if (!refreshToken || !eventId) return;
  try {
    const calendar = google.calendar({ version: "v3", auth: authedClient(refreshToken) });
    await calendar.events.delete({
      calendarId: "primary",
      eventId,
      sendUpdates: "all",
    });
  } catch (err) {
    const status =
      err && typeof err === "object" && "code" in err ? Number(err.code) : 0;
    if (status === 404 || status === 410) return;
    if (asGoogleAuthError(err)) throw new GoogleAuthError();
    throw err;
  }
}
