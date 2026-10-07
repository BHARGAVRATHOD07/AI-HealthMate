const logInternalError = (context, error) => {
    const errorName = typeof error?.name === "string" ? error.name : "Error";
    const errorCode = typeof error?.code === "string" || typeof error?.code === "number"
        ? ` (${error.code})`
        : "";

    console.error(`[${context}] ${errorName}${errorCode}`);
};

module.exports = { logInternalError };
