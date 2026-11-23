import { z } from "zod";
import { strictOutputSchema } from "@/jobs/parse/strict-output-schema";

const Character = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
});
const Result = z.object({
    title: z.string().optional(),
    characters: z.array(Character),
});

type Node = { properties?: Record<string, Node>; required?: string[]; items?: Node; anyOf?: Node[]; type?: unknown };

describe("strictOutputSchema", () => {
    const schema = strictOutputSchema(Result);

    it("lists every property as required, optional ones accepting null", async () => {
        const json = (await schema.jsonSchema) as Node;
        expect(json.required).toEqual(["title", "characters"]);
        expect(json.properties!.title.anyOf).toContainEqual({ type: "null" });
        const item = json.properties!.characters.items!;
        expect(item.required).toEqual(["id", "name", "description"]);
        expect(item.properties!.description.anyOf).toContainEqual({ type: "null" });
        expect(item.properties!.id.anyOf).toBeUndefined();
    });

    it("turns null answers into absent fields of the original schema", async () => {
        const result = await schema.validate!({ title: null, characters: [{ id: "argan", name: "ARGAN", description: null }] });
        expect(result).toEqual({ success: true, value: { characters: [{ id: "argan", name: "ARGAN" }] } });
    });

    it("still rejects answers the original schema rejects", async () => {
        const result = await schema.validate!({ title: null, characters: [{ id: "argan", name: null, description: null }] });
        expect(result.success).toBe(false);
    });
});
