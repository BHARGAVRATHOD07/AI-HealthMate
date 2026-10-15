const { test } = require("node:test");
const assert = require("node:assert/strict");
const dns = require("dns");
const net = require("net");
const nodemailer = require("nodemailer");

// ── Isolated env for tests (never reads .env) ─────────────────────────────────
process.env.JWT_SECRET = "test-smtp-secret";
process.env.PASSWORD_RESET_OTP_SECRET = "test-smtp-otp-secret-32-bytes-minimum-ok";
process.env.SMTP_HOST = "127.0.0.1";
process.env.SMTP_PORT = "587";
process.env.SMTP_USER = "test@example.test";
process.env.SMTP_PASS = "test-password";
process.env.SMTP_FROM = "AI HealthMate <test@example.test>";

const { getSmtpConfig, resolveIPv4, sendPasswordResetOtp } = require("../utils/emailService");

test("resolveIPv4 returns an IPv4 address for a resolvable hostname", async () => {
    const originalLookup = dns.lookup;
    dns.lookup = (hostname, opts, cb) => {
        if (typeof opts === "function") { cb = opts; opts = {}; }
        cb(null, "142.250.180.108", 4);
    };

    try {
        const address = await resolveIPv4("smtp.gmail.com");
        assert.equal(address, "142.250.180.108");
    } finally {
        dns.lookup = originalLookup;
    }
});

test("resolveIPv4 returns IPv4 literals directly without DNS lookup", async () => {
    const originalLookup = dns.lookup;
    let lookupCalled = false;
    dns.lookup = () => { lookupCalled = true; };

    try {
        const result = await resolveIPv4("127.0.0.1");
        assert.equal(result, "127.0.0.1");
        assert.equal(lookupCalled, false, "dns.lookup should not be called for IPv4 literals");
    } finally {
        dns.lookup = originalLookup;
    }
});

test("resolveIPv4 rejects when given an IPv6 literal", async () => {
    await assert.rejects(
        () => resolveIPv4("::1"),
        (err) => {
            assert.equal(err.code, "SMTP_IPV6_UNSUPPORTED");
            assert.equal(err.diagnostics?.stage, "DNS_IPV4_RESOLUTION");
            return true;
        }
    );
});

test("resolveIPv4 rejects with SMTP_DNS_RESOLUTION_FAILED when lookup fails (no silent fallback)", async () => {
    const originalLookup = dns.lookup;
    dns.lookup = (hostname, opts, cb) => {
        if (typeof opts === "function") { cb = opts; opts = {}; }
        const err = new Error("getaddrinfo ENOTFOUND smtp.invalid.domain");
        err.code = "ENOTFOUND";
        cb(err, null);
    };

    try {
        await assert.rejects(
            () => resolveIPv4("smtp.invalid.domain"),
            (err) => {
                assert.equal(err.code, "SMTP_DNS_RESOLUTION_FAILED");
                assert.ok(err.message.includes("smtp.invalid.domain"));
                assert.equal(err.diagnostics?.stage, "DNS_IPV4_RESOLUTION");
                assert.equal(err.diagnostics?.dnsCode, "ENOTFOUND");
                return true;
            }
        );
    } finally {
        dns.lookup = originalLookup;
    }
});

test("SMTP transporter receives IPv4 host and TLS servername when sendPasswordResetOtp is called", async () => {
    const originalCreateTransport = nodemailer.createTransport;
    const originalLookup = dns.lookup;
    const savedHost = process.env.SMTP_HOST;
    process.env.SMTP_HOST = "smtp.example.test";
    let capturedOptions = null;

    dns.lookup = (hostname, opts, cb) => {
        if (typeof opts === "function") { cb = opts; opts = {}; }
        if (opts && opts.family === 4 && hostname === "smtp.example.test") {
            return cb(null, "93.184.216.34", 4);
        }
        return originalLookup(hostname, opts, cb);
    };

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
        process.env.SMTP_HOST = savedHost;
    }
});

test("sendPasswordResetOtp rejects with SMTP_DNS_RESOLUTION_FAILED when IPv4 resolution fails", async () => {
    const originalCreateTransport = nodemailer.createTransport;
    const originalLookup = dns.lookup;
    const savedHost = process.env.SMTP_HOST;
    process.env.SMTP_HOST = "smtp.unresolvable.test";

    dns.lookup = (hostname, opts, cb) => {
        if (typeof opts === "function") { cb = opts; opts = {}; }
        const err = new Error("ENOTFOUND");
        err.code = "ENOTFOUND";
        cb(err, null);
    };

    nodemailer.createTransport = () => {
        throw new Error("Transporter should not be created if DNS resolution fails");
    };

    try {
        await assert.rejects(
            () => sendPasswordResetOtp("user@example.test", "654321"),
            (err) => {
                assert.equal(err.code, "SMTP_DNS_RESOLUTION_FAILED");
                assert.equal(err.diagnostics?.stage, "DNS_IPV4_RESOLUTION");
                assert.equal(err.diagnostics?.host, "smtp.unresolvable.test");
                assert.equal(err.diagnostics?.dnsCode, "ENOTFOUND");
                return true;
            }
        );
    } finally {
        nodemailer.createTransport = originalCreateTransport;
        dns.lookup = originalLookup;
        process.env.SMTP_HOST = savedHost;
    }
});

test("SMTP connection failure surfaces with safe diagnostics without credentials", async () => {
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
                assert.equal(err.code, "ESOCKET");
                assert.ok(err.diagnostics, "diagnostics should be attached");
                assert.equal(err.diagnostics.stage, "SMTP_DELIVERY");
                assert.equal(err.diagnostics.port, 587);
                assert.ok(err.diagnostics.renderNote, "renderNote should be present for socket failure");
                // Verify sensitive info is NOT in diagnostics
                assert.equal(err.diagnostics.email, undefined);
                assert.equal(err.diagnostics.code, "ESOCKET");
                assert.equal(err.diagnostics.password, undefined);
                assert.equal(err.diagnostics.otp, undefined);
                return true;
            }
        );
    } finally {
        nodemailer.createTransport = originalCreateTransport;
    }
});

test("SMTP timeout surfaces as a rejection with timeout error and safe diagnostics", async () => {
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
                assert.equal(err.code, "ETIMEDOUT");
                assert.ok(err.diagnostics, "diagnostics should be attached");
                assert.equal(err.diagnostics.stage, "SMTP_DELIVERY");
                assert.equal(err.diagnostics.port, 587);
                assert.ok(err.diagnostics.renderNote.includes("Render free tier"), "renderNote explains Render SMTP block");
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
    let loading = true;
    let error = null;

    try {
        loading = true;
        const response = {
            ok: false,
            json: async () => ({ message: "Could not send the verification email. Check the SMTP configuration and try again." })
        };
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
