const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = require("./config/db");
const { logInternalError } = require("./utils/errorLogging");
const userRoutes       = require("./routes/userRoutes");
const authRoutes        = require("./routes/authRoutes");
const aiRoutes          = require("./routes/aiRoutes");
const vitalRoutes       = require("./routes/vitalRoutes");
const medicationRoutes  = require("./routes/medicationRoutes");
const reminderRoutes    = require("./routes/reminderRoutes");
const recordRoutes      = require("./routes/recordRoutes");

const app = express();

// Trust reverse proxy 1st hop (Render, Cloudflare) for accurate req.ip in rate limiters
app.set("trust proxy", 1);

// Configure CORS origin policy
const getAllowedOrigins = () => {
    const configured = (process.env.CLIENT_URL || "")
        .split(",")
        .map((origin) => origin.trim().replace(/\/+$/, ""))
        .filter(Boolean);

    // In production with configured origins, strictly enforce allowlist
    if (process.env.NODE_ENV === "production" && configured.length > 0) {
        return configured;
    }

    // In development or when no CLIENT_URL configured, permit local development origins
    const devOrigins = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:5000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5000"
    ];

    return [...new Set([...configured, ...devOrigins])];
};

const isOriginAllowed = (origin) => {
    // Allow non-browser requests (e.g. server health probes, curl, mobile apps)
    if (!origin) return true;
    const normalized = origin.trim().replace(/\/+$/, "");
    const allowed = getAllowedOrigins();
    if (allowed.includes(normalized)) {
        return true;
    }
    // Allow any localhost origin in non-production environments
    if (process.env.NODE_ENV !== "production") {
        if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(normalized)) {
            return true;
        }
    }
    return false;
};

const corsOptions = {
    origin: (origin, callback) => {
        if (isOriginAllowed(origin)) {
            callback(null, true);
        } else {
            callback(null, false);
        }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "X-Request-Id"],
    optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "1mb" }));
app.use("/api/users",       userRoutes);
app.use("/api/auth",        authRoutes);
app.use("/api/ai",          aiRoutes);
app.use("/api/vitals",      vitalRoutes);
app.use("/api/medications", medicationRoutes);
app.use("/api/reminders",   reminderRoutes);
app.use("/api/records",     recordRoutes);


app.get("/", (req, res) => {
    res.json({
        message: "AI HealthMate Backend is running"
    });
});

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Resource not found."
    });
});

app.use((error, req, res, next) => {
    if (res.headersSent) {
        return next(error);
    }

    logInternalError("Unhandled request", error);
    if (error.type === "entity.parse.failed") {
        return res.status(400).json({
            success: false,
            message: "Request body must contain valid JSON."
        });
    }
    if (error.type === "entity.too.large") {
        return res.status(413).json({
            success: false,
            message: "Request body is too large."
        });
    }

    return res.status(500).json({
        success: false,
        message: "An unexpected server error occurred."
    });
});

const PORT = process.env.PORT || 5000;

let isShuttingDown = false;
let shutdownHandler = null;

const setupShutdownHandlers = (server) => {
    if (shutdownHandler) return;

    shutdownHandler = async (signal) => {
        if (isShuttingDown) return;
        isShuttingDown = true;
        console.log(`Received ${signal}. Starting graceful shutdown...`);

        // Forced fallback timer if requests or connection cleanup stall
        const forcedTimer = setTimeout(() => {
            console.error(`Graceful shutdown timed out (${signal}). Forcing process exit.`);
            process.exit(1);
        }, 10000);
        forcedTimer.unref();

        try {
            // 1. Stop accepting new HTTP requests
            if (server && server.listening) {
                await new Promise((resolve, reject) => {
                    server.close((err) => {
                        if (err) return reject(err);
                        console.log("HTTP server closed to new requests.");
                        resolve();
                    });
                });
            }

            // 2. Close MongoDB connection cleanly
            if (mongoose.connection && mongoose.connection.readyState !== 0) {
                await mongoose.connection.close(false);
                console.log("MongoDB connection closed safely.");
            }

            console.log(`Graceful shutdown complete (${signal}).`);
            clearTimeout(forcedTimer);
            process.exit(0);
        } catch (error) {
            clearTimeout(forcedTimer);
            logInternalError(`Graceful shutdown failure (${signal})`, error);
            process.exit(1);
        }
    };

    process.on("SIGTERM", () => shutdownHandler("SIGTERM"));
    process.on("SIGINT", () => shutdownHandler("SIGINT"));
};

const startServer = async () => {
    await connectDB();

    return new Promise((resolve, reject) => {
        const server = app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            setupShutdownHandlers(server);
            resolve(server);
        });
        server.once("error", reject);
    });
};

if (require.main === module) {
    startServer().catch((error) => {
        logInternalError("Server startup", error);
        process.exitCode = 1;
    });
}

module.exports = { app, startServer, setupShutdownHandlers };