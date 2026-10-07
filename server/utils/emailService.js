const nodemailer = require("nodemailer");

const getSmtpConfig = () => {
    const required = ["SMTP_HOST", "SMTP_USER", "SMTP_PASS"];
    const missing = required.filter((name) => !process.env[name]);

    if (!process.env.SMTP_FROM && !process.env.SMTP_USER) {
        missing.push("SMTP_FROM");
    }

    if (missing.length) {
        const error = new Error(`Email delivery is not configured. Missing: ${missing.join(", ")}.`);
        error.code = "SMTP_NOT_CONFIGURED";
        throw error;
    }

    const port = Number(process.env.SMTP_PORT || 587);
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
        const error = new Error("SMTP_PORT must be a valid TCP port.");
        error.code = "SMTP_INVALID_CONFIG";
        throw error;
    }

    return {
        host: process.env.SMTP_HOST,
        port,
        secure: process.env.SMTP_SECURE
            ? process.env.SMTP_SECURE.toLowerCase() === "true"
            : port === 465,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        },
        from: process.env.SMTP_FROM || process.env.SMTP_USER
    };
};

const sendPasswordResetOtp = async (email, code) => {
    const config = getSmtpConfig();
    const transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: config.auth
    });

    await transporter.sendMail({
        from: config.from,
        to: email,
        subject: "Your AI HealthMate password reset code",
        text: `Your password reset code is ${code}. It expires in 10 minutes. If you did not request this, you can ignore this email.`,
        html: `
            <div style="font-family:Arial,sans-serif;color:#0f172a;max-width:520px;margin:0 auto;padding:24px">
              <div style="border:1px solid #dcfce7;border-radius:16px;padding:28px;background:#ffffff">
                <p style="color:#059669;font-weight:700;margin:0 0 12px">AI HealthMate</p>
                <h1 style="font-size:22px;margin:0 0 12px">Reset your password</h1>
                <p style="color:#64748b;line-height:1.6">Use this one-time code to reset your password. It expires in 10 minutes.</p>
                <p style="font-size:32px;letter-spacing:8px;font-weight:700;color:#16a34a;margin:24px 0">${code}</p>
                <p style="font-size:13px;color:#64748b">If you did not request a password reset, you can safely ignore this email.</p>
              </div>
            </div>
        `
    });
};

module.exports = { getSmtpConfig, sendPasswordResetOtp };
