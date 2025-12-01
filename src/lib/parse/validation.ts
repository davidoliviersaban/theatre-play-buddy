import { PlaybookSchema, type Playbook } from "./schemas";

export function validatePlaybook(obj: unknown): { valid: true; data: Playbook } | { valid: false; error: string } {
    const result = PlaybookSchema.safeParse(obj);
    if (result.success) return { valid: true, data: result.data };
    return { valid: false, error: result.error.message };
}
