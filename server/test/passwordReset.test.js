const { test } = require("node:test");
const assert = require("node:assert/strict");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

process.env.JWT_SECRET = "test-password-reset-secret";
process.env.PASSWORD_RESET_OTP_SECRET = "test-password-reset-otp-secret-32-bytes-minimum";
process.env.SMTP_HOST = "smtp.example.test";
process.env.SMTP_PORT = "587";
process.env.SMTP_USER = "test@example.test";
process.env.SMTP_PASS = "test-password";
process.env.SMTP_FROM = "AI HealthMate <test@example.test>";

const User = require("../models/User");
const PasswordResetOtp = require("../models/PasswordResetOtp");
const {
    requestPasswordReset,
    resetPasswordWithOtp
} = require("../controllers/authController");

const createResponse = () => ({
    statusCode: 200,
    body: null,
    status(code) {
        this.statusCode = code;
        return this;
    },
    json(body) {
        this.body = body;
        return this;
    }
});

test("email password recovery sends, limits, verifies, and consumes a one-time code", async (t) => {
    const originalCreateTransport = nodemailer.createTransport;
    const sentMessages = [];
    nodemailer.createTransport = () => ({
        sendMail: async (message) => {
            sentMessages.push(message);
        }
    });

    const user = {
        _id: "user-id",
        email: "person@example.test",
        password: "old-password-hash",
        save: async () => {}
    };
    User.findOne = () => ({ select: async () => user });

    let otpRecord = null;
    PasswordResetOtp.findOne = async () => otpRecord;
    PasswordResetOtp.findOneAndUpdate = async (_filter, update) => {
        if (update.$set) {
            otpRecord = {
                _id: "otp-id",
                codeHash: update.$set.codeHash,
                attempts: 0,
                expiresAt: update.$set.expiresAt,
                lastSentAt: update.$set.lastSentAt
            };
            return otpRecord;
        }

        if (update.$inc && otpRecord && otpRecord.attempts < 5) {
            otpRecord.attempts += update.$inc.attempts;
            return { ...otpRecord };
        }
        return null;
    };
    PasswordResetOtp.deleteOne = async (filter) => {
        if (otpRecord && filter._id === otpRecord._id && filter.attempts === otpRecord.attempts) {
            otpRecord = null;
            return { deletedCount: 1 };
        }
        return { deletedCount: 0 };
    };

    try {
        await t.test("request returns an enumeration-safe message and sends a six-digit code", async () => {
            const res = createResponse();
            await requestPasswordReset({ body: { email: "PERSON@example.test" } }, res);

            assert.equal(res.statusCode, 200);
            assert.match(res.body.message, /If an account exists/);
            assert.equal(sentMessages.length, 1);
            assert.equal(sentMessages[0].to, "person@example.test");

            const match = sentMessages[0].text.match(/\b(\d{6})\b/);
            assert.ok(match, "email should contain a six-digit code");
            const code = match[1];
            const expectedHash = crypto
                .createHmac("sha256", process.env.PASSWORD_RESET_OTP_SECRET)
                .update(`person@example.test:${code}`)
                .digest("hex");
            assert.equal(otpRecord.codeHash, expectedHash);
            assert.equal(JSON.stringify(res.body).includes(code), false);
        });

        await t.test("a request inside the resend cooldown does not send another code", async () => {
            const res = createResponse();
            await requestPasswordReset({ body: { email: "person@example.test" } }, res);

            assert.equal(res.statusCode, 200);
            assert.equal(sentMessages.length, 1);
        });

        await t.test("incorrect code is rejected and counted", async () => {
            const originalPassword = user.password;
            const deliveredCode = sentMessages[0].text.match(/\b(\d{6})\b/)[1];
            const wrongCode = deliveredCode === "000000" ? "000001" : "000000";
            const res = createResponse();
            await resetPasswordWithOtp({
                body: {
                    email: "person@example.test",
                    code: wrongCode,
                    newPassword: "new-password"
                }
            }, res);

            assert.equal(res.statusCode, 400);
            assert.equal(user.password, originalPassword);
            assert.equal(otpRecord.attempts, 1);
        });

        await t.test("correct code changes the password and consumes the code", async () => {
            const match = sentMessages[0].text.match(/\b(\d{6})\b/);
            const res = createResponse();
            await resetPasswordWithOtp({
                body: {
                    email: "person@example.test",
                    code: match[1],
                    newPassword: "new-password"
                }
            }, res);

            assert.equal(res.statusCode, 200);
            assert.equal(res.body.success, true);
            assert.equal(await bcrypt.compare("new-password", user.password), true);
            assert.equal(otpRecord, null);
        });

        await t.test("unknown email receives the same success response without sending mail", async () => {
            User.findOne = () => ({ select: async () => null });
            const res = createResponse();
            await requestPasswordReset({ body: { email: "unknown@example.test" } }, res);

            assert.equal(res.statusCode, 200);
            assert.match(res.body.message, /If an account exists/);
            assert.equal(sentMessages.length, 1);
        });
    } finally {
        nodemailer.createTransport = originalCreateTransport;
    }
});
