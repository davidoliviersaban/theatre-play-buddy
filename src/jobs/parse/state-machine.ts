/**
 * State machine for job status transitions
 * Ensures only valid state transitions are allowed
 */

import type { JobStatus } from "@prisma/client";

/**
 * Valid state transitions for parse jobs
 * Key: current status
 * Value: array of allowed next statuses
 */
export const VALID_TRANSITIONS: Record<string, string[]> = {
  queued: ["running", "cancelled"],
  running: ["paused", "completed", "retrying", "failed", "cancelled"],
  paused: ["running", "cancelled"],
  retrying: ["running", "failed"],
  completed: [], // Final state
  failed: [], // Final state
  cancelled: [], // Final state
};

/**
 * Check if a state transition is valid
 */
export function canTransition(from: JobStatus, to: JobStatus): boolean {
  const allowed = VALID_TRANSITIONS[from];
  return allowed ? allowed.includes(to) : false;
}

/**
 * Assert that a state transition is valid, throw error if not
 */
export function assertTransition(from: JobStatus, to: JobStatus): void {
  if (!canTransition(from, to)) {
    // Keep legacy error message for test compatibility
    throw new Error(`Invalid transition: ${from} → ${to}`);
  }
}

/**
 * Check if a status is a final state (no further transitions allowed)
 */
export function isFinalState(status: JobStatus): boolean {
  return VALID_TRANSITIONS[status]?.length === 0;
}

/**
 * Get all allowed transitions from a given status
 */
export function getAllowedTransitions(status: JobStatus): JobStatus[] {
  return (VALID_TRANSITIONS[status] || []) as JobStatus[];
}
