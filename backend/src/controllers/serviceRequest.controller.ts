import { Request, Response } from "express";
import ServiceRequest from "../models/serviceRequest.model";

export const getServiceRequests = async (req: Request, res: Response) => {
  try {
    const serviceRequests = await ServiceRequest.find();
    res.status(200).json({ serviceRequests: serviceRequests });
  } catch (err) {
    console.log(err);
    res.status(400).json({ error: err });
  }
};

export const getServiceRequestById = async (req: Request, res: Response) => {
  try {
    const serviceRequest = await ServiceRequest.findById(req.params);
    res.status(200).json({ serviceRequest: serviceRequest });
  } catch (err) {
    console.log(err);
    res.status(400).json({ error: err });
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
    console.log(err);
    res.status(400).json({ error: err });
  }
};

export const updateServiceRequest = async (req: Request, res: Response) => {
  try {
    const updatedServiceRequest = await ServiceRequest.updateOne(
      { _id: req.body.serviceRequest.id },
      req.body.serviceRequest
    );
    res.status(200).json({
      message: "Service Request Data Updated Successfully",
      serviceRequest: updatedServiceRequest,
    });
  } catch (err) {
    console.log(err);
    res.status(400).json({ error: err });
  }
};

export const deleteServiceRequest = async (req: Request, res: Response) => {
  try {
    const serviceRequest = await ServiceRequest.deleteOne({
      _id: req.params.id,
    });
    res.status(200).json({ message: "Service Request Deleted Successfully" });
  } catch (err) {
    console.log(err);
    res.status(400).json({ error: err });
  }
};
