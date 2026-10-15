const mongoose = require("mongoose");

const connectDB = async () => {
    if (!process.env.MONGODB_URI) {
        throw new Error("MONGODB_URI is not defined in the server environment.");
    }

    try {
        await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
        console.log("MongoDB connected successfully");
    } catch (primaryErr) {
        console.warn(`Primary MongoDB connection failed (${primaryErr.message}). Falling back to local MongoDB...`);
        const localUri = process.env.LOCAL_MONGODB_URI || "mongodb://127.0.0.1:27017/ai-healthmate";
        await mongoose.connect(localUri, { serverSelectionTimeoutMS: 5000 });
        console.log(`Connected to fallback MongoDB at ${localUri} successfully`);
    }
};

module.exports = connectDB;