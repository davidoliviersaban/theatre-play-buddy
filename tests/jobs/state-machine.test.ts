/**
 * Unit tests for job state machine
 */

import {
  canTransition,
  assertTransition,
  isFinalState,
  getAllowedTransitions,
  VALID_TRANSITIONS,
} from "../../src/jobs/state-machine";

describe("Job State Machine", () => {
  describe("canTransition", () => {
    it("should allow valid transitions from queued", () => {
      expect(canTransition("queued" as any, "running" as any)).toBe(true);
      expect(canTransition("queued" as any, "cancelled" as any)).toBe(true);
    });

    it("should reject invalid transitions from queued", () => {
      expect(canTransition("queued" as any, "completed" as any)).toBe(false);
      expect(canTransition("queued" as any, "failed" as any)).toBe(false);
      expect(canTransition("queued" as any, "paused" as any)).toBe(false);
    });

    it("should allow valid transitions from running", () => {
      expect(canTransition("running" as any, "paused" as any)).toBe(true);
      expect(canTransition("running" as any, "completed" as any)).toBe(true);
      expect(canTransition("running" as any, "retrying" as any)).toBe(true);
      expect(canTransition("running" as any, "failed" as any)).toBe(true);
      expect(canTransition("running" as any, "cancelled" as any)).toBe(true);
    });

    it("should reject invalid transitions from running", () => {
      expect(canTransition("running" as any, "queued" as any)).toBe(false);
    });

    it("should allow valid transitions from paused", () => {
      expect(canTransition("paused" as any, "running" as any)).toBe(true);
      expect(canTransition("paused" as any, "cancelled" as any)).toBe(true);
    });

    it("should allow valid transitions from retrying", () => {
      expect(canTransition("retrying" as any, "running" as any)).toBe(true);
      expect(canTransition("retrying" as any, "failed" as any)).toBe(true);
    });

    it("should reject all transitions from final states", () => {
      const finalStates = ["completed", "failed", "cancelled"];
      const allStates = Object.keys(VALID_TRANSITIONS);

      for (const finalState of finalStates) {
        for (const targetState of allStates) {
          expect(canTransition(finalState as any, targetState as any)).toBe(false);
        }
      }
    });
  });

  describe("assertTransition", () => {
    it("should not throw for valid transitions", () => {
      expect(() => assertTransition("queued" as any, "running" as any)).not.toThrow();
      expect(() => assertTransition("running" as any, "completed" as any)).not.toThrow();
      expect(() => assertTransition("paused" as any, "running" as any)).not.toThrow();
    });

    it("should throw for invalid transitions", () => {
      expect(() => assertTransition("queued" as any, "completed" as any)).toThrow(
        /Invalid job status transition/
      );
      expect(() => assertTransition("completed" as any, "running" as any)).toThrow(
        /Invalid job status transition/
      );
      expect(() => assertTransition("failed" as any, "running" as any)).toThrow(
        /Invalid job status transition/
      );
    });

    it("should include helpful error message", () => {
      expect(() => assertTransition("queued" as any, "completed" as any)).toThrow(
        /queued → completed/
      );
      expect(() => assertTransition("queued" as any, "completed" as any)).toThrow(
        /Allowed transitions from queued/
      );
    });
  });

  describe("isFinalState", () => {
    it("should return true for final states", () => {
      expect(isFinalState("completed" as any)).toBe(true);
      expect(isFinalState("failed" as any)).toBe(true);
      expect(isFinalState("cancelled" as any)).toBe(true);
    });

    it("should return false for non-final states", () => {
      expect(isFinalState("queued" as any)).toBe(false);
      expect(isFinalState("running" as any)).toBe(false);
      expect(isFinalState("paused" as any)).toBe(false);
      expect(isFinalState("retrying" as any)).toBe(false);
    });
  });

  describe("getAllowedTransitions", () => {
    it("should return all allowed transitions for queued", () => {
      const allowed = getAllowedTransitions("queued" as any);
      expect(allowed).toEqual(expect.arrayContaining(["running", "cancelled"]));
      expect(allowed).toHaveLength(2);
    });

    it("should return all allowed transitions for running", () => {
      const allowed = getAllowedTransitions("running" as any);
      expect(allowed).toEqual(
        expect.arrayContaining(["paused", "completed", "retrying", "failed", "cancelled"])
      );
      expect(allowed).toHaveLength(5);
    });

    it("should return empty array for final states", () => {
      expect(getAllowedTransitions("completed" as any)).toEqual([]);
      expect(getAllowedTransitions("failed" as any)).toEqual([]);
      expect(getAllowedTransitions("cancelled" as any)).toEqual([]);
    });
  });

  describe("State Machine Coverage", () => {
    it("should define transitions for all expected states", () => {
      const expectedStates = [
        "queued",
        "running",
        "paused",
        "retrying",
        "completed",
        "failed",
        "cancelled",
      ];

      for (const state of expectedStates) {
        expect(VALID_TRANSITIONS).toHaveProperty(state);
      }
    });

    it("should only reference valid states in transitions", () => {
      const validStates = Object.keys(VALID_TRANSITIONS);

      for (const [_from, toStates] of Object.entries(VALID_TRANSITIONS)) {
        for (const toState of toStates) {
          expect(validStates).toContain(toState);
        }
      }
    });
  });
});
