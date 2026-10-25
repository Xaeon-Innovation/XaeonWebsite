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
exports.deleteServiceRequest = exports.updateServiceRequest = exports.createServiceRequest = exports.getServiceRequestById = exports.getMyServiceRequests = exports.getServiceRequests = exports.createServiceRequestEnquiry = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
require("../types/expressAugment");
const package_model_1 = __importDefault(require("../models/package.model"));
const serviceRequest_model_1 = __importStar(require("../models/serviceRequest.model"));
const bookingSettings_model_1 = require("../models/bookingSettings.model");
const bookingEmail_1 = require("../services/bookingEmail");
const attribution_1 = require("../utils/attribution");
const leadEmails_1 = require("../services/leadEmails");
const googleCalendar_1 = require("../services/googleCalendar");
const serverError_1 = require("../utils/serverError");
async function emailEnquiryNotice(details) {
    // Staff notice and the visitor's auto-reply are independent: one failing never blocks the other.
    const results = await Promise.allSettled([
        (0, bookingEmail_1.sendEnquiryNotice)(details),
        (0, leadEmails_1.sendEnquiryAutoReply)({ name: details.name, email: details.email, locale: details.locale, topic: details.interest }),
    ]);
    for (const r of results)
        if (r.status === "rejected")
            console.error(r.reason);
}
/** Public: contact form, service page interest, or package enquiry — same collection, no login. */
const createServiceRequestEnquiry = async (req, res) => {
    try {
        const body = req.body?.serviceRequest;
        if (!body || typeof body !== "object") {
            res.status(400).json({ error: "serviceRequest payload is required" });
            return;
        }
        const source = body.source;
        if (!(0, serviceRequest_model_1.isEnquirySource)(source)) {
            res.status(400).json({
                error: "source must be contact, service, package, or product",
            });
            return;
        }
        const name = typeof body.name === "string" ? body.name.trim() : "";
        const phone = typeof body.phone === "string" ? body.phone.trim() : "";
        const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
        const message = typeof body.message === "string" ? body.message.trim() : "";
        if (!name || !phone || !email || !message) {
            res.status(400).json({ error: "name, phone, email, and message are required" });
            return;
        }
        const company = typeof body.company === "string" && body.company.trim() !== ""
            ? body.company.trim()
            : undefined;
        const attribution = (0, attribution_1.parseAttribution)(body.attribution);
        const locale = body.locale === "ar" ? "ar" : "en";
        if (source === "package") {
            const packageIdRaw = typeof body.packageId === "string" ? body.packageId.trim() : "";
            if (!packageIdRaw || !mongoose_1.default.Types.ObjectId.isValid(packageIdRaw)) {
                res.status(400).json({ error: "Valid packageId is required for package enquiries" });
                return;
            }
            const pkg = await package_model_1.default.findById(packageIdRaw);
            if (!pkg) {
                res.status(400).json({ error: "Package not found" });
                return;
            }
            const pkgTitle = pkg.title?.trim() || "Package";
            const newServiceRequest = await serviceRequest_model_1.default.create({
                source: "package",
                title: `Package: ${pkgTitle}`,
                description: message,
                contactName: name,
                contactEmail: email,
                contactPhone: phone,
                company,
                interest: pkgTitle,
                package: pkg._id,
                status: "Pending Review",
                attribution,
                locale,
            });
            await emailEnquiryNotice({
                source: "package",
                name,
                email,
                phone,
                company,
                message,
                interest: pkgTitle,
                attribution,
                locale,
            });
            res.status(201).json({
                message: "Request submitted successfully",
                id: String(newServiceRequest._id),
            });
            return;
        }
        const interest = typeof body.interest === "string" && body.interest.trim() !== ""
            ? body.interest.trim()
            : undefined;
        const title = source === "product"
            ? `Product demo: ${interest ?? "Product"}`
            : source === "service" && interest
                ? `Service interest: ${interest}`
                : source === "service"
                    ? "Service interest"
                    : "Contact enquiry";
        const newServiceRequest = await serviceRequest_model_1.default.create({
            source,
            title,
            description: message,
            contactName: name,
            contactEmail: email,
            contactPhone: phone,
            company,
            interest,
            status: "Pending Review",
            attribution,
            locale,
        });
        await emailEnquiryNotice({
            source,
            name,
            email,
            phone,
            company,
            message,
            interest,
            attribution,
            locale,
        });
        res.status(201).json({
            message: "Request submitted successfully",
            id: String(newServiceRequest._id),
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({
            error: (0, serverError_1.serverErrorMessage)(err, "Failed to create request"),
        });
    }
};
exports.createServiceRequestEnquiry = createServiceRequestEnquiry;
const getServiceRequests = async (req, res) => {
    try {
        const serviceRequests = await serviceRequest_model_1.default.find()
            .populate("package", "title discount")
            .sort({ createdAt: -1 });
        res.status(200).json({ serviceRequests });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({
            error: (0, serverError_1.serverErrorMessage)(err, "Failed to fetch service requests"),
        });
    }
};
exports.getServiceRequests = getServiceRequests;
/** Authenticated: current user's registered service requests only. */
const getMyServiceRequests = async (req, res) => {
    try {
        const u = req.user;
        if (!u) {
            res.status(401).json({ error: "Not authenticated" });
            return;
        }
        const serviceRequests = await serviceRequest_model_1.default.find({
            user: new mongoose_1.default.Types.ObjectId(u.id),
        })
            .populate("package", "title discount")
            .sort({ createdAt: -1 });
        res.status(200).json({ serviceRequests });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({
            error: (0, serverError_1.serverErrorMessage)(err, "Failed to fetch service requests"),
        });
    }
};
exports.getMyServiceRequests = getMyServiceRequests;
const getServiceRequestById = async (req, res) => {
    try {
        const serviceRequest = await serviceRequest_model_1.default.findById(req.params.id).populate("package", "title discount");
        if (!serviceRequest) {
            res.status(404).json({ error: "Service request not found" });
            return;
        }
        res.status(200).json({ serviceRequest });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({
            error: (0, serverError_1.serverErrorMessage)(err, "Failed to fetch service request"),
        });
    }
};
exports.getServiceRequestById = getServiceRequestById;
/**
 * Authenticated: registered service request.
 * - **Customers** (`role: user`): `user` and `source` are set from the session; body supplies
 *   `description`, `meeting_date`, optional `packageId`, optional `interest` (service line), optional `contactPhone`.
 * - **Admins**: may send a full `serviceRequest` object as before (on behalf of another user).
 */
const createServiceRequest = async (req, res) => {
    try {
        const payload = req.body?.serviceRequest;
        if (!payload || typeof payload !== "object") {
            res.status(400).json({ error: "serviceRequest payload is required" });
            return;
        }
        if ((0, serviceRequest_model_1.isEnquirySource)(payload.source)) {
            res.status(400).json({ error: "Use POST /system-request/enquiry for public enquiries" });
            return;
        }
        const u = req.user;
        if (!u) {
            res.status(401).json({ error: "Not authenticated" });
            return;
        }
        if (u.role === "user") {
            const description = typeof payload.description === "string" ? payload.description.trim() : "";
            if (!description) {
                res.status(400).json({ error: "description is required" });
                return;
            }
            const meetingRaw = payload.meeting_date;
            if (meetingRaw === undefined || meetingRaw === null || meetingRaw === "") {
                res.status(400).json({ error: "meeting_date is required" });
                return;
            }
            const meetingDate = new Date(String(meetingRaw));
            if (Number.isNaN(meetingDate.getTime())) {
                res.status(400).json({ error: "Invalid meeting_date" });
                return;
            }
            const packageIdRaw = typeof payload.packageId === "string" ? payload.packageId.trim() : "";
            const interestRaw = typeof payload.interest === "string" ? payload.interest.trim() : "";
            const contactPhone = typeof payload.contactPhone === "string" && payload.contactPhone.trim() !== ""
                ? payload.contactPhone.trim()
                : undefined;
            let packageRef;
            let interest;
            let title;
            if (packageIdRaw) {
                if (!mongoose_1.default.Types.ObjectId.isValid(packageIdRaw)) {
                    res.status(400).json({ error: "Invalid packageId" });
                    return;
                }
                const pkg = await package_model_1.default.findById(packageIdRaw);
                if (!pkg) {
                    res.status(400).json({ error: "Package not found" });
                    return;
                }
                packageRef = pkg._id;
                const pkgTitle = pkg.title?.trim() || "Package";
                interest = pkgTitle;
                title = `Package: ${pkgTitle}`;
            }
            else if (interestRaw) {
                interest = interestRaw;
                title = `Service interest: ${interestRaw}`;
            }
            else {
                title = "Service request";
            }
            const newServiceRequest = await serviceRequest_model_1.default.create({
                source: "registered",
                user: new mongoose_1.default.Types.ObjectId(u.id),
                meeting_date: meetingDate,
                description,
                title,
                interest,
                package: packageRef,
                status: "Pending Review",
                contactName: u.name,
                contactEmail: u.email,
                contactPhone,
                attribution: (0, attribution_1.parseAttribution)(payload.attribution),
            });
            res.status(201).json({
                message: "New Service Request Created Successfully",
                serviceRequest: newServiceRequest,
            });
            return;
        }
        const doc = { ...payload, source: "registered" };
        const newServiceRequest = await serviceRequest_model_1.default.create(doc);
        res.status(200).json({
            message: "New Service Request Created Successfully",
            serviceRequest: newServiceRequest,
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({
            error: (0, serverError_1.serverErrorMessage)(err, "Failed to create service request"),
        });
    }
};
exports.createServiceRequest = createServiceRequest;
const updateServiceRequest = async (req, res) => {
    try {
        const body = req.body?.serviceRequest;
        if (!body || typeof body !== "object") {
            res.status(400).json({ error: "serviceRequest payload is required" });
            return;
        }
        const id = body.id;
        if (!id) {
            res.status(400).json({ error: "Service request id is required" });
            return;
        }
        const existing = await serviceRequest_model_1.default.findById(id);
        if (!existing) {
            res.status(404).json({ error: "Service request not found" });
            return;
        }
        const { meeting_date, interest, status } = body;
        // Whitelist: CRM fields (stage, owner, notes…) change only through /lead so they're logged.
        const $set = {};
        const $unset = {};
        if (status !== undefined) {
            if (status !== "Pending Review" && status !== "Accepted" && status !== "Rejected") {
                res.status(400).json({ error: "Invalid status" });
                return;
            }
            $set.status = status;
        }
        if (Object.prototype.hasOwnProperty.call(body, "interest")) {
            if (interest === null || interest === "") {
                $unset.interest = 1;
            }
            else if (interest !== undefined) {
                $set.interest = interest;
            }
        }
        if (Object.prototype.hasOwnProperty.call(body, "meeting_date")) {
            if (meeting_date === null || meeting_date === "") {
                if ((0, serviceRequest_model_1.isEnquirySource)(existing.source)) {
                    $unset.meeting_date = 1;
                }
            }
            else if (meeting_date !== undefined) {
                $set.meeting_date = meeting_date;
            }
        }
        const mongoUpdate = {};
        if (Object.keys($set).length)
            mongoUpdate.$set = $set;
        if (Object.keys($unset).length)
            mongoUpdate.$unset = $unset;
        if ($set.status && $set.status !== existing.status) {
            mongoUpdate.$push = {
                activity: {
                    type: "status",
                    message: `Request status: ${existing.status} → ${String($set.status)}`,
                    by: req.user ? new mongoose_1.default.Types.ObjectId(req.user.id) : undefined,
                    byName: req.user?.name || req.user?.email || "Admin",
                    at: new Date(),
                },
            };
        }
        if (!mongoUpdate.$set && !mongoUpdate.$unset) {
            res.status(400).json({ error: "No updatable fields provided" });
            return;
        }
        const updatedServiceRequest = await serviceRequest_model_1.default.findByIdAndUpdate(id, mongoUpdate, { new: true, runValidators: true });
        if (!updatedServiceRequest) {
            res.status(404).json({ error: "Service request not found" });
            return;
        }
        const rejectedBooking = existing.source === "booking" &&
            existing.status !== "Rejected" &&
            updatedServiceRequest.status === "Rejected" &&
            existing.googleEventId;
        if (rejectedBooking && existing.googleEventId) {
            try {
                const settings = await (0, bookingSettings_model_1.getBookingSettings)();
                await (0, googleCalendar_1.deleteMeetEvent)(settings.googleRefreshToken, existing.googleEventId);
            }
            catch (cancelErr) {
                console.error(cancelErr);
            }
        }
        res.status(200).json({
            message: "Service Request Data Updated Successfully",
            serviceRequest: updatedServiceRequest,
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({
            error: (0, serverError_1.serverErrorMessage)(err, "Failed to update service request"),
        });
    }
};
exports.updateServiceRequest = updateServiceRequest;
const deleteServiceRequest = async (req, res) => {
    try {
        const existing = await serviceRequest_model_1.default.findById(req.params.id);
        if (!existing) {
            res.status(404).json({ error: "Service request not found" });
            return;
        }
        if (existing.source === "booking" && existing.googleEventId) {
            try {
                const settings = await (0, bookingSettings_model_1.getBookingSettings)();
                await (0, googleCalendar_1.deleteMeetEvent)(settings.googleRefreshToken, existing.googleEventId);
            }
            catch (cancelErr) {
                console.error(cancelErr);
            }
        }
        const result = await serviceRequest_model_1.default.deleteOne({ _id: existing._id });
        if (result.deletedCount === 0) {
            res.status(404).json({ error: "Service request not found" });
            return;
        }
        res.status(200).json({ message: "Service Request Deleted Successfully" });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({
            error: (0, serverError_1.serverErrorMessage)(err, "Failed to delete service request"),
        });
    }
};
exports.deleteServiceRequest = deleteServiceRequest;
