"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const logger_1 = require("./logger");
const errorHandler = (err, req, res, _next) => {
    const message = err instanceof Error ? err.message : String(err);
    const name = err instanceof Error ? err.name : "Error";
    (0, logger_1.logEvents)(`${name}: ${message}\t${req.method}\t${req.url}\t${req.headers.origin ?? "unknown"}`, "errLog.log");
    console.error(err instanceof Error ? err.stack : message);
    const status = res.statusCode && res.statusCode >= 400 ? res.statusCode : 500;
    res.status(status).json({ message });
};
exports.errorHandler = errorHandler;
