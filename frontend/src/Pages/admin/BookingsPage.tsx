import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useSearchParams } from "react-router";

import api, { API_BASE_URL, getApiErrorMessage } from "../../lib/api";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const SLOT_LENGTHS = [15, 20, 30, 45, 60];

type DayWindow = {
  day: number;
  enabled: boolean;
  start: string;
  end: string;
};

type SettingsPayload = {
  settings: {
    timezone: string;
    slotMinutes: number;
    horizonDays: number;
    week: DayWindow[];
  };
  google: {
    configured: boolean;
    connected: boolean;
    needsReconnect: boolean;
    email: string;
  };
  email: {
    configured: boolean;
    from: string;
    notify: string[];
  };
};

function sortWeek(week: DayWindow[]): DayWindow[] {
  return [...week].sort((a, b) => a.day - b.day);
}

export function Component() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [settings, setSettings] = useState<SettingsPayload | null>(null);
  const [week, setWeek] = useState<DayWindow[]>([]);
  const [slotMinutes, setSlotMinutes] = useState(30);
  const [horizonDays, setHorizonDays] = useState(30);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const googleNotice = searchParams.get("google");
  const googleReason = searchParams.get("reason");

  const load = () => {
    setLoadError(null);
    api
      .get<SettingsPayload>("/bookings/settings")
      .then((res) => {
        setSettings(res.data);
        setWeek(sortWeek(res.data.settings.week));
        setSlotMinutes(res.data.settings.slotMinutes);
        setHorizonDays(res.data.settings.horizonDays);
      })
      .catch((err) => setLoadError(getApiErrorMessage(err, "Failed to load booking settings")));
  };

  useEffect(() => {
    load();
  }, []);

  const updateDay = (day: number, patch: Partial<DayWindow>) => {
    setWeek((current) => current.map((entry) => (entry.day === day ? { ...entry, ...patch } : entry)));
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveMessage(null);
    setLoadError(null);
    try {
      await api.put("/bookings/settings", {
        settings: { slotMinutes, horizonDays, week },
      });
      setSaveMessage("Schedule saved. The public calendar uses these hours.");
      load();
    } catch (err) {
      setLoadError(getApiErrorMessage(err, "Save failed"));
    } finally {
      setSaving(false);
    }
  };

  const disconnect = async () => {
    setDisconnecting(true);
    setLoadError(null);
    try {
      await api.post("/bookings/google/disconnect");
      setSaveMessage("Google Calendar disconnected.");
      load();
    } catch (err) {
      setLoadError(getApiErrorMessage(err, "Could not disconnect Google Calendar"));
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Bookings — Xaeon Admin</title>
      </Helmet>
      <div className="admin-page-header">
        <h2 className="admin-page-title">Bookings</h2>
      </div>
      <p style={{ color: "#94a3b8", marginBottom: 20, maxWidth: "40rem" }}>
        Weekly hours control the public Google Meet calendar. Times are Egypt time
        {settings ? ` (${settings.settings.timezone})` : ""}. An end time earlier than the start
        continues into the next morning.
      </p>

      {googleNotice === "connected" ? (
        <p style={{ color: "#72c04f", marginBottom: 12 }}>Google Calendar connected.</p>
      ) : null}
      {googleNotice === "error" ? (
        <p style={{ color: "#ef4444", marginBottom: 12 }}>
          Google Calendar was not connected{googleReason ? `: ${googleReason}` : ""}.
          <button
            type="button"
            className="admin-btn admin-btn-ghost"
            style={{ marginLeft: 8 }}
            onClick={() => setSearchParams({})}
          >
            Dismiss
          </button>
        </p>
      ) : null}
      {loadError ? <p style={{ color: "#ef4444", marginBottom: 12 }}>{loadError}</p> : null}
      {saveMessage ? <p style={{ color: "#72c04f", marginBottom: 12 }}>{saveMessage}</p> : null}

      <section style={{ marginBottom: 28, maxWidth: "40rem" }}>
        <h3 className="admin-page-title" style={{ fontSize: "1.1rem" }}>Google Calendar</h3>
        {settings ? (
          <>
            <p style={{ color: "#cbd5e1" }}>
              {settings.google.connected
                ? `Connected${settings.google.email ? ` as ${settings.google.email}` : ""}. New bookings create a Meet on this calendar.`
                : settings.google.needsReconnect
                  ? "The saved Google connection expired. Connect again to reopen booking."
                  : "Not connected. The public calendar stays closed until a Google account is connected."}
            </p>
            {!settings.google.configured ? (
              <p style={{ color: "#fbbf24" }}>
                Add GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI to the server
                environment. Point the redirect URI at the API callback, for example
                {" "}<code>https://api.xaeons.com/api/v1/bookings/google/callback</code>.
              </p>
            ) : null}
            <p style={{ color: "#94a3b8" }}>
              Email: {settings.email.configured ? `sending from ${settings.email.from}` : "RESEND_API_KEY is not set, so booking stays closed."}
              {" "}Notices go to {settings.email.notify.join(", ")}.
            </p>
            <div className="admin-form-actions">
              {settings.google.configured ? (
                <a
                  className="admin-btn admin-btn-primary"
                  href={`${API_BASE_URL.replace(/\/$/, "")}/bookings/google/start`}
                  style={{ textDecoration: "none" }}
                >
                  {settings.google.connected ? "Reconnect Google Calendar" : "Connect Google Calendar"}
                </a>
              ) : null}
              {settings.google.connected || settings.google.email ? (
                <button
                  type="button"
                  className="admin-btn admin-btn-ghost"
                  disabled={disconnecting}
                  onClick={disconnect}
                >
                  {disconnecting ? "Disconnecting…" : "Disconnect"}
                </button>
              ) : null}
            </div>
          </>
        ) : (
          <p style={{ color: "#94a3b8" }}>Loading…</p>
        )}
      </section>

      <form className="admin-form" onSubmit={save} style={{ maxWidth: "46rem" }}>
        <div className="admin-field" style={{ maxWidth: "16rem" }}>
          <label className="admin-label" htmlFor="slot-minutes">Slot length</label>
          <select
            id="slot-minutes"
            className="admin-input"
            value={slotMinutes}
            onChange={(e) => setSlotMinutes(Number(e.target.value))}
          >
            {SLOT_LENGTHS.map((minutes) => (
              <option key={minutes} value={minutes}>{minutes} minutes</option>
            ))}
          </select>
        </div>
        <div className="admin-field" style={{ maxWidth: "16rem" }}>
          <label className="admin-label" htmlFor="horizon-days">Days ahead clients can book</label>
          <input
            id="horizon-days"
            className="admin-input"
            type="number"
            min={1}
            max={180}
            value={horizonDays}
            onChange={(e) => setHorizonDays(Number(e.target.value))}
          />
        </div>

        <div className="admin-field">
          <span className="admin-label">Weekly hours</span>
          <div style={{ display: "grid", gap: 10 }}>
            {week.map((entry) => {
              const overnight = entry.enabled && entry.end < entry.start;
              const emptyWindow = entry.enabled && entry.end === entry.start;
              return (
                <div
                  key={entry.day}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "9rem 5.5rem 8rem 8rem",
                    gap: 10,
                    alignItems: "center",
                  }}
                >
                  <label style={{ color: "#e2e8f0" }}>
                    <input
                      type="checkbox"
                      checked={entry.enabled}
                      onChange={(e) => updateDay(entry.day, { enabled: e.target.checked })}
                      style={{ marginRight: 8 }}
                    />
                    {DAY_NAMES[entry.day]}
                  </label>
                  <span style={{ color: "#94a3b8" }}>{entry.enabled ? "Open" : "Closed"}</span>
                  <input
                    className="admin-input"
                    type="time"
                    aria-label={`${DAY_NAMES[entry.day]} start`}
                    value={entry.start}
                    disabled={!entry.enabled}
                    onChange={(e) => updateDay(entry.day, { start: e.target.value })}
                  />
                  <input
                    className="admin-input"
                    type="time"
                    aria-label={`${DAY_NAMES[entry.day]} end`}
                    value={entry.end}
                    disabled={!entry.enabled}
                    onChange={(e) => updateDay(entry.day, { end: e.target.value })}
                  />
                  {overnight ? (
                    <span style={{ gridColumn: "1 / -1", color: "#94a3b8", fontSize: "0.85rem" }}>
                      Ends the next day.
                    </span>
                  ) : null}
                  {emptyWindow ? (
                    <span style={{ gridColumn: "1 / -1", color: "#fbbf24", fontSize: "0.85rem" }}>
                      Start and end match, so this day has no open slots.
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        <div className="admin-form-actions">
          <button type="submit" className="admin-btn admin-btn-primary" disabled={saving || week.length !== 7}>
            {saving ? "Saving…" : "Save schedule"}
          </button>
        </div>
      </form>
    </>
  );
}
