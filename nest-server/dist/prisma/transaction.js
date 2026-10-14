const DEFAULT_ATTEMPTS = 3;
function isSerializationFailure(err) {
    const code = err?.code;
    if (code === 'P2034')
        return true;
    const message = err instanceof Error ? err.message : String(err ?? '');
    return /could not serialize|serialization failure|\b40001\b/i.test(message);
}
export async function withSerializableRetry(prisma, fn, maxAttempts = DEFAULT_ATTEMPTS) {
    let lastError;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await prisma.$transaction((tx) => fn(tx), {
                isolationLevel: 'Serializable',
            });
        }
        catch (err) {
            lastError = err;
            if (attempt >= maxAttempts || !isSerializationFailure(err))
                throw err;
        }
    }
    throw lastError;
}
//# sourceMappingURL=transaction.js.map