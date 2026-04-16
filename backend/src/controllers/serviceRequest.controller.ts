import type { Request, Response } from "express";
import mongoose from "mongoose";
import "../types/expressAugment";
import Package from "../models/package.model";
import ServiceRequest, {
  type IServiceRequest,
} from "../models/serviceRequest.model";

/** Public: contact form, service page interest, or package enquiry — same collection, no login. */
export const createServiceRequestEnquiry = async (req: Request, res: Response) => {
  try {
    const body = req.body?.serviceRequest as Record<string, unknown> | undefined;
    if (!body || typeof body !== "object") {
      res.status(400).json({ error: "serviceRequest payload is required" });
      return;
    }

    const source = body.source;
    if (
      source !== "contact" &&
      source !== "service" &&
      source !== "package"
    ) {
      res.status(400).json({
        error: "source must be contact, service, or package",
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

    const company =
      typeof body.company === "string" && body.company.trim() !== ""
        ? body.company.trim()
        : undefined;

    if (source === "package") {
      const packageIdRaw =
        typeof body.packageId === "string" ? body.packageId.trim() : "";
      if (!packageIdRaw || !mongoose.Types.ObjectId.isValid(packageIdRaw)) {
        res.status(400).json({ error: "Valid packageId is required for package enquiries" });
        return;
      }
      const pkg = await Package.findById(packageIdRaw);
      if (!pkg) {
        res.status(400).json({ error: "Package not found" });
        return;
      }
      const pkgTitle = pkg.title?.trim() || "Package";
      const newServiceRequest = await ServiceRequest.create({
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
      });
      res.status(201).json({
        message: "Request submitted successfully",
        serviceRequest: newServiceRequest,
      });
      return;
    }

    const interest =
      typeof body.interest === "string" && body.interest.trim() !== ""
        ? body.interest.trim()
        : undefined;

    const title =
      source === "service" && interest
        ? `Service interest: ${interest}`
        : source === "service"
          ? "Service interest"
          : "Contact enquiry";

    const newServiceRequest = await ServiceRequest.create({
      source,
      title,
      description: message,
      contactName: name,
      contactEmail: email,
      contactPhone: phone,
      company,
      interest,
      status: "Pending Review",
    });

    res.status(201).json({
      message: "Request submitted successfully",
      serviceRequest: newServiceRequest,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Failed to create request",
    });
  }
};

export const getServiceRequests = async (req: Request, res: Response) => {
  try {
    const serviceRequests = await ServiceRequest.find()
      .populate("package", "title discount")
      .sort({ createdAt: -1 });
    res.status(200).json({ serviceRequests });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Failed to fetch service requests",
    });
  }
};

/** Authenticated: current user's registered service requests only. */
export const getMyServiceRequests = async (req: Request, res: Response) => {
  try {
    const u = req.user;
    if (!u) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }
    const serviceRequests = await ServiceRequest.find({
      user: new mongoose.Types.ObjectId(u.id),
    })
      .populate("package", "title discount")
      .sort({ createdAt: -1 });
    res.status(200).json({ serviceRequests });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Failed to fetch service requests",
    });
  }
};

export const getServiceRequestById = async (req: Request, res: Response) => {
  try {
    const serviceRequest = await ServiceRequest.findById(req.params.id).populate(
      "package",
      "title discount",
    );
    if (!serviceRequest) {
      res.status(404).json({ error: "Service request not found" });
      return;
    }
    res.status(200).json({ serviceRequest });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Failed to fetch service request",
    });
  }
};

/**
 * Authenticated: registered service request.
 * - **Customers** (`role: user`): `user` and `source` are set from the session; body supplies
 *   `description`, `meeting_date`, optional `packageId`, optional `interest` (service line), optional `contactPhone`.
 * - **Admins**: may send a full `serviceRequest` object as before (on behalf of another user).
 */
export const createServiceRequest = async (req: Request, res: Response) => {
  try {
    const payload = req.body?.serviceRequest as Record<string, unknown> | undefined;
    if (!payload || typeof payload !== "object") {
      res.status(400).json({ error: "serviceRequest payload is required" });
      return;
    }

    if (
      payload.source === "contact" ||
      payload.source === "service" ||
      payload.source === "package"
    ) {
      res.status(400).json({ error: "Use POST /system-request/enquiry for public enquiries" });
      return;
    }

    const u = req.user;
    if (!u) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    if (u.role === "user") {
      const description =
        typeof payload.description === "string" ? payload.description.trim() : "";
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

      const packageIdRaw =
        typeof payload.packageId === "string" ? payload.packageId.trim() : "";
      const interestRaw =
        typeof payload.interest === "string" ? payload.interest.trim() : "";
      const contactPhone =
        typeof payload.contactPhone === "string" && payload.contactPhone.trim() !== ""
          ? payload.contactPhone.trim()
          : undefined;

      let packageRef: mongoose.Types.ObjectId | undefined;
      let interest: string | undefined;
      let title: string;

      if (packageIdRaw) {
        if (!mongoose.Types.ObjectId.isValid(packageIdRaw)) {
          res.status(400).json({ error: "Invalid packageId" });
          return;
        }
        const pkg = await Package.findById(packageIdRaw);
        if (!pkg) {
          res.status(400).json({ error: "Package not found" });
          return;
        }
        packageRef = pkg._id as mongoose.Types.ObjectId;
        const pkgTitle = pkg.title?.trim() || "Package";
        interest = pkgTitle;
        title = `Package: ${pkgTitle}`;
      } else if (interestRaw) {
        interest = interestRaw;
        title = `Service interest: ${interestRaw}`;
      } else {
        title = "Service request";
      }

      const newServiceRequest = await ServiceRequest.create({
        source: "registered",
        user: new mongoose.Types.ObjectId(u.id),
        meeting_date: meetingDate,
        description,
        title,
        interest,
        package: packageRef,
        status: "Pending Review",
        contactName: u.name,
        contactEmail: u.email,
        contactPhone,
      });

      res.status(201).json({
        message: "New Service Request Created Successfully",
        serviceRequest: newServiceRequest,
      });
      return;
    }

    const doc = { ...payload, source: "registered" as const };
    const newServiceRequest = await ServiceRequest.create(doc);
    res.status(200).json({
      message: "New Service Request Created Successfully",
      serviceRequest: newServiceRequest,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Failed to create service request",
    });
  }
};

export const updateServiceRequest = async (req: Request, res: Response) => {
  try {
    const body = req.body?.serviceRequest as Record<string, unknown> | undefined;
    if (!body || typeof body !== "object") {
      res.status(400).json({ error: "serviceRequest payload is required" });
      return;
    }
    const id = body.id as string | undefined;
    if (!id) {
      res.status(400).json({ error: "Service request id is required" });
      return;
    }

    const existing = await ServiceRequest.findById(id);
    if (!existing) {
      res.status(404).json({ error: "Service request not found" });
      return;
    }

    const { id: _rid, meeting_date, interest, ...rest } = body;
    const $set: Record<string, unknown> = { ...rest };
    delete $set.id;
    const $unset: Record<string, 1> = {};

    if (Object.prototype.hasOwnProperty.call(body, "interest")) {
      delete $set.interest;
      if (interest === null || interest === "") {
        $unset.interest = 1;
      } else if (interest !== undefined) {
        $set.interest = interest;
      }
    }

    if (Object.prototype.hasOwnProperty.call(body, "meeting_date")) {
      delete $set.meeting_date;
        if (meeting_date === null || meeting_date === "") {
        if (
          existing.source === "contact" ||
          existing.source === "service" ||
          existing.source === "package"
        ) {
          $unset.meeting_date = 1;
        }
      } else if (meeting_date !== undefined) {
        $set.meeting_date = meeting_date;
      }
    }

    const mongoUpdate: mongoose.UpdateQuery<IServiceRequest> = {};
    if (Object.keys($set).length) mongoUpdate.$set = $set;
    if (Object.keys($unset).length) mongoUpdate.$unset = $unset;

    if (!mongoUpdate.$set && !mongoUpdate.$unset) {
      res.status(400).json({ error: "No updatable fields provided" });
      return;
    }

    const updatedServiceRequest = await ServiceRequest.findByIdAndUpdate(
      id,
      mongoUpdate,
      { new: true, runValidators: true },
    );
    if (!updatedServiceRequest) {
      res.status(404).json({ error: "Service request not found" });
      return;
    }
    res.status(200).json({
      message: "Service Request Data Updated Successfully",
      serviceRequest: updatedServiceRequest,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Failed to update service request",
    });
  }
};

export const deleteServiceRequest = async (req: Request, res: Response) => {
  try {
    const result = await ServiceRequest.deleteOne({ _id: req.params.id });
    if (result.deletedCount === 0) {
      res.status(404).json({ error: "Service request not found" });
      return;
    }
    res.status(200).json({ message: "Service Request Deleted Successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Failed to delete service request",
    });
  }
};
