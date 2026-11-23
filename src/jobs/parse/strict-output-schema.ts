import { jsonSchema, type JSONSchema7, type Schema } from "ai";
import { z } from "zod";

type JSONSchema7Definition = JSONSchema7 | boolean;

// OpenAI strict structured outputs: every property required, optional ones expressed as "value or null" (#2).
export function strictOutputSchema<T>(schema: z.ZodType<T>): Schema<T> {
    const { $schema: _ignored, ...raw } = z.toJSONSchema(schema) as JSONSchema7;
    return jsonSchema<T>(toStrict(raw), {
        validate: (value) => {
            const parsed = schema.safeParse(dropNulls(value));
            return parsed.success ? { success: true, value: parsed.data } : { success: false, error: parsed.error };
        },
    });
}

function toStrict(node: JSONSchema7Definition): JSONSchema7 {
    if (typeof node === "boolean") return {};
    const strict: JSONSchema7 = { ...node };
    if (node.properties) {
        const required = new Set(node.required ?? []);
        strict.properties = Object.fromEntries(
            Object.entries(node.properties).map(([key, child]) => [
                key,
                required.has(key) ? toStrict(child) : { anyOf: [toStrict(child), { type: "null" }] },
            ]),
        );
        strict.required = Object.keys(node.properties);
        strict.additionalProperties = false;
    }
    if (node.items && !Array.isArray(node.items)) strict.items = toStrict(node.items);
    if (node.anyOf) strict.anyOf = node.anyOf.map(toStrict);
    return strict;
}

function dropNulls(value: unknown): unknown {
    if (Array.isArray(value)) return value.map(dropNulls);
    if (value && typeof value === "object") {
        return Object.fromEntries(
            Object.entries(value).filter(([, v]) => v !== null).map(([k, v]) => [k, dropNulls(v)]),
        );
    }
    return value;
}
