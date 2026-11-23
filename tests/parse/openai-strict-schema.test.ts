import { parsePlayStructure } from "@/jobs/parse/llm-parser";
import { parsePlayIncrementally } from "@/jobs/parse/incremental/parser";

type JsonSchema = { type?: unknown; properties?: Record<string, JsonSchema>; required?: string[]; items?: JsonSchema; anyOf?: JsonSchema[]; [k: string]: unknown };

const SCENE = "ACTE I\nSCÈNE I\nARGAN, seul.\nTrois et deux font cinq.\n";

function findResponseFormat(body: unknown): { strict?: boolean; schema: JsonSchema } | undefined {
    if (!body || typeof body !== "object") return undefined;
    const node = body as Record<string, unknown>;
    const schema = node.schema as JsonSchema | undefined;
    if (schema && schema.type === "object" && schema.properties) return node as { strict?: boolean; schema: JsonSchema };
    for (const value of Object.values(node)) {
        const found = findResponseFormat(value);
        if (found) return found;
    }
    return undefined;
}

// OpenAI only guarantees schema-conforming answers in strict mode, and strict mode rejects
// any object that does not list all its properties in `required`.
function rejectionReasons(body: unknown): string[] {
    const format = findResponseFormat(body);
    if (!format) return ["no json_schema response format in the request"];
    if (!format.strict) return ["strict mode is off: answers are not guaranteed to match the schema"];
    return strictViolations(format.schema);
}

// OpenAI strict structured outputs: every object lists all its properties in `required`.
function strictViolations(schema: JsonSchema, path = "$"): string[] {
    const own = schema.properties
        ? Object.keys(schema.properties).filter((k) => !(schema.required ?? []).includes(k)).map((k) => `${path}.${k}`)
        : [];
    const children = [
        ...Object.entries(schema.properties ?? {}).map(([k, v]) => strictViolations(v, `${path}.${k}`)),
        ...(schema.items ? [strictViolations(schema.items, `${path}[]`)] : []),
        ...(schema.anyOf ?? []).map((v) => strictViolations(v, path)),
    ];
    return [...own, ...children.flat()];
}

async function captureOpenAIRequest(call: () => Promise<unknown>): Promise<unknown> {
    let body: unknown;
    const realFetch = globalThis.fetch;
    globalThis.fetch = (async (_url: unknown, init?: RequestInit) => {
        body = JSON.parse(String(init?.body));
        return new Response(JSON.stringify({ error: { message: "stubbed", type: "invalid_request_error" } }), {
            status: 400,
            headers: { "content-type": "application/json" },
        });
    }) as typeof fetch;
    try {
        await call().catch(() => undefined);
    } finally {
        globalThis.fetch = realFetch;
    }
    return body;
}

describe("structured output sent to OpenAI", () => {
    beforeAll(() => {
        process.env.OPENAI_API_KEY = "test-key";
    });

    it("full-play parsing sends a strict schema OpenAI accepts", async () => {
        const body = await captureOpenAIRequest(() => parsePlayStructure(SCENE, "openai"));
        expect(rejectionReasons(body)).toEqual([]);
    });

    it("incremental parsing sends a strict schema OpenAI accepts", async () => {
        const body = await captureOpenAIRequest(async () => {
            for await (const step of parsePlayIncrementally(SCENE, "openai")) void step;
        });
        expect(rejectionReasons(body)).toEqual([]);
    });
});
