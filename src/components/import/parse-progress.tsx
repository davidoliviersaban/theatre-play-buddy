"use client";
import React, { useEffect, useState, useRef } from "react";
import { saveImportedPlay } from "../../lib/play-storage";
import type { Playbook } from "../../lib/parse/schemas";
import { ParseErrorDisplay } from "./parse-error-display";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export function ParseProgress({ uploadId }: { uploadId: string }) {
  const [events, setEvents] = useState<string[]>([]);
  const [error, setError] = useState<{ message: string; code?: string } | null>(
    null
  );
  const [complete, setComplete] = useState<boolean>(false);
  const [playbook, setPlaybook] = useState<Playbook | null>(null);
  const [parsing, setParsing] = useState<boolean>(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  const startParsing = React.useCallback(() => {
    setError(null);
    setEvents([]);
    setComplete(false);
    setPlaybook(null);
    setParsing(true);
  }, []);

  const cancelParsing = React.useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setParsing(false);
      setEvents((prev) => [...prev, "⚠️ Parsing cancelled"]);
    }
  }, []);

  useEffect(() => {
    const ctrl = new AbortController();
    abortControllerRef.current = ctrl;
    async function run() {
      try {
        const res = await fetch("/import/api/parse", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ uploadId }),
          signal: ctrl.signal,
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j.error || `HTTP ${res.status}`);
        }
        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split("\n\n");
          buffer = parts.pop() || "";
          for (const part of parts) {
            const lines = part.split("\n");
            const evtLine = lines.find((l) => l.startsWith("event:"));
            const dataLine = lines.find((l) => l.startsWith("data:"));
            const evt = evtLine?.slice(6).trim();
            const data = dataLine ? JSON.parse(dataLine.slice(5).trim()) : null;
            if (evt === "error") {
              setError({
                message: data?.message || "Unknown error",
                code: data?.code,
              });
            } else if (evt === "complete") {
              setComplete(true);
              setPlaybook(data);
              setEvents((prev) => [
                ...prev,
                `✅ Complete: ${data?.title || "Untitled"}`,
              ]);
              // Persist to storage
              if (data) saveImportedPlay(data);
            } else if (evt) {
              setEvents((prev) => [...prev, `${evt}: ${JSON.stringify(data)}`]);
            }
          }
        }
        setParsing(false);
      } catch (err) {
        if ((err as Error).name === "AbortError") {
          // User cancelled - already handled
          return;
        }
        setError({ message: (err as Error).message });
        setParsing(false);
      }
    }
    run();
    return () => ctrl.abort();
  }, [uploadId]);

  return (
    <div className="space-y-2">
      {parsing && !complete && !error && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={cancelParsing}>
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
        </div>
      )}
      {error && (
        <ParseErrorDisplay
          error={error.message}
          code={error.code}
          onRetry={startParsing}
        />
      )}
      <ul className="text-sm">
        {events.map((e, i) => (
          <li key={i}>{e}</li>
        ))}
      </ul>
      {complete && playbook && (
        <div className="mt-4 space-y-2">
          <p className="text-sm text-green-600 font-semibold">
            ✅ Parsing complete!
          </p>
          <p className="text-sm">
            Imported: <strong>{playbook.title}</strong> by {playbook.author}
          </p>
          <p className="text-sm text-muted-foreground">
            {playbook.characters.length} characters, {playbook.acts.length} acts
          </p>
        </div>
      )}
    </div>
  );
}
