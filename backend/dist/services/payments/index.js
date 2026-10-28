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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProvider = getProvider;
exports.providerFor = providerFor;
exports.paymentOptions = paymentOptions;
const kashier_1 = require("./kashier");
const polar_1 = require("./polar");
__exportStar(require("./types"), exports);
const ALL = { kashier: kashier_1.kashier, polar: polar_1.polar };
function getProvider(name) {
    return ALL[name];
}
/**
 * First configured provider in PAYMENT_PROVIDERS (comma list, in priority order, e.g. "kashier,polar")
 * that accepts this currency. None → the order is saved and the team sends a payment link manually.
 */
function providerFor(currency) {
    const names = (process.env.PAYMENT_PROVIDERS ?? "")
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
    return names
        .map((n) => ALL[n])
        .find((p) => !!p && p.configured() && p.supports(currency));
}
/** What the builder tells a customer about paying in this currency (shown after they pick their country). */
function paymentOptions(currency) {
    const p = providerFor(currency);
    return p ? { online: true, provider: p.name, methods: p.methods() } : { online: false, methods: [] };
}
