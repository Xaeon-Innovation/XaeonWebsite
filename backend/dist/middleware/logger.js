"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logEvents = exports.logger = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const crypto_1 = require("crypto");
const CAIRO_TZ = "Africa/Cairo";
const formatLogDateTime = (date) => {
    const formatter = new Intl.DateTimeFormat("en-CA", {
        timeZone: CAIRO_TZ,
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
    });
    const parts = formatter.formatToParts(date);
    const get = (type) => parts.find((p) => p.type === type)?.value ?? "00";
    const pad = (s) => s.padStart(2, "0");
    const day = pad(get("day"));
    const month = pad(get("month"));
    const year = get("year");
    const hour = pad(get("hour"));
    const minute = pad(get("minute"));
    const second = pad(get("second"));
    return `${day}/${month}/${year}\t${hour}:${minute}:${second}`;
};
const logEvents = async (message, logFileName) => {
    const dateTime = formatLogDateTime(new Date());
    const logItem = `${dateTime}\t${(0, crypto_1.randomUUID)()}\t${message}\n`;
    const logsDir = path_1.default.join(__dirname, "..", "..", "logs");
    const logPath = path_1.default.join(logsDir, logFileName);
    try {
        await fs_1.default.promises.mkdir(logsDir, { recursive: true });
        await fs_1.default.promises.appendFile(logPath, logItem);
    }
    catch (err) {
        console.error(err);
    }
};
exports.logEvents = logEvents;
const logger = (req, _res, next) => {
    logEvents(`${req.method}\t${req.url}\t${req.headers.origin ?? "unknown"}`, "reqLog.log");
    next();
};
exports.logger = logger;
