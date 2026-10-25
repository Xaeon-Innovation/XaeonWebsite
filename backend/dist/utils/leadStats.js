"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeLeadStats = computeLeadStats;
const serviceRequest_model_1 = __importStar(require("../models/serviceRequest.model"));
const attribution_1 = require("./attribution");
function median(values) {
    if (!values.length)
        return null;
    const s = [...values].sort((a, b) => a - b);
    const mid = Math.floor(s.length / 2);
    return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}
function weekStart(d) {
    // Cairo calendar date, then back to Monday.
    const ymd = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Cairo", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
    const [y, m, day] = ymd.split("-").map(Number);
    const utc = new Date(Date.UTC(y, m - 1, day));
    utc.setUTCDate(utc.getUTCDate() - ((utc.getUTCDay() + 6) % 7));
    return utc.toISOString().slice(0, 10);
}
function addTo(map, key, amount) {
    map[key] = (map[key] ?? 0) + amount;
}
async function computeLeadStats(days) {
    const now = new Date();
    const since = new Date(now.getTime() - days * 86400000);
    const [rows, openWithValue, overdueFollowUps, unassignedOpen] = await Promise.all([
        serviceRequest_model_1.default.find({ createdAt: { $gte: since } })
            .select("createdAt stage source value currency firstResponseAt attribution")
            .lean(),
        serviceRequest_model_1.default.find({ stage: { $in: serviceRequest_model_1.OPEN_STAGES }, value: { $gt: 0 } }).select("value currency").lean(),
        serviceRequest_model_1.default.countDocuments({ stage: { $in: serviceRequest_model_1.OPEN_STAGES }, followUpAt: { $lt: now } }),
        serviceRequest_model_1.default.countDocuments({ stage: { $in: serviceRequest_model_1.OPEN_STAGES }, owner: { $exists: false } }),
    ]);
    const byStage = Object.fromEntries(serviceRequest_model_1.LEAD_STAGES.map((s) => [s, 0]));
    const channels = new Map();
    const sources = new Map();
    const weekly = new Map();
    const wonValue = {};
    const responseHours = [];
    let within24 = 0;
    for (const r of rows) {
        const stage = r.stage ?? "new";
        const won = stage === "won" ? 1 : 0;
        byStage[stage] += 1;
        const channel = r.attribution ? (0, attribution_1.attributionChannel)(r.attribution) : "Not tracked";
        const c = channels.get(channel) ?? { channel, leads: 0, won: 0 };
        c.leads += 1;
        c.won += won;
        channels.set(channel, c);
        const s = sources.get(r.source) ?? { source: r.source, leads: 0, won: 0 };
        s.leads += 1;
        s.won += won;
        sources.set(r.source, s);
        const wk = weekStart(new Date(r.createdAt));
        const w = weekly.get(wk) ?? { weekStart: wk, leads: 0, won: 0 };
        w.leads += 1;
        w.won += won;
        weekly.set(wk, w);
        if (won && r.value)
            addTo(wonValue, r.currency ?? "EGP", r.value);
        if (r.firstResponseAt) {
            const hours = (new Date(r.firstResponseAt).getTime() - new Date(r.createdAt).getTime()) / 3600000;
            if (hours >= 0) {
                responseHours.push(hours);
                if (hours <= 24)
                    within24 += 1;
            }
        }
    }
    // Fill empty weeks so the chart has an honest, continuous x-axis.
    const filled = [];
    for (let d = new Date(`${weekStart(since)}T00:00:00Z`); d <= now; d.setUTCDate(d.getUTCDate() + 7)) {
        const key = d.toISOString().slice(0, 10);
        filled.push(weekly.get(key) ?? { weekStart: key, leads: 0, won: 0 });
    }
    const pipelineValue = {};
    for (const r of openWithValue)
        addTo(pipelineValue, r.currency ?? "EGP", r.value ?? 0);
    const closed = byStage.won + byStage.lost;
    const medianHours = median(responseHours);
    return {
        days,
        since: since.toISOString(),
        total: rows.length,
        byStage,
        winRate: closed ? byStage.won / closed : null,
        pipelineValue,
        wonValue,
        medianFirstResponseHours: medianHours === null ? null : Math.round(medianHours * 10) / 10,
        respondedWithin24h: rows.length ? within24 / rows.length : null,
        overdueFollowUps,
        unassignedOpen,
        channels: [...channels.values()].sort((a, b) => b.leads - a.leads),
        sources: [...sources.values()].sort((a, b) => b.leads - a.leads),
        weekly: filled,
    };
}
