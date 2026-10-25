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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLeadStats = exports.exportLeadsCsv = exports.convertLead = exports.emailLead = exports.addLeadNote = exports.bulkUpdateLeads = exports.updateLead = exports.getLead = exports.listLeads = exports.STAGE_LABELS = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
require("../types/expressAugment");
const serviceRequest_model_1 = __importStar(require("../models/serviceRequest.model"));
const employee_model_1 = __importDefault(require("../models/employee.model"));
const project_model_1 = __importDefault(require("../models/project.model"));
const projectType_model_1 = __importDefault(require("../models/projectType.model"));
const user_model_1 = __importDefault(require("../models/user.model"));
const email_1 = require("../services/email");
const invite_1 = require("../services/invite");
const attribution_1 = require("../utils/attribution");
const leadStats_1 = require("../utils/leadStats");
const serverError_1 = require("../utils/serverError");
/* ------------------------------------------------------------------ helpers */
exports.STAGE_LABELS = {
    new: "New",
    contacted: "Contacted",
    qualified: "Qualified",
    proposal: "Proposal",
    won: "Won",
    lost: "Lost",
};
/**
 * CRM edits validate only the fields they change: older requests may predate today's schema
 * rules (e.g. a booking without meeting_date) and must still be manageable.
 */
const SAVE_OPTS = { validateModifiedOnly: true };
const isId = (v) => typeof v === "string" && mongoose_1.default.Types.ObjectId.isValid(v);
function actor(req) {
    return {
        by: req.user ? new mongoose_1.default.Types.ObjectId(req.user.id) : undefined,
        byName: req.user?.name || req.user?.email || "Admin",
    };
}
function log(lead, type, message, who) {
    lead.activity.push({ type, message, by: who.by, byName: who.byName, at: new Date() });
}
function markResponded(lead) {
    if (!lead.firstResponseAt)
        lead.firstResponseAt = new Date();
}
function escapeRegex(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function formatDate(d) {
    return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Cairo" }).format(d);
}
/** Builds a Mongo filter from list/export query params. Unknown values are ignored. */
function buildFilter(query) {
    const filter = {};
    const str = (k) => (typeof query[k] === "string" ? query[k].trim() : "");
    const stages = str("stage").split(",").filter(serviceRequest_model_1.isLeadStage);
    if (stages.length)
        filter.stage = { $in: stages };
    const sources = str("source").split(",").filter(Boolean).slice(0, 10);
    if (sources.length)
        filter.source = { $in: sources };
    const owner = str("owner");
    if (owner === "none")
        filter.owner = { $exists: false };
    else if (owner === "any")
        filter.owner = { $exists: true };
    else if (isId(owner))
        filter.owner = new mongoose_1.default.Types.ObjectId(owner);
    const from = str("from") ? new Date(str("from")) : null;
    const to = str("to") ? new Date(str("to")) : null;
    if ((from && !Number.isNaN(from.getTime())) || (to && !Number.isNaN(to.getTime()))) {
        filter.createdAt = {
            ...(from && !Number.isNaN(from.getTime()) ? { $gte: from } : {}),
            ...(to && !Number.isNaN(to.getTime()) ? { $lte: to } : {}),
        };
    }
    const followUp = str("followUp");
    const now = new Date();
    if (followUp === "overdue") {
        filter.followUpAt = { $lt: now };
        filter.stage = filter.stage ?? { $in: serviceRequest_model_1.OPEN_STAGES };
    }
    else if (followUp === "week") {
        filter.followUpAt = { $gte: now, $lte: new Date(now.getTime() + 7 * 86400000) };
    }
    else if (followUp === "none") {
        filter.followUpAt = null;
    }
    const q = str("q").slice(0, 100);
    if (q) {
        const rx = new RegExp(escapeRegex(q), "i");
        filter.$or = [
            { contactName: rx },
            { contactEmail: rx },
            { contactPhone: rx },
            { company: rx },
            { title: rx },
            { interest: rx },
        ];
    }
    return filter;
}
const SORTABLE = new Set(["createdAt", "followUpAt", "value", "stage", "updatedAt"]);
function buildSort(raw) {
    const s = typeof raw === "string" ? raw : "-createdAt";
    const desc = s.startsWith("-");
    const field = desc ? s.slice(1) : s;
    return SORTABLE.has(field) ? { [field]: desc ? -1 : 1, _id: -1 } : { createdAt: -1, _id: -1 };
}
const LIST_FIELDS = "title description source status stage owner followUpAt value currency lostReason contactName contactEmail contactPhone company interest package meeting_date meetLink attribution firstResponseAt project createdAt updatedAt locale";
/* ------------------------------------------------------------------ handlers */
/** GET /lead — filtered, sorted, paginated list (no notes/history, for speed). */
const listLeads = async (req, res) => {
    try {
        const filter = buildFilter(req.query);
        const limit = Math.min(500, Math.max(1, Number(req.query.limit) || 25));
        const page = Math.max(1, Number(req.query.page) || 1);
        const [leads, total] = await Promise.all([
            serviceRequest_model_1.default.find(filter)
                .select(LIST_FIELDS)
                .sort(buildSort(req.query.sort))
                .skip((page - 1) * limit)
                .limit(limit)
                .populate("owner", "name")
                .populate("package", "title")
                .lean(),
            serviceRequest_model_1.default.countDocuments(filter),
        ]);
        res.status(200).json({
            leads: leads.map((l) => ({ ...l, channel: (0, attribution_1.attributionChannel)(l.attribution ?? undefined), tracked: Boolean(l.attribution) })),
            total,
            page,
            pages: Math.max(1, Math.ceil(total / limit)),
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: (0, serverError_1.serverErrorMessage)(err, "Failed to fetch leads") });
    }
};
exports.listLeads = listLeads;
/** GET /lead/:id — full lead with notes, history and earlier leads from the same person. */
const getLead = async (req, res) => {
    try {
        if (!isId(req.params.id)) {
            res.status(400).json({ error: "Invalid lead id" });
            return;
        }
        const lead = await serviceRequest_model_1.default.findById(req.params.id)
            .populate("owner", "name email")
            .populate("package", "title")
            .populate("project", "title")
            .populate("user", "name email")
            .lean();
        if (!lead) {
            res.status(404).json({ error: "Lead not found" });
            return;
        }
        const related = lead.contactKey
            ? await serviceRequest_model_1.default.find({ contactKey: lead.contactKey, _id: { $ne: lead._id } })
                .select("title stage source createdAt")
                .sort({ createdAt: -1 })
                .limit(20)
                .lean()
            : [];
        res.status(200).json({
            lead: { ...lead, channel: (0, attribution_1.attributionChannel)(lead.attribution ?? undefined), tracked: Boolean(lead.attribution) },
            related,
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: (0, serverError_1.serverErrorMessage)(err, "Failed to fetch lead") });
    }
};
exports.getLead = getLead;
/** Applies whitelisted CRM changes to a lead and records each one in its history. */
async function applyChanges(lead, body, who) {
    if (body.stage !== undefined) {
        if (!(0, serviceRequest_model_1.isLeadStage)(body.stage))
            return "Invalid stage";
        if (body.stage !== lead.stage) {
            log(lead, "stage", `Stage: ${exports.STAGE_LABELS[lead.stage ?? "new"]} → ${exports.STAGE_LABELS[body.stage]}`, who);
            if (body.stage !== "new")
                markResponded(lead);
            lead.stage = body.stage;
            // Closed leads don't need chasing.
            if ((body.stage === "won" || body.stage === "lost") && lead.followUpAt)
                lead.followUpAt = null;
        }
    }
    if (body.lostReason !== undefined) {
        const reason = typeof body.lostReason === "string" ? body.lostReason.trim().slice(0, 300) : "";
        if (reason !== (lead.lostReason ?? "")) {
            lead.lostReason = reason || undefined;
            if (reason)
                log(lead, "stage", `Lost reason: ${reason}`, who);
        }
    }
    if (body.ownerId !== undefined) {
        if (body.ownerId === null || body.ownerId === "") {
            if (lead.owner) {
                lead.owner = undefined;
                log(lead, "owner", "Unassigned", who);
            }
        }
        else {
            if (!isId(body.ownerId))
                return "Invalid owner";
            const emp = await employee_model_1.default.findById(body.ownerId).select("name");
            if (!emp)
                return "Owner not found";
            if (String(lead.owner ?? "") !== String(emp._id)) {
                lead.owner = emp._id;
                log(lead, "owner", `Assigned to ${emp.name}`, who);
            }
        }
    }
    if (body.followUpAt !== undefined) {
        if (body.followUpAt === null || body.followUpAt === "") {
            if (lead.followUpAt) {
                lead.followUpAt = null;
                log(lead, "followup", "Follow-up cleared", who);
            }
        }
        else {
            const d = new Date(String(body.followUpAt));
            if (Number.isNaN(d.getTime()))
                return "Invalid follow-up date";
            if (!lead.followUpAt || lead.followUpAt.getTime() !== d.getTime()) {
                lead.followUpAt = d;
                log(lead, "followup", `Follow-up set for ${formatDate(d)}`, who);
            }
        }
    }
    if (body.currency !== undefined) {
        if (!serviceRequest_model_1.LEAD_CURRENCIES.includes(body.currency))
            return "Invalid currency";
        lead.currency = body.currency;
    }
    if (body.value !== undefined) {
        const v = body.value === null || body.value === "" ? null : Number(body.value);
        if (v !== null && (!Number.isFinite(v) || v < 0))
            return "Invalid value";
        if ((lead.value ?? null) !== v) {
            lead.value = v;
            log(lead, "value", v === null ? "Deal value cleared" : `Deal value: ${v.toLocaleString("en-US")} ${lead.currency}`, who);
        }
    }
    return null;
}
/** PATCH /lead/:id — stage, owner, follow-up, value. */
const updateLead = async (req, res) => {
    try {
        if (!isId(req.params.id)) {
            res.status(400).json({ error: "Invalid lead id" });
            return;
        }
        const lead = await serviceRequest_model_1.default.findById(req.params.id);
        if (!lead) {
            res.status(404).json({ error: "Lead not found" });
            return;
        }
        const error = await applyChanges(lead, (req.body ?? {}), actor(req));
        if (error) {
            res.status(400).json({ error });
            return;
        }
        await lead.save(SAVE_OPTS);
        res.status(200).json({ message: "Lead updated" });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: (0, serverError_1.serverErrorMessage)(err, "Failed to update lead") });
    }
};
exports.updateLead = updateLead;
/** POST /lead/bulk — { ids, stage?, ownerId? } for up to 200 leads. */
const bulkUpdateLeads = async (req, res) => {
    try {
        const body = (req.body ?? {});
        const ids = Array.isArray(body.ids) ? body.ids.filter(isId).slice(0, 200) : [];
        if (!ids.length || (body.stage === undefined && body.ownerId === undefined)) {
            res.status(400).json({ error: "ids and a stage or owner are required" });
            return;
        }
        const who = actor(req);
        const leads = await serviceRequest_model_1.default.find({ _id: { $in: ids } });
        for (const lead of leads) {
            const error = await applyChanges(lead, { stage: body.stage, ownerId: body.ownerId }, who);
            if (error) {
                res.status(400).json({ error });
                return;
            }
        }
        await Promise.all(leads.map((l) => l.save(SAVE_OPTS)));
        res.status(200).json({ message: `Updated ${leads.length} leads`, updated: leads.length });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: (0, serverError_1.serverErrorMessage)(err, "Failed to update leads") });
    }
};
exports.bulkUpdateLeads = bulkUpdateLeads;
/** POST /lead/:id/notes — internal note (never sent to the client). */
const addLeadNote = async (req, res) => {
    try {
        const text = typeof req.body?.text === "string" ? req.body.text.trim() : "";
        if (!text || text.length > 5000) {
            res.status(400).json({ error: "Write a note (up to 5000 characters)" });
            return;
        }
        if (!isId(req.params.id)) {
            res.status(400).json({ error: "Invalid lead id" });
            return;
        }
        const lead = await serviceRequest_model_1.default.findById(req.params.id);
        if (!lead) {
            res.status(404).json({ error: "Lead not found" });
            return;
        }
        const who = actor(req);
        lead.notes.push({ text, by: who.by, byName: who.byName, at: new Date() });
        log(lead, "note", text.length > 140 ? `${text.slice(0, 140)}…` : text, who);
        await lead.save(SAVE_OPTS);
        res.status(201).json({ message: "Note added" });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: (0, serverError_1.serverErrorMessage)(err, "Failed to add note") });
    }
};
exports.addLeadNote = addLeadNote;
/** POST /lead/:id/email — reply to the lead from the admin (sent via Resend, logged). */
const emailLead = async (req, res) => {
    try {
        const subject = typeof req.body?.subject === "string" ? req.body.subject.trim() : "";
        const body = typeof req.body?.body === "string" ? req.body.body.trim() : "";
        if (!subject || subject.length > 200 || body.length < 2 || body.length > 20000) {
            res.status(400).json({ error: "Add a subject and a message" });
            return;
        }
        if (!isId(req.params.id)) {
            res.status(400).json({ error: "Invalid lead id" });
            return;
        }
        const lead = await serviceRequest_model_1.default.findById(req.params.id);
        if (!lead) {
            res.status(404).json({ error: "Lead not found" });
            return;
        }
        if (!lead.contactEmail) {
            res.status(400).json({ error: "This lead has no email address" });
            return;
        }
        await (0, email_1.sendEmail)({
            to: lead.contactEmail,
            subject,
            replyTo: (0, email_1.replyToAddress)(),
            html: (0, email_1.emailLayout)((0, email_1.textToHtml)(body), lead.locale === "ar" ? "rtl" : "ltr"),
        });
        const who = actor(req);
        log(lead, "email", `Email sent: “${subject}”`, who);
        markResponded(lead);
        if (lead.stage === "new") {
            log(lead, "stage", `Stage: ${exports.STAGE_LABELS.new} → ${exports.STAGE_LABELS.contacted}`, who);
            lead.stage = "contacted";
        }
        await lead.save(SAVE_OPTS);
        res.status(200).json({ message: `Email sent to ${lead.contactEmail}` });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: (0, serverError_1.serverErrorMessage)(err, "Failed to send email") });
    }
};
exports.emailLead = emailLead;
/**
 * POST /lead/:id/convert — create a client project from a lead. Uses the client's existing
 * account (matched by email) or creates one and emails them an invite to set a password.
 */
const convertLead = async (req, res) => {
    try {
        const b = (req.body ?? {});
        const title = typeof b.title === "string" ? b.title.trim() : "";
        const deadline = typeof b.deadline === "string" ? new Date(b.deadline) : null;
        if (!title || !isId(b.projectTypeId) || !isId(b.managerId) || !deadline || Number.isNaN(deadline.getTime())) {
            res.status(400).json({ error: "Title, project type, manager and deadline are required" });
            return;
        }
        if (!isId(req.params.id)) {
            res.status(400).json({ error: "Invalid lead id" });
            return;
        }
        const lead = await serviceRequest_model_1.default.findById(req.params.id);
        if (!lead) {
            res.status(404).json({ error: "Lead not found" });
            return;
        }
        if (lead.project) {
            res.status(409).json({ error: "This lead already has a project" });
            return;
        }
        const [type, manager] = await Promise.all([projectType_model_1.default.findById(b.projectTypeId), employee_model_1.default.findById(b.managerId).select("name")]);
        if (!type || !manager) {
            res.status(400).json({ error: "Project type or manager not found" });
            return;
        }
        let user = lead.user ? await user_model_1.default.findById(lead.user) : null;
        if (!user && lead.contactKey)
            user = await user_model_1.default.findOne({ email: lead.contactKey });
        let userCreated = false;
        let inviteSent = false;
        if (!user) {
            if (!lead.contactKey) {
                res.status(400).json({ error: "This lead has no email address to create a client account" });
                return;
            }
            const name = (lead.contactName || lead.contactKey.split("@")[0]).trim();
            const [first, ...rest] = name.split(/\s+/);
            user = await user_model_1.default.create({
                email: lead.contactKey,
                password: await (0, invite_1.placeholderPasswordHash)(),
                first_name: first || name,
                last_name: rest.join(" ") || "-",
                name,
                company: lead.company ?? "",
                phone_number: lead.contactPhone || "-",
                role: "user",
            });
            userCreated = true;
            try {
                await (0, invite_1.sendInviteEmail)(user, await (0, invite_1.issueInvite)(String(user._id)));
                inviteSent = true;
            }
            catch (inviteErr) {
                console.error("Invite email failed:", inviteErr);
            }
        }
        const project = await project_model_1.default.create({
            title,
            description: lead.description ?? "",
            project_type: type._id,
            project_manager: manager._id,
            user: user._id,
            deadline,
        });
        const who = actor(req);
        lead.project = project._id;
        if (!lead.user)
            lead.user = user._id;
        if (lead.stage !== "won") {
            log(lead, "stage", `Stage: ${exports.STAGE_LABELS[lead.stage]} → ${exports.STAGE_LABELS.won}`, who);
            lead.stage = "won";
            lead.followUpAt = null;
        }
        markResponded(lead);
        log(lead, "converted", `Converted to project “${title}” (manager: ${manager.name})${userCreated ? `; client account created${inviteSent ? " and invite emailed" : ", invite email failed"}` : ""}`, who);
        await lead.save(SAVE_OPTS);
        res.status(201).json({ message: "Project created", projectId: String(project._id), userCreated, inviteSent });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: (0, serverError_1.serverErrorMessage)(err, "Failed to convert lead") });
    }
};
exports.convertLead = convertLead;
function csvCell(value) {
    const s = value === null || value === undefined ? "" : String(value);
    // Neutralise spreadsheet formulas, then quote.
    const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
    return `"${safe.replace(/"/g, '""')}"`;
}
/** GET /lead/export.csv — same filters as the list, up to 5000 rows. */
const exportLeadsCsv = async (req, res) => {
    try {
        const leads = await serviceRequest_model_1.default.find(buildFilter(req.query))
            .select(LIST_FIELDS)
            .sort(buildSort(req.query.sort))
            .limit(5000)
            .populate("owner", "name")
            .populate("package", "title")
            .lean();
        const header = [
            "Created", "Name", "Email", "Phone", "Company", "Source", "Channel", "Campaign", "Landing page",
            "Title", "Interest", "Package", "Stage", "Owner", "Follow-up", "Value", "Currency", "Lost reason", "Request status",
        ];
        const rows = leads.map((l) => {
            const owner = l.owner;
            const pkg = l.package;
            return [
                l.createdAt ? new Date(l.createdAt).toISOString() : "",
                l.contactName, l.contactEmail, l.contactPhone, l.company, l.source,
                l.attribution ? (0, attribution_1.attributionChannel)(l.attribution) : "Not tracked",
                l.attribution?.utmCampaign, l.attribution?.landingPage,
                l.title, l.interest, pkg?.title, exports.STAGE_LABELS[(l.stage ?? "new")], owner?.name,
                l.followUpAt ? new Date(l.followUpAt).toISOString() : "", l.value ?? "", l.currency, l.lostReason, l.status,
            ].map(csvCell).join(",");
        });
        const stamp = new Date().toISOString().slice(0, 10);
        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader("Content-Disposition", `attachment; filename="xaeon-leads-${stamp}.csv"`);
        // BOM so Excel opens UTF-8 (Arabic names) correctly.
        res.status(200).send(`﻿${[header.map(csvCell).join(","), ...rows].join("\r\n")}`);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: (0, serverError_1.serverErrorMessage)(err, "Failed to export leads") });
    }
};
exports.exportLeadsCsv = exportLeadsCsv;
/** GET /lead/stats?days=90 — pipeline and acquisition numbers for the dashboard. */
const getLeadStats = async (req, res) => {
    try {
        const days = Math.min(365, Math.max(7, Number(req.query.days) || 90));
        res.status(200).json(await (0, leadStats_1.computeLeadStats)(days));
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: (0, serverError_1.serverErrorMessage)(err, "Failed to compute lead stats") });
    }
};
exports.getLeadStats = getLeadStats;
