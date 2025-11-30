import { NextRequest } from "next/server";

declare global {
    var __uploadBuffers: Map<string, Buffer> | undefined;
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
        return new Response(JSON.stringify({ error: "Invalid content type" }), { status: 400 });
    }
    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
        return new Response(JSON.stringify({ error: "Missing file" }), { status: 400 });
    }
    const allowed = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"];
    if (!allowed.includes(file.type)) {
        return new Response(JSON.stringify({ error: "Unsupported file type" }), { status: 415 });
    }
    // In-memory demo: return an uploadId based on time. Persisting to disk/storage could be added later.
    const uploadId = `upl_${Date.now()}`;
    const arrayBuffer = await file.arrayBuffer();
    // For parse route, we will temporarily store file buffer in a global Map keyed by uploadId
    // WARNING: This is dev-only; replace with proper storage for production.
    globalThis.__uploadBuffers = globalThis.__uploadBuffers || new Map<string, Buffer>();
    globalThis.__uploadBuffers.set(uploadId, Buffer.from(arrayBuffer));

    return new Response(JSON.stringify({ uploadId, filename: file.name, size: file.size }), {
        headers: { "content-type": "application/json" },
    });
}
