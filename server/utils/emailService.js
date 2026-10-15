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
 * Resolves a hostname to an IPv4 address via dns.lookup with family: 4.
 * Returns the IP literal directly if already an IPv4 address.
 * Rejects with a clear, safe error if resolution fails or if given an IPv6 literal.
 *
 * @param {string} hostname
 * @returns {Promise<string>} Resolved IPv4 address
 */
const resolveIPv4 = (hostname) =>
    new Promise((resolve, reject) => {
        if (net.isIPv4(hostname)) {
            return resolve(hostname);
        }
        if (net.isIPv6(hostname)) {
            const error = new Error("IPv6 addresses are not supported for SMTP connections in this environment.");
            error.code = "SMTP_IPV6_UNSUPPORTED";
            error.diagnostics = {
                stage: "DNS_IPV4_RESOLUTION",
                host: hostname,
                error: "IPV6_UNSUPPORTED"
            };
            return reject(error);
        }
        dns.lookup(hostname, { family: 4 }, (err, address) => {
            if (err || !address) {
                const error = new Error(`Could not resolve IPv4 address for host '${hostname}'.`);
                error.code = "SMTP_DNS_RESOLUTION_FAILED";
                error.diagnostics = {
                    stage: "DNS_IPV4_RESOLUTION",
                    host: hostname,
                    dnsCode: err?.code || "NO_IPV4_ADDRESS"
                };
                return reject(error);
            }
            resolve(address);
        });
    });

const sendPasswordResetOtp = async (email, code) => {
    const config = getSmtpConfig();

    let resolvedHost;
    try {
        resolvedHost = await resolveIPv4(config.host);
    } catch (dnsError) {
        throw dnsError;
    }

    const transporter = nodemailer.createTransport({
        host: resolvedHost,
        port: config.port,
        secure: config.secure,
        tls: { servername: config.host },
        auth: config.auth,
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000
    });

    try {
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
    } catch (smtpError) {
        const diagnostics = {
            stage: "SMTP_DELIVERY",
            host: config.host,
            resolvedIp: resolvedHost,
            port: config.port,
            secure: config.secure,
            code: smtpError.code || "UNKNOWN"
        };
        if (smtpError.code === "ETIMEDOUT" || smtpError.code === "ESOCKET" || smtpError.code === "ENETUNREACH") {
            diagnostics.renderNote = "Render free tier blocks outbound SMTP ports 25, 465, and 587. Consider an HTTPS API email service (e.g., Resend) or upgrading to a paid Render plan.";
        }
        smtpError.diagnostics = diagnostics;
        throw smtpError;
    }
};

module.exports = { getSmtpConfig, resolveIPv4, sendPasswordResetOtp };
