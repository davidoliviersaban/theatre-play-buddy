"use client";
import React, { useEffect, useState, useRef, useCallback, memo } from "react";
import type { Playbook } from "@/lib/play/schemas";
import { ParseErrorDisplay } from "./parse-error-display";
import { Button } from "@/components/ui/button";
import { X, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { Progress } from "@/components/ui/progress";

import {
  formatEta,
  parseSSEChunk,
  type ProgressData,
  type SessionData,
} from "./parse-progress.utils";

// ----------------------------
// Subcomponents
// ----------------------------

const SessionBanner = memo(function SessionBanner({
  session,
}: {
  session: SessionData;
}) {
  if (!session.sessionId) return null;
  return (
    <div className="rounded-md bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-3">
      <div className="flex items-start gap-2">
        <div className="flex-1">
          <p className="text-xs font-medium text-blue-900 dark:text-blue-100">
            Parsing Session Active
          </p>
          <p className="text-xs text-blue-700 dark:text-blue-300 font-mono mt-1">
            {session.sessionId.slice(0, 16)}...
          </p>
        </div>
        <div className="text-xs text-blue-600 dark:text-blue-400">
          {session.totalChunks} chunks
        </div>
      </div>
    </div>
  );
});

const ProgressDetails = memo(function ProgressDetails({
  progress,
}: {
  progress: ProgressData;
}) {
  const percent = progress.percent ?? 0;
  const label =
    progress.chunk && progress.totalChunks
      ? `Chunk ${progress.chunk}/${progress.totalChunks}`
      : "Parsing...";

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">{percent}%</span>
      </div>
      <Progress value={percent} className="h-2" />

      <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
        {progress.characters !== undefined && (
          <div>
            <span className="font-medium">{progress.characters}</span>{" "}
            characters found
          </div>
        )}
        {progress.lines !== undefined && (
          <div>
            <span className="font-medium">{progress.lines}</span> lines parsed
          </div>
        )}
        {progress.estimatedRemaining !== undefined &&
          progress.estimatedRemaining > 0 && (
            <div className="col-span-2">
              ETA:{" "}
              <span className="font-medium">
                {formatEta(progress.estimatedRemaining)}
              </span>{" "}
              remaining
            </div>
          )}
      </div>

      {progress.message && (
        <p className="text-xs text-muted-foreground">{progress.message}</p>
      )}
    </div>
  );
});

const EventsList = memo(function EventsList({ events }: { events: string[] }) {
  if (events.length === 0) return null;
  return (
    <ul className="text-sm">
      {events.map((e, i) => (
        <li key={i}>{e}</li>
      ))}
    </ul>
  );
});

const CompletionSection = memo(function CompletionSection({
  playbook,
  onView,
}: {
  playbook: Playbook;
  onView: () => void;
}) {
  return (
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
      <Button onClick={onView} className="mt-2">
        View Play
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
});

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

  const startParsing = useCallback(() => {
    setError(null);
    setEvents([]);
    setComplete(false);
    setPlaybook(null);
    setParsing(true);
  }, []);

  const cancelParsing = useCallback(() => {
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
          const parsedEvents = parseSSEChunk(parts.join("\n\n"));
          for (const { event: evt, data } of parsedEvents) {
            if (!evt) continue;
            if (evt === "error") {
              const d = data as { message?: string; code?: string } | null;
              setError({
                message: d?.message || "Unknown error",
                code: d?.code,
              });
            } else if (evt === "complete") {
              setComplete(true);
              setPlaybook(data as Playbook);
              const title = (data as Playbook | null)?.title || "Untitled";
              setEvents((prev) => [...prev, `✅ Complete: ${title}`]);
            } else if (evt === "progress") {
              setProgressData((data as ProgressData) ?? {});
            } else if (evt === "session_created") {
              const d = (data as SessionData) ?? {};
              setSessionData(d);
              const sid = d.sessionId
                ? `${d.sessionId.slice(0, 8)}...`
                : "unknown";
              setEvents((prev) => [...prev, `📋 Session created: ${sid}`]);
            } else {
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
          <SessionBanner session={sessionData} />
          <ProgressDetails progress={progressData} />

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
      <EventsList events={events} />
      {complete && playbook && (
        <CompletionSection
          playbook={playbook}
          onView={() => router.push(`/play/${playbook.id}`)}
        />
      )}
    </div>
  );
}
