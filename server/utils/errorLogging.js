const logInternalError = (context, error) => {
    const errorName = typeof error?.name === "string" ? error.name : "Error";
    const errorCode = typeof error?.code === "string" || typeof error?.code === "number"
        ? ` (${error.code})`
        : "";
    const errorMessage = error?.message ? `: ${error.message}` : "";
    const diagnostics = error?.diagnostics ? ` | diagnostics: ${JSON.stringify(error.diagnostics)}` : "";

    console.error(`[${context}] ${errorName}${errorCode}${errorMessage}${diagnostics}`);
};

module.exports = { logInternalError };
