"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.revalidateOnWrite = void 0;
const publishHooks_1 = require("../services/publishHooks");
/** After any successful create/update/delete on a CMS router, refresh the public site's cache. */
const revalidateOnWrite = (req, res, next) => {
    if (req.method !== "GET") {
        res.on("finish", () => {
            if (res.statusCode < 300)
                (0, publishHooks_1.notifyContentChanged)();
        });
    }
    next();
};
exports.revalidateOnWrite = revalidateOnWrite;
