"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleAuthError = void 0;
exports.googleOAuthConfigured = googleOAuthConfigured;
exports.buildGoogleAuthUrl = buildGoogleAuthUrl;
exports.exchangeGoogleCode = exchangeGoogleCode;
exports.listBusy = listBusy;
exports.primaryCalendarEmail = primaryCalendarEmail;
exports.createMeetEvent = createMeetEvent;
exports.deleteMeetEvent = deleteMeetEvent;
const crypto_1 = require("crypto");
const googleapis_1 = require("googleapis");
/** Full calendar access: create Meet events, read free/busy, and read the primary calendar. */
const SCOPES = ["https://www.googleapis.com/auth/calendar"];
class GoogleAuthError extends Error {
    constructor(message = "Google Calendar needs to be reconnected") {
        super(message);
        this.name = "GoogleAuthError";
    }
}
exports.GoogleAuthError = GoogleAuthError;
function googleOAuthConfigured() {
    return Boolean(process.env.GOOGLE_CLIENT_ID?.trim() &&
        process.env.GOOGLE_CLIENT_SECRET?.trim() &&
        process.env.GOOGLE_REDIRECT_URI?.trim());
}
function oauthClient() {
    const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
    const redirectUri = process.env.GOOGLE_REDIRECT_URI?.trim();
    if (!clientId || !clientSecret || !redirectUri) {
        throw new Error("Google Calendar OAuth is not configured");
    }
    return new googleapis_1.google.auth.OAuth2(clientId, clientSecret, redirectUri);
}
function authedClient(refreshToken) {
    const client = oauthClient();
    client.setCredentials({ refresh_token: refreshToken });
    return client;
}
function asGoogleAuthError(err) {
    if (!err || typeof err !== "object")
        return false;
    const message = err instanceof Error ? err.message : "";
    const code = "code" in err && (err.code === 401 || err.code === "invalid_grant")
        ? true
        : false;
    const responseData = "response" in err && err.response && typeof err.response === "object"
        ? err.response.data
        : undefined;
    return (code ||
        message.includes("invalid_grant") ||
        responseData?.error === "invalid_grant");
}
function buildGoogleAuthUrl(state) {
    return oauthClient().generateAuthUrl({
        access_type: "offline",
        prompt: "consent",
        scope: SCOPES,
        state,
    });
}
async function exchangeGoogleCode(code) {
    const client = oauthClient();
    const { tokens } = await client.getToken(code);
    if (!tokens.refresh_token) {
        throw new Error("Google did not return a refresh token. Remove the app's access in the Google account and connect again.");
    }
    client.setCredentials(tokens);
    const calendar = googleapis_1.google.calendar({ version: "v3", auth: client });
    const primary = await calendar.calendars.get({ calendarId: "primary" });
    const email = primary.data.id?.trim() || "";
    return { refreshToken: tokens.refresh_token, email };
}
async function listBusy(refreshToken, timeMin, timeMax, timeZone) {
    try {
        const calendar = googleapis_1.google.calendar({ version: "v3", auth: authedClient(refreshToken) });
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
            if (!block.start || !block.end)
                return [];
            const start = new Date(block.start);
            const end = new Date(block.end);
            if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()))
                return [];
            return [{ start, end }];
        });
    }
    catch (err) {
        if (asGoogleAuthError(err))
            throw new GoogleAuthError();
        throw err;
    }
}
async function primaryCalendarEmail(refreshToken) {
    try {
        const calendar = googleapis_1.google.calendar({ version: "v3", auth: authedClient(refreshToken) });
        const primary = await calendar.calendars.get({ calendarId: "primary" });
        return primary.data.id?.trim() || "";
    }
    catch (err) {
        if (asGoogleAuthError(err))
            throw new GoogleAuthError();
        throw err;
    }
}
function meetLinkFromEvent(data) {
    if (data.hangoutLink?.startsWith("https://"))
        return data.hangoutLink;
    const video = data.conferenceData?.entryPoints?.find((entry) => entry.entryPointType === "video" && entry.uri?.startsWith("https://"));
    return video?.uri ?? "";
}
async function createMeetEvent(options) {
    try {
        const calendar = googleapis_1.google.calendar({ version: "v3", auth: authedClient(options.refreshToken) });
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
                        requestId: (0, crypto_1.randomUUID)(),
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
    }
    catch (err) {
        if (err instanceof GoogleAuthError || (err instanceof Error && err.message === "Google Calendar did not return a Meet link")) {
            throw err;
        }
        if (asGoogleAuthError(err))
            throw new GoogleAuthError();
        throw err;
    }
}
async function deleteMeetEvent(refreshToken, eventId) {
    if (!refreshToken || !eventId)
        return;
    try {
        const calendar = googleapis_1.google.calendar({ version: "v3", auth: authedClient(refreshToken) });
        await calendar.events.delete({
            calendarId: "primary",
            eventId,
            sendUpdates: "all",
        });
    }
    catch (err) {
        const status = err && typeof err === "object" && "code" in err ? Number(err.code) : 0;
        if (status === 404 || status === 410)
            return;
        if (asGoogleAuthError(err))
            throw new GoogleAuthError();
        throw err;
    }
}
