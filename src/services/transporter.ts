import { readFileSync } from 'fs';
import { createTransport } from 'nodemailer';

const mailerCredentials = JSON.parse(readFileSync('.config/credentials.json', 'utf8')).nodemailer;

const config: any = { 
    host: mailerCredentials.host,
    port: 587,
    pool: true,
    auth: { user: mailerCredentials.username, pass: mailerCredentials.password },
    tls: { ciphers: 'SSLv3' }
}

export const transporter = createTransport(config);
