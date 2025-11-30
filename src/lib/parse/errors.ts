export class ParseError extends Error {
    constructor(
        message: string,
        public code: string,
        public statusCode: number = 500
    ) {
        super(message);
        this.name = "ParseError";
    }
}

export class ValidationError extends ParseError {
    constructor(message: string) {
        super(message, "VALIDATION_ERROR", 400);
        this.name = "ValidationError";
    }
}

export class ExtractionError extends ParseError {
    constructor(message: string) {
        super(message, "EXTRACTION_ERROR", 500);
        this.name = "ExtractionError";
    }
}

export class LLMError extends ParseError {
    constructor(message: string) {
        super(message, "LLM_ERROR", 500);
        this.name = "LLMError";
    }
}

export function errorResponse(error: unknown): { error: string; code?: string } {
    if (error instanceof ParseError) {
        return { error: error.message, code: error.code };
    }
    if (error instanceof Error) {
        return { error: error.message };
    }
    return { error: "Unknown error occurred" };
}
