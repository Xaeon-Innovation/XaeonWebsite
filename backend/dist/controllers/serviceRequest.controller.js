"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteServiceRequest = exports.updateServiceRequest = exports.createServiceRequest = exports.getServiceRequestById = exports.getServiceRequests = void 0;
const serviceRequest_model_1 = __importDefault(require("../models/serviceRequest.model"));
const getServiceRequests = async (req, res) => {
    try {
        const serviceRequests = await serviceRequest_model_1.default.find();
        res.status(200).json({ serviceRequests });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({
            error: err instanceof Error ? err.message : "Failed to fetch service requests",
        });
    }
};
exports.getServiceRequests = getServiceRequests;
const getServiceRequestById = async (req, res) => {
    try {
        const serviceRequest = await serviceRequest_model_1.default.findById(req.params.id);
        if (!serviceRequest) {
            res.status(404).json({ error: "Service request not found" });
            return;
        }
        res.status(200).json({ serviceRequest });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({
            error: err instanceof Error ? err.message : "Failed to fetch service request",
        });
    }
};
exports.getServiceRequestById = getServiceRequestById;
const createServiceRequest = async (req, res) => {
    try {
        const newServiceRequest = await serviceRequest_model_1.default.create(req.body.serviceRequest);
        res.status(200).json({
            message: "New Service Request Created Successfully",
            serviceRequest: newServiceRequest,
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({
            error: err instanceof Error ? err.message : "Failed to create service request",
        });
    }
};
exports.createServiceRequest = createServiceRequest;
const updateServiceRequest = async (req, res) => {
    try {
        const id = req.body.serviceRequest?.id;
        if (!id) {
            res.status(400).json({ error: "Service request id is required" });
            return;
        }
        const { id: _id, ...update } = req.body.serviceRequest;
        const updatedServiceRequest = await serviceRequest_model_1.default.findByIdAndUpdate(id, update, { new: true, runValidators: true });
        if (!updatedServiceRequest) {
            res.status(404).json({ error: "Service request not found" });
            return;
        }
        res.status(200).json({
            message: "Service Request Data Updated Successfully",
            serviceRequest: updatedServiceRequest,
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({
            error: err instanceof Error ? err.message : "Failed to update service request",
        });
    }
};
exports.updateServiceRequest = updateServiceRequest;
const deleteServiceRequest = async (req, res) => {
    try {
        const result = await serviceRequest_model_1.default.deleteOne({ _id: req.params.id });
        if (result.deletedCount === 0) {
            res.status(404).json({ error: "Service request not found" });
            return;
        }
        res.status(200).json({ message: "Service Request Deleted Successfully" });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({
            error: err instanceof Error ? err.message : "Failed to delete service request",
        });
    }
};
exports.deleteServiceRequest = deleteServiceRequest;
