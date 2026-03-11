const nodemailer = require('nodemailer');

let cachedTransporter = null;

function isMailConfigured() {
    return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function getTransporter() {
    if (!isMailConfigured()) {
        const error = new Error('Mail service is not configured');
        error.code = 'MAIL_NOT_CONFIGURED';
        throw error;
    }

    if (!cachedTransporter) {
        cachedTransporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587', 10),
            secure: String(process.env.SMTP_SECURE || 'false') === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
    }

    return cachedTransporter;
}

async function sendMail({ to, subject, text, html }) {
    const transporter = getTransporter();
    await transporter.sendMail({
        from: process.env.MAIL_FROM || process.env.SMTP_USER,
        to,
        subject,
        text,
        html
    });
}

module.exports = {
    isMailConfigured,
    sendMail
};
