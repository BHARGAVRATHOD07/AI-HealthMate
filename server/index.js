const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const authRoutes = require("./routes/authRoutes");
const aiRoutes   = require("./routes/aiRoutes");

const app = express();

connectDB();

app.use(cors());
app.use(express.json());
app.use("/api/users", userRoutes);
app.use("/api/auth",  authRoutes);
app.use("/api/ai",    aiRoutes);


app.get("/", (req, res) => {
    res.json({
        message: "AI HealthMate Backend is running"
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});