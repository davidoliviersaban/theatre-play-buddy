"use client";
import { useSyncExternalStore } from "react";
import { getDailyStatsForPlay } from "@/lib/play-storage";

export function DailyStatsTable({ playId }: { playId: string }) {
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const stats = isClient ? getDailyStatsForPlay(playId) : [];

  if (!stats.length) {
    return (
      <div className="p-4 text-muted-foreground">
        No daily statistics available yet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="px-2 py-1 text-left">Date</th>
            <th className="px-2 py-1 text-left">Lines Rehearsed</th>
            <th className="px-2 py-1 text-left">Accuracy</th>
            <th className="px-2 py-1 text-left">Hints Used</th>
            <th className="px-2 py-1 text-left">Sessions</th>
          </tr>
        </thead>
        <tbody>
          {stats.map((day) => (
            <tr key={day.date} className="border-b">
              <td className="px-2 py-1">{day.date}</td>
              <td className="px-2 py-1">{day.linesRehearsed}</td>
              <td className="px-2 py-1">{day.accuracy}%</td>
              <td className="px-2 py-1">{day.hintsUsed}</td>
              <td className="px-2 py-1">{day.totalSessions}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
