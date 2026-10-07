const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");
const userRoutes       = require("./routes/userRoutes");
const authRoutes        = require("./routes/authRoutes");
const aiRoutes          = require("./routes/aiRoutes");
const vitalRoutes       = require("./routes/vitalRoutes");
const medicationRoutes  = require("./routes/medicationRoutes");
const reminderRoutes    = require("./routes/reminderRoutes");
const recordRoutes      = require("./routes/recordRoutes");

const app = express();

app.use(cors());
app.use(express.json());
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
        console.error("Server startup failed:", error.message);
        process.exitCode = 1;
    });
}

module.exports = { app, startServer };