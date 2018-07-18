"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const nodemailer_1 = require("nodemailer");
const mailerCredentials = JSON.parse(fs_1.readFileSync('.config/credentials.json', 'utf8')).nodemailer;
const config = {
    host: mailerCredentials.host,
    port: 587,
    pool: true,
    auth: { user: mailerCredentials.username, pass: mailerCredentials.password },
    tls: { ciphers: 'SSLv3' }
};
exports.transporter = nodemailer_1.createTransport(config);
//# sourceMappingURL=transporter.js.map