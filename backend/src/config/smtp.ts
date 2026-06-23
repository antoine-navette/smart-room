import nodemailer from 'nodemailer';
import type { Env } from './env.js';

export const connectToSmtp = async (smtpUrl: Env['smtpUrl']) => {
    const transporter = nodemailer.createTransport(smtpUrl);

    return { transporter };
};
