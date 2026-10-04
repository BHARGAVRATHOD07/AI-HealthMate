const { GoogleGenerativeAI } = require("@google/generative-ai");

// ─── System Prompt ─────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are AI HealthMate, a friendly and knowledgeable health information assistant integrated into a patient health management dashboard.

Your role:
- Help patients understand their health data, vitals, medications, and lab results
- Provide clear, empathetic, and accurate health information
- Answer questions about symptoms, general wellness, nutrition, and lifestyle
- Help interpret medical terminology in plain language
- Remind users to follow their medication schedules and doctor's advice
- Encourage healthy habits and preventive care

Your personality:
- Warm, supportive, and non-judgmental
- Professional but approachable
- Use simple language, avoid excessive jargon
- Use formatting like **bold**, bullet points, and numbered lists for clarity

Critical rules you MUST follow:
- ALWAYS include a disclaimer when discussing symptoms or diagnoses: remind users to consult their doctor
- NEVER diagnose medical conditions or prescribe treatments
- NEVER suggest stopping or changing prescribed medications
- If someone describes a medical emergency (chest pain, stroke symptoms, severe bleeding), immediately direct them to call emergency services (911)
- You can reference general health ranges (e.g., normal blood pressure is <120/80 mmHg) but never interpret the user's specific personal results as if you are their doctor
- Keep responses concise but complete — aim for 150-300 words unless the topic requires more detail
- Always end responses with an offer to help further or a relevant follow-up suggestion

Format responses using markdown when helpful (bold key terms, use bullet lists for multiple items).`;

// Helper for retrying transient errors like 503 (high demand)
const callWithRetry = async (fn, maxRetries = 2, delayMs = 1000) => {
    let lastErr;
    for (let i = 0; i <= maxRetries; i++) {
        try {
            return await fn();
        } catch (err) {
            lastErr = err;
            if ((err.message?.includes("503") || err.message?.includes("high demand") || err.status === 503) && i < maxRetries) {
                await new Promise(r => setTimeout(r, delayMs * (i + 1)));
                continue;
            }
            throw err;
        }
    }
    throw lastErr;
};

// ─── POST /api/ai/chat ─────────────────────────────────────────────────────────
const chat = async (req, res) => {
    try {
        if (!process.env.GEMINI_API_KEY) {
            return res.status(503).json({
                success: false,
                message: "AI service is not configured. Please add GEMINI_API_KEY to the server environment."
            });
        }

        const { message, history } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({
                success: false,
                message: "Message is required."
            });
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({
            model: "gemini-3.8-flash",
            systemInstruction: SYSTEM_PROMPT
        });

        // Format prior history for Gemini startChat
        const formattedHistory = Array.isArray(history)
            ? history
                .filter(msg => msg.text && (msg.sender === "user" || msg.sender === "ai" || msg.sender === "bot" || msg.role))
                .map(msg => ({
                    role: (msg.sender === "user" || msg.role === "user") ? "user" : "model",
                    parts: [{ text: msg.text }]
                }))
            : [];

        const chatSession = model.startChat({
            history: formattedHistory,
            generationConfig: {
                maxOutputTokens: 1024,
                temperature: 0.7,
            }
        });

        // Send user message with retry for transient 503s
        const result = await callWithRetry(() => chatSession.sendMessage(message.trim()));
        const responseText = result.response.text();

        res.status(200).json({
            success: true,
            data: {
                reply: responseText,
                model: "gemini-3.8-flash",
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error("Gemini AI Error:", error.message);

        if (error.message?.includes("API_KEY_INVALID") || error.message?.includes("API key")) {
            return res.status(401).json({
                success: false,
                message: "Invalid Gemini API key. Please check your GEMINI_API_KEY configuration."
            });
        }

        if (error.message?.includes("quota") || error.message?.includes("RESOURCE_EXHAUSTED")) {
            return res.status(429).json({
                success: false,
                message: "AI service rate limit reached. Please wait a moment and try again."
            });
        }

        if (error.message?.includes("SAFETY")) {
            return res.status(400).json({
                success: false,
                message: "Your message was flagged by safety filters. Please rephrase and try again."
            });
        }

        res.status(500).json({
            success: false,
            message: "AI service temporarily unavailable. Please try again.",
            error: error.message
        });
    }
};

module.exports = { chat };
