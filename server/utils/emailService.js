const dns = require("dns");
const net = require("net");
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

/**
 * Resolves a hostname to an IPv4 address via dns.lookup with family:4.
 * Returns the original hostname if it is already an IP literal or if
 * IPv4 resolution fails, so the caller can surface the real error.
 *
 * @param {string} hostname
 * @returns {Promise<string>} IPv4 address or original hostname
 */
const resolveIPv4 = (hostname) =>
    new Promise((resolve) => {
        if (net.isIP(hostname)) {
            return resolve(hostname);
        }
        dns.lookup(hostname, { family: 4 }, (err, address) => {
            resolve(!err && address ? address : hostname);
        });
    });

const sendPasswordResetOtp = async (email, code) => {
    const config = getSmtpConfig();

    // Pre-resolve the SMTP hostname to a guaranteed IPv4 address before
    // creating the transporter. nodemailer v10 resolves both A and AAAA
    // records and picks an address at random from the combined list. On
    // dual-stack hosts where outbound IPv6 is blocked (Render free tier),
    // this produces intermittent ENETUNREACH / ESOCKET failures. Passing a
    // raw IPv4 literal causes nodemailer to skip its own DNS resolution and
    // connect directly, eliminating the IPv6 code path entirely.
    const resolvedHost = await resolveIPv4(config.host);

    const transporter = nodemailer.createTransport({
        host: resolvedHost,
        port: config.port,
        secure: config.secure,
        // Preserve the original hostname as the TLS servername so SNI and
        // certificate verification still work when connecting to a raw IP.
        tls: { servername: config.host },
        auth: config.auth,
        // Conservative timeouts so a stalled connection does not keep the
        // HTTP response — and the user's loading spinner — hanging forever.
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout:   15000
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
