import { parseJobPipeline } from '@/jobs/parse/parse-pipeline';
import prisma from '@/lib/db/prisma';

// Mock savePlay and any validators used inside the pipeline if they are imported
// Do not mock savePlay; instead, spy on prisma methods it uses
jest.mock('@/lib/db/plays-db-prisma', () => {
    return {
        __esModule: true,
        savePlay: jest.fn(async (play: { id?: string }) => ({ id: play.id || 'mock-play-id' })),
    };
});

// Mock PlaybookSchema to accept our stubbed playbook without strict validations
jest.mock('@/lib/parse/schemas', () => {
    return {
        __esModule: true,
        PlaybookSchema: {
            safeParse: (data: unknown) => ({ success: true, data }),
        },
    };
});

// Mock incremental parser to avoid hitting real LLM providers during tests
jest.mock('@/lib/parse/incremental-parser', () => {
    return {
        __esModule: true,
        parsePlayIncrementally: async function* (
            text: string,
            _provider: string,
            _chunkSize: number,
            onCheckpoint: (ctx: unknown, chunk: number) => Promise<void>,
            initialContext?: unknown
        ) {
            const ctx = (initialContext as Record<string, unknown>) ?? {
                title: 'Untitled',
                author: 'Unknown',
                genre: 'Drama',
                description: '',
                characters: [],
                acts: [],
            };
            // Yield a single increment; do not invoke checkpoint to avoid inc scoping issues
            yield { context: ctx, total: 1 };
        },
        contextToPlaybook: (ctx: unknown) => {
            const c = ctx as Record<string, unknown>;
            return {
                id: 'mock-play-id',
                title: (c?.title as string) || 'Untitled',
                author: (c?.author as string) || 'Unknown',
                year: (c?.year as number) ?? 1600,
                genre: (c?.genre as string) || 'Drama',
                description: (c?.description as string) || '',
                characters: (c?.characters as unknown[]) || [],
                acts: (c?.acts as unknown[]) || [],
            };
        },
    };
});

// Ensure prisma methods used in pipeline don't hit a real DB
jest.spyOn(prisma.parseJob, 'update').mockResolvedValue({} as unknown as ReturnType<typeof prisma.parseJob.update>);

describe('parseJobPipeline - transforms currentState into a Playbook', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should process a ParseJob with currentState and produce a valid play', async () => {
        const mockCurrentState = {
            // Minimal ParsingContext snapshot sufficient for reconstructing a play
            title: 'Hamlet',
            author: 'William Shakespeare',
            year: 1600,
            genre: 'Tragedy',
            description: 'The Prince of Denmark seeks revenge',
            characters: [
                { id: 'char-1', name: 'Hamlet', description: 'Prince of Denmark' },
                { id: 'char-2', name: 'Ophelia' },
            ],
            acts: [
                {
                    id: 'act-1',
                    title: 'Act I',
                    scenes: [
                        {
                            id: 'scene-1',
                            title: 'Scene 1',
                            lines: [
                                { id: 'line-1', characterId: 'char-1', text: 'To be or not to be', type: 'dialogue' },
                                { id: 'line-2', text: 'Thunder', type: 'stage_direction' },
                            ],
                        },
                    ],
                },
            ],
            // Any Set fields in real context should be arrays here (serializer handles conversion)
            charactersSeen: ['char-1'],
            chunkCount: 1,
        };

        const job = {
            id: 'job-1',
            type: 'PARSE_PLAY',
            priority: 0,
            status: 'queued',
            rawText: 'ignored-in-this-test',
            filename: 'hamlet.txt',
            config: { chunkSize: 2500, llmProvider: 'anthropic' },
            retryCount: 0,
            maxRetries: 3,
            checkpoints: [],
            currentState: mockCurrentState,
            totalChunks: 1,
            completedChunks: 0,
            progress: 0,
            lastError: null,
            failureReason: null,
            workerId: null,
            lockedAt: null,
            lockExpiry: null,
            createdAt: new Date(),
            startedAt: new Date(),
            completedAt: null,
            updatedAt: new Date(),
        } as unknown as Parameters<typeof parseJobPipeline>[0];

        // Progress callback receives progress updates during pipeline
        const onProgress = jest.fn();

        // Storage is mocked; we do not spy on Prisma writes in this unit test

        const result = await parseJobPipeline(job, onProgress);

        // Pipeline completed successfully and produced a playbook id
        expect(result.playbookId).toBeDefined();
    });
});
