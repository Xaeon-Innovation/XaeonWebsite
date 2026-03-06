import type { Request, Response } from "express";
import ServiceRequest from "../models/serviceRequest.model";

export const getServiceRequests = async (req: Request, res: Response) => {
  try {
    const serviceRequests = await ServiceRequest.find();
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
    const serviceRequest = await ServiceRequest.findById(req.params.id);
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

export const createServiceRequest = async (req: Request, res: Response) => {
  try {
    const newServiceRequest = await ServiceRequest.create(
      req.body.serviceRequest
    );
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
    const id = req.body.serviceRequest?.id;
    if (!id) {
      res.status(400).json({ error: "Service request id is required" });
      return;
    }
    const { id: _id, ...update } = req.body.serviceRequest;
    const updatedServiceRequest = await ServiceRequest.findByIdAndUpdate(
      id,
      update,
      { new: true, runValidators: true }
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
