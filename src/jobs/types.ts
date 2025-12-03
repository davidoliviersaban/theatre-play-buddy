/**
 * TypeScript interfaces and types for the job queue system
 */

import type { JobStatus, JobType, ParseJob, Prisma } from "@prisma/client";

export { JobStatus, JobType };
export type { ParseJob };

/**
 * Input data for creating a new parse job
 */
export interface ParseJobInput {
    rawText: string;
    filename: string;
    config?: ParseJobConfig;
    priority?: number;
    maxRetries?: number;
}

/**
 * Configuration for parse job
 */
export interface ParseJobConfig {
    chunkSize?: number;
    llmProvider?: "anthropic" | "openai";
    tempPlaybookId?: string;
    // Additional metadata for UI display
    title?: string;
    author?: string;
    year?: number;
    genre?: string;
    description?: string;
    totalCharacters?: number;
    totalActs?: number;
    totalScenes?: number;
    totalLines?: number;
    currentActIndex?: number | null;
    currentSceneIndex?: number | null;
    currentLineIndex?: number | null;
    currentCharacters?: string[];
}

/**
 * Result of a completed job
 */
export interface JobResult {
    status: "completed" | "failed" | "cancelled";
    playbookId?: string;
    failureReason?: string;
}

/**
 * Progress update for a job
 */
export interface JobProgress {
    chunksCompleted: number;
    totalChunks: number;
    linesCompleted: number;
    progress: number; // 0-100
}

/**
 * Job update data
 */
export interface JobUpdateData {
    status?: JobStatus;
    completedChunks?: number;
    totalChunks?: number;
    progress?: number;
    completedAt?: Date;
    startedAt?: Date;
    failureReason?: string;
    lastError?: string;
    currentState?: Prisma.InputJsonValue;
    checkpoints?: Prisma.InputJsonValue;
    retryCount?: number;
    playbookId?: string;
    config?: Prisma.InputJsonValue;
    // Lock fields
    workerId?: string | null;
    lockedAt?: Date | null;
    lockExpiry?: Date | null;
}
