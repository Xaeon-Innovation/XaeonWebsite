"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const db = async (retries = 5, delay = 2500) => {
    try {
        await mongoose_1.default.connect(process.env.DB_URI);
        console.log("✅ MongoDB connected successfully");
    }
    catch (error) {
        console.error(`❌ MongoDB connection failed: ${error}`);
        if (retries > 0) {
            console.log(`🔄 Retrying in ${delay / 1000} seconds... (${retries} retries left)`);
            setTimeout(() => {
                db(retries - 1, delay);
            }, delay);
        }
        else {
            console.error("❌ Could not connect to MongoDB after multiple attempts. Exiting...");
            process.exit(1);
        }
    }
};
exports.default = db;
