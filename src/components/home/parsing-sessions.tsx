"use client";
import React from "react";
import { Clock, AlertCircle, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { Play as PlayIcon } from "lucide-react";

interface ParsingSession {
  id: string;
  filename: string;
  status:
    | "pending"
    | "warming"
    | "parsing"
    | "completed"
    | "failed"
    | "aborted";
  currentChunk: number;
  totalChunks: number;
  startedAt: string;
  failureReason?: string;
  // Parsing state
  title?: string;
  author?: string;
  totalCharacters: number;
  totalActs: number;
  totalScenes: number;
  totalLines: number;
  currentActIndex?: number;
  currentSceneIndex?: number;
  currentLineIndex?: number;
  currentCharacters: string[];
}

export function ParsingSessions({ sessions }: { sessions: ParsingSession[] }) {
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  const ongoing = sessions.filter((s) =>
    ["pending", "warming", "parsing"].includes(s.status)
  );

  const failed = sessions.filter((s) =>
    ["failed", "aborted"].includes(s.status)
  );

  const handleDelete = async (sessionId: string) => {
    setDeletingId(sessionId);
    try {
      await fetch(`/api/import/sessions/${sessionId}`, {
        method: "DELETE",
      });
      // Refresh the page to update the list
      window.location.reload();
    } catch (error) {
      console.error("Failed to delete session:", error);
      setDeletingId(null);
    }
  };

  const [restartingId, setRestartingId] = React.useState<string | null>(null);
  const handleRestart = async (sessionId: string) => {
    setRestartingId(sessionId);
    try {
      const res = await fetch(`/api/import/sessions/${sessionId}/restart`, {
        method: "POST",
      });
      if (!res.ok) {
        throw new Error("Failed to restart session");
      }
      // Reload to reflect the new pending status
      window.location.reload();
    } catch (error) {
      console.error("Failed to restart session:", error);
      setRestartingId(null);
    }
  };

  const [continuingId, setContinuingId] = React.useState<string | null>(null);
  const handleContinue = async (sessionId: string) => {
    setContinuingId(sessionId);
    try {
      const res = await fetch(`/api/import/sessions/${sessionId}/continue`, {
        method: "POST",
      });
      if (!res.ok) {
        throw new Error("Failed to continue session");
      }
      // Reload to reflect status change
      window.location.reload();
    } catch (error) {
      console.error("Failed to continue session:", error);
      setContinuingId(null);
    }
  };

  if (ongoing.length === 0 && failed.length === 0) {
    return null;
  }

  return (
    <div className="mb-8 space-y-4">
      {/* Ongoing Imports */}
      {ongoing.length > 0 && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" />
            <h2 className="text-sm font-semibold text-blue-900 dark:text-blue-100">
              Ongoing Imports ({ongoing.length})
            </h2>
          </div>
          <div className="space-y-2">
            {ongoing.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between rounded-md bg-white dark:bg-blue-900 p-3 text-sm"
              >
                <div className="flex-1">
                  <p className="font-medium text-blue-900 dark:text-blue-100">
                    {session.filename}
                  </p>
                  <div className="mt-1 flex items-center gap-3 text-xs text-blue-700 dark:text-blue-300">
                    <span className="font-mono">
                      {session.currentChunk}/{session.totalChunks} chunks
                    </span>
                    <span>•</span>
                    <span>
                      {Math.round(
                        (session.currentChunk / session.totalChunks) * 100
                      )}
                      % complete
                    </span>
                    <span>•</span>
                    <button
                      className="underline hover:no-underline"
                      onClick={() =>
                        setExpandedId((prev) =>
                          prev === session.id ? null : session.id
                        )
                      }
                    >
                      {expandedId === session.id ? "Hide logs" : "Show logs"}
                    </button>
                  </div>
                  {expandedId === session.id && (
                    <div className="mt-2 rounded-md bg-blue-50/60 dark:bg-blue-950/40 p-2">
                      <ul className="space-y-1 text-xs text-blue-800 dark:text-blue-200">
                        <li>
                          🟦 Started:{" "}
                          {new Date(session.startedAt).toLocaleString()}
                        </li>
                        <li>🟦 Status: {session.status ?? "pending"}</li>
                        {session.title && (
                          <li>
                            🟦 Play: {session.title}
                            {session.author ? ` by ${session.author}` : ""}
                          </li>
                        )}
                        <li>
                          🟦 Progress: Chunk {session.currentChunk} /{" "}
                          {session.totalChunks} (
                          {Math.round(
                            (session.currentChunk /
                              Math.max(session.totalChunks, 1)) *
                              100
                          )}
                          %)
                        </li>
                        {(session.currentActIndex !== undefined ||
                          session.currentSceneIndex !== undefined ||
                          session.currentLineIndex !== undefined) && (
                          <li>
                            🟦 Current position:{" "}
                            {session.currentActIndex !== undefined &&
                              `Act ${session.currentActIndex + 1}`}
                            {session.currentSceneIndex !== undefined &&
                              ` / Scene ${session.currentSceneIndex + 1}`}
                            {session.currentLineIndex !== undefined &&
                              ` / Line ${session.currentLineIndex + 1}`}
                          </li>
                        )}
                        {session.currentCharacters.length > 0 && (
                          <li>
                            🟦 Current characters:{" "}
                            {session.currentCharacters.join(", ")}
                          </li>
                        )}
                        {(session.totalCharacters > 0 ||
                          session.totalActs > 0 ||
                          session.totalScenes > 0 ||
                          session.totalLines > 0) && (
                          <li>
                            🟦 Discovered: {session.totalCharacters} characters,{" "}
                            {session.totalActs} acts, {session.totalScenes}{" "}
                            scenes, {session.totalLines} lines
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <span className="text-xs text-blue-600 dark:text-blue-400">
                    {new Date(session.startedAt).toLocaleTimeString()}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleContinue(session.id)}
                    disabled={continuingId === session.id}
                    className="text-blue-700 hover:text-blue-800 dark:text-blue-300"
                  >
                    {continuingId === session.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <PlayIcon className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRestart(session.id)}
                    disabled={restartingId === session.id}
                    className="text-blue-700 hover:text-blue-800 dark:text-blue-300"
                    title="Start over"
                  >
                    {restartingId === session.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Failed Imports */}
      {failed.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950 p-4">
          <div className="mb-3 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
            <h2 className="text-sm font-semibold text-red-900 dark:text-red-100">
              Failed Imports ({failed.length})
            </h2>
          </div>
          <div className="space-y-2">
            {failed.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between rounded-md bg-white dark:bg-red-900 p-3 text-sm"
              >
                <div className="flex-1">
                  <p className="font-medium text-red-900 dark:text-red-100">
                    {session.filename}
                  </p>
                  {session.failureReason && (
                    <p className="mt-1 text-xs text-red-700 dark:text-red-300">
                      {session.failureReason.slice(0, 100)}
                      {session.failureReason.length > 100 ? "..." : ""}
                    </p>
                  )}
                  <div className="mt-1 flex items-center gap-3 text-xs text-red-600 dark:text-red-400">
                    <span>
                      Failed at chunk {session.currentChunk}/
                      {session.totalChunks}
                    </span>
                    <span>•</span>
                    <span>{new Date(session.startedAt).toLocaleString()}</span>
                    <span>•</span>
                    <button
                      className="underline hover:no-underline"
                      onClick={() =>
                        setExpandedId((prev) =>
                          prev === session.id ? null : session.id
                        )
                      }
                    >
                      {expandedId === session.id ? "Hide logs" : "Show logs"}
                    </button>
                  </div>
                  {expandedId === session.id && (
                    <div className="mt-2 rounded-md bg-red-50/60 dark:bg-red-950/40 p-2">
                      <ul className="space-y-1 text-xs text-red-800 dark:text-red-200">
                        <li>
                          🟥 Started:{" "}
                          {new Date(session.startedAt).toLocaleString()}
                        </li>
                        <li>🟥 Status: {session.status ?? "failed"}</li>
                        {session.title && (
                          <li>
                            🟥 Play: {session.title}
                            {session.author ? ` by ${session.author}` : ""}
                          </li>
                        )}
                        <li>
                          🟥 Last progress: Chunk {session.currentChunk} /{" "}
                          {session.totalChunks}
                        </li>
                        {(session.currentActIndex !== undefined ||
                          session.currentSceneIndex !== undefined ||
                          session.currentLineIndex !== undefined) && (
                          <li>
                            🟥 Last position:{" "}
                            {session.currentActIndex !== undefined &&
                              `Act ${session.currentActIndex + 1}`}
                            {session.currentSceneIndex !== undefined &&
                              ` / Scene ${session.currentSceneIndex + 1}`}
                            {session.currentLineIndex !== undefined &&
                              ` / Line ${session.currentLineIndex + 1}`}
                          </li>
                        )}
                        {session.currentCharacters.length > 0 && (
                          <li>
                            🟥 Last characters:{" "}
                            {session.currentCharacters.join(", ")}
                          </li>
                        )}
                        {(session.totalCharacters > 0 ||
                          session.totalActs > 0 ||
                          session.totalScenes > 0 ||
                          session.totalLines > 0) && (
                          <li>
                            🟥 Parsed before failure: {session.totalCharacters}{" "}
                            characters, {session.totalActs} acts,{" "}
                            {session.totalScenes} scenes, {session.totalLines}{" "}
                            lines
                          </li>
                        )}
                        {session.failureReason && (
                          <li>🟥 Reason: {session.failureReason}</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(session.id)}
                  disabled={deletingId === session.id}
                  className="text-red-600 hover:text-red-700 dark:text-red-400"
                >
                  {deletingId === session.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleContinue(session.id)}
                  disabled={continuingId === session.id}
                  className="text-red-700 hover:text-red-800 dark:text-red-300"
                >
                  {continuingId === session.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <PlayIcon className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRestart(session.id)}
                  disabled={restartingId === session.id}
                  className="text-red-700 hover:text-red-800 dark:text-red-300"
                  title="Start over"
                >
                  {restartingId === session.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
