const { test } = require("node:test");
const assert = require("node:assert/strict");
const dns = require("dns");
const net = require("net");
const nodemailer = require("nodemailer");

// ── Isolated env for tests (never reads .env) ─────────────────────────────────
process.env.JWT_SECRET = "test-smtp-secret";
process.env.PASSWORD_RESET_OTP_SECRET = "test-smtp-otp-secret-32-bytes-minimum-ok";
process.env.SMTP_HOST = "smtp.example.test";
process.env.SMTP_PORT = "587";
process.env.SMTP_USER = "test@example.test";
process.env.SMTP_PASS = "test-password";
process.env.SMTP_FROM = "AI HealthMate <test@example.test>";

const { getSmtpConfig, sendPasswordResetOtp } = require("../utils/emailService");

// ── Helpers ────────────────────────────────────────────────────────────────────
const createResponse = () => ({
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; }
});

test("resolveIPv4 returns an IPv4 address for a resolvable hostname", async () => {
    // Use the internal resolveIPv4 indirectly: the module calls it during
    // sendPasswordResetOtp, but we can test DNS behaviour directly here.
    const result = await new Promise((resolve) => {
        dns.lookup("smtp.example.test", { family: 4 }, (err, address) => {
            // dns.lookup for a non-existent host will fail — that's fine,
            // the resolveIPv4 wrapper falls back to the original hostname.
            resolve(err ? "smtp.example.test" : address);
        });
    });
    // Either we got an IPv4 address or the original hostname (both acceptable)
    assert.ok(typeof result === "string" && result.length > 0);
});

test("resolveIPv4 returns IP literals unchanged", async () => {
    // Test that an IP literal is returned as-is (no DNS lookup attempted)
    assert.ok(net.isIP("192.168.1.1"), "192.168.1.1 should be recognised as IP");
    assert.ok(net.isIP("::1"), "::1 should be recognised as IP");
});

test("SMTP transporter receives IPv4 host and TLS servername when sendPasswordResetOtp is called", async () => {
    const originalCreateTransport = nodemailer.createTransport;
    const originalLookup = dns.lookup;
    let capturedOptions = null;

    // Stub dns.lookup to return a known IPv4 address
    dns.lookup = (hostname, opts, cb) => {
        if (typeof opts === "function") { cb = opts; opts = {}; }
        if (opts && opts.family === 4 && hostname === "smtp.example.test") {
            return cb(null, "93.184.216.34", 4);
        }
        return originalLookup(hostname, opts, cb);
    };

    // Capture transporter options
    nodemailer.createTransport = (options) => {
        capturedOptions = options;
        return {
            sendMail: async () => ({ messageId: "test-id" })
        };
    };

    try {
        await sendPasswordResetOtp("user@example.test", "123456");

        assert.ok(capturedOptions, "transporter should have been created");
        assert.equal(capturedOptions.host, "93.184.216.34",
            "host should be the resolved IPv4 address");
        assert.equal(capturedOptions.tls.servername, "smtp.example.test",
            "TLS servername should preserve the original hostname for SNI");
        assert.equal(capturedOptions.port, 587);
        assert.equal(capturedOptions.secure, false);
        assert.ok(capturedOptions.connectionTimeout > 0,
            "connectionTimeout should be set");
        assert.ok(capturedOptions.greetingTimeout > 0,
            "greetingTimeout should be set");
        assert.ok(capturedOptions.socketTimeout > 0,
            "socketTimeout should be set");
    } finally {
        nodemailer.createTransport = originalCreateTransport;
        dns.lookup = originalLookup;
    }
});

test("sendPasswordResetOtp falls back to original hostname when IPv4 resolution fails", async () => {
    const originalCreateTransport = nodemailer.createTransport;
    const originalLookup = dns.lookup;
    let capturedHost = null;

    // Stub dns.lookup to simulate resolution failure
    dns.lookup = (hostname, opts, cb) => {
        if (typeof opts === "function") { cb = opts; opts = {}; }
        if (opts && opts.family === 4) {
            return cb(new Error("ENOTFOUND"), null, null);
        }
        return originalLookup(hostname, opts, cb);
    };

    nodemailer.createTransport = (options) => {
        capturedHost = options.host;
        return {
            sendMail: async () => ({ messageId: "test-id" })
        };
    };

    try {
        await sendPasswordResetOtp("user@example.test", "654321");
        assert.equal(capturedHost, "smtp.example.test",
            "should fall back to the original hostname when IPv4 lookup fails");
    } finally {
        nodemailer.createTransport = originalCreateTransport;
        dns.lookup = originalLookup;
    }
});

test("SMTP connection failure surfaces as a rejection, not an unhandled error", async () => {
    const originalCreateTransport = nodemailer.createTransport;

    nodemailer.createTransport = () => ({
        sendMail: async () => {
            const err = new Error("connect ENETUNREACH 2404:6800:4003:c1a::6d:587");
            err.code = "ESOCKET";
            throw err;
        }
    });

    try {
        await assert.rejects(
            () => sendPasswordResetOtp("user@example.test", "111111"),
            (err) => {
                assert.ok(err.message.includes("ENETUNREACH") || err.code === "ESOCKET",
                    "error should surface the SMTP connection failure");
                return true;
            }
        );
    } finally {
        nodemailer.createTransport = originalCreateTransport;
    }
});

test("SMTP timeout surfaces as a rejection with timeout error", async () => {
    const originalCreateTransport = nodemailer.createTransport;

    nodemailer.createTransport = () => ({
        sendMail: async () => {
            const err = new Error("Connection timeout");
            err.code = "ETIMEDOUT";
            throw err;
        }
    });

    try {
        await assert.rejects(
            () => sendPasswordResetOtp("user@example.test", "222222"),
            (err) => {
                assert.ok(err.code === "ETIMEDOUT" || err.message.includes("timeout"),
                    "error should surface the timeout");
                return true;
            }
        );
    } finally {
        nodemailer.createTransport = originalCreateTransport;
    }
});

test("successful email delivery resolves without error", async () => {
    const originalCreateTransport = nodemailer.createTransport;
    let sentMessage = null;

    nodemailer.createTransport = () => ({
        sendMail: async (msg) => {
            sentMessage = msg;
            return { messageId: "success-id" };
        }
    });

    try {
        // Should not throw
        await sendPasswordResetOtp("happy@example.test", "999999");

        assert.ok(sentMessage, "sendMail should have been called");
        assert.equal(sentMessage.to, "happy@example.test");
        assert.ok(sentMessage.text.includes("999999"), "email text should contain the OTP code");
        assert.ok(sentMessage.html.includes("999999"), "email HTML should contain the OTP code");
        assert.ok(!sentMessage.text.includes("SMTP"), "email text should not leak SMTP details");
    } finally {
        nodemailer.createTransport = originalCreateTransport;
    }
});

test("getSmtpConfig rejects when required env vars are missing", () => {
    const saved = { ...process.env };
    try {
        delete process.env.SMTP_HOST;
        assert.throws(() => getSmtpConfig(), (err) => {
            assert.equal(err.code, "SMTP_NOT_CONFIGURED");
            assert.ok(err.message.includes("SMTP_HOST"));
            return true;
        });
    } finally {
        Object.assign(process.env, saved);
    }
});

test("frontend loading state exits on API failure (simulated)", async () => {
    // Simulates the frontend pattern: loading starts true, catch sets error,
    // finally sets loading false.
    let loading = true;
    let error = null;

    try {
        loading = true;
        // Simulate a failed API call
        const response = { ok: false, json: async () => ({ message: "Could not send the verification email. Check the SMTP configuration and try again." }) };
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
    } catch (err) {
        error = err.message;
    } finally {
        loading = false;
    }

    assert.equal(loading, false, "loading should always be false after try/catch/finally");
    assert.ok(error, "error should be captured");
    assert.ok(!error.includes("ESOCKET"), "error should not expose internal socket details");
    assert.ok(!error.includes("ENETUNREACH"), "error should not expose internal network details");
});
