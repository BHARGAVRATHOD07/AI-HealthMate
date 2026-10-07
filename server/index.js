const express = require("express");
const cors = require("cors");
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

app.use(cors());
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

const startServer = async () => {
    await connectDB();

    return new Promise((resolve, reject) => {
        const server = app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
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

module.exports = { app, startServer };