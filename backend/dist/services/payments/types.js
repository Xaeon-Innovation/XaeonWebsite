"use strict";
/**
 * Payment providers sit behind this interface so the builder doesn't care which gateway is used.
 * Setup docs: docs/website-builder/payments.md
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookSignatureError = void 0;
exports.header = header;
class WebhookSignatureError extends Error {
}
exports.WebhookSignatureError = WebhookSignatureError;
function header(req, name) {
    const v = req.headers[name.toLowerCase()];
    return (Array.isArray(v) ? v[0] : v) ?? "";
}
