"use client";
import React, { useEffect, useState, useRef } from "react";
import type { Playbook } from "../../lib/parse/schemas";
import { ParseErrorDisplay } from "./parse-error-display";
import { Button } from "@/components/ui/button";
import { X, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { Progress } from "@/components/ui/progress";

interface ProgressData {
  percent?: number;
  chunk?: number;
  totalChunks?: number;
  characters?: number;
  lines?: number;
  avgChunkTime?: number;
  estimatedRemaining?: number;
  message?: string;
}

interface SessionData {
  sessionId?: string;
  totalChunks?: number;
  playbookId?: string;
}

export function ParseProgress({ uploadId }: { uploadId: string }) {
  const router = useRouter();
  const [events, setEvents] = useState<string[]>([]);
  const [error, setError] = useState<{ message: string; code?: string } | null>(
    null
  );
  const [complete, setComplete] = useState<boolean>(false);
  const [playbook, setPlaybook] = useState<Playbook | null>(null);
  const [parsing, setParsing] = useState<boolean>(true);
  const [progressData, setProgressData] = useState<ProgressData>({});
  const [sessionData, setSessionData] = useState<SessionData>({});
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
              // Play is already saved to database by the parse route
            } else if (evt === "progress") {
              // T019: Update progress display with detailed information
              setProgressData(data);
            } else if (evt === "session_created") {
              // Capture session information for display
              setSessionData(data);
              setEvents((prev) => [
                ...prev,
                `📋 Session created: ${data?.sessionId?.slice(0, 8)}...`,
              ]);
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
    <div className="space-y-4">
      {parsing && !complete && !error && (
        <>
          {/* Session info banner (only for incremental parsing) */}
          {sessionData.sessionId && (
            <div className="rounded-md bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-3">
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <p className="text-xs font-medium text-blue-900 dark:text-blue-100">
                    Parsing Session Active
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 font-mono mt-1">
                    {sessionData.sessionId.slice(0, 16)}...
                  </p>
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-400">
                  {sessionData.totalChunks} chunks
                </div>
              </div>
            </div>
          )}

          {/* Progress bar and details */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">
                {progressData.chunk && progressData.totalChunks
                  ? `Chunk ${progressData.chunk}/${progressData.totalChunks}`
                  : "Parsing..."}
              </span>
              <span className="text-muted-foreground">
                {progressData.percent ?? 0}%
              </span>
            </div>
            <Progress value={progressData.percent ?? 0} className="h-2" />

            {/* Detailed progress information */}
            <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
              {progressData.characters !== undefined && (
                <div>
                  <span className="font-medium">{progressData.characters}</span>{" "}
                  characters found
                </div>
              )}
              {progressData.lines !== undefined && (
                <div>
                  <span className="font-medium">{progressData.lines}</span>{" "}
                  lines parsed
                </div>
              )}
              {progressData.estimatedRemaining !== undefined &&
                progressData.estimatedRemaining > 0 && (
                  <div className="col-span-2">
                    ETA:{" "}
                    <span className="font-medium">
                      {Math.ceil(progressData.estimatedRemaining / 1000)}s
                    </span>{" "}
                    remaining
                  </div>
                )}
            </div>

            {progressData.message && (
              <p className="text-xs text-muted-foreground">
                {progressData.message}
              </p>
            )}
          </div>

          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={cancelParsing}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          </div>
        </>
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
          <Button
            onClick={() => router.push(`/play/${playbook.id}`)}
            className="mt-2"
          >
            View Play
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
