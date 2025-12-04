// Utilities and shared types for ParseProgress component

export interface ProgressData {
    percent?: number;
    chunk?: number;
    totalChunks?: number;
    characters?: number;
    lines?: number;
    avgChunkTime?: number;
    estimatedRemaining?: number;
    message?: string;
}

export interface SessionData {
    sessionId?: string;
    totalChunks?: number;
    playbookId?: string;
}

export type ParsedEvent = {
    event?: string | null;
    data?: unknown;
};

// Parse a Server-Sent Events chunk into discrete {event, data} items
export function parseSSEChunk(chunk: string): ParsedEvent[] {
    const parts = chunk.split("\n\n");
    const events: ParsedEvent[] = [];
    for (const part of parts) {
        const lines = part.split("\n");
        const evtLine = lines.find((l) => l.startsWith("event:"));
        const dataLine = lines.find((l) => l.startsWith("data:"));
        const event = evtLine?.slice(6).trim() ?? null;
        const dataStr = dataLine?.slice(5).trim();
        let data: unknown = null;
        if (dataStr) {
            try {
                data = JSON.parse(dataStr);
            } catch {
                data = dataStr; // keep raw data string if JSON parse fails
            }
        }
        events.push({ event, data });
    }
    return events;
}

// Format ETA from milliseconds to a compact string
export function formatEta(ms?: number): string | null {
    if (!ms || ms <= 0) return null;
    const seconds = Math.ceil(ms / 1000);
    return `${seconds}s`;
}
