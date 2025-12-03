import prisma from '@/lib/db/prisma';
import { savePlay } from '@/lib/db/plays-db-prisma';

// This test verifies that savePlay persists a minimal valid playbook and its structure.
// It uses the real database configured via .env/.env.local. Ensure Postgres is running (docker-compose) before running.

describe('savePlay integration - persists playbook and structure', () => {
    const idsToCleanup: { playbookId?: string } = {};
    let canRun = true;

    beforeAll(async () => {
        try {
            await prisma.$connect();
        } catch (e) {
            // If DB is not available, skip the integration test
            canRun = false;
        }
    });

    afterAll(async () => {
        // Cleanup inserted records to keep dev DB tidy
        if (idsToCleanup.playbookId) {
            await prisma.playbook.delete({ where: { id: idsToCleanup.playbookId } });
        }
        // Ensure prisma disconnects to avoid open handle warnings
        await prisma.$disconnect();
    });

    (canRun ? it : it.skip)('should store playbook and return an id', async () => {
        const playData = {
            id: `it-pb-${Date.now()}`,
            title: 'Test Play',
            author: 'Test Author',
            year: 2025,
            genre: 'Drama',
            description: 'Integration test play',
            characters: [
                { id: 'char-a', name: 'Alice', description: 'Protagonist' },
                { id: 'char-b', name: 'Bob' },
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
                                { id: 'line-1', characterId: 'char-a', text: 'Hello world', type: 'dialogue' },
                                { id: 'line-2', text: 'Stage action', type: 'stage_direction' },
                            ],
                        },
                    ],
                },
            ],
        };

        await savePlay(playData as unknown as Parameters<typeof savePlay>[0]);
        // Find the most recently created playbook matching title/author
        const latest = await prisma.playbook.findFirst({
            where: { title: 'Test Play', author: 'Test Author' },
            orderBy: { createdAt: 'desc' },
        });
        expect(latest).not.toBeNull();
        const savedId: string = latest!.id;
        idsToCleanup.playbookId = savedId;

        const fetched = await prisma.playbook.findUnique({
            where: { id: savedId },
            include: {
                characters: true,
                acts: {
                    include: {
                        scenes: {
                            include: {
                                lines: true,
                            },
                        },
                    },
                },
            },
        });
        expect(fetched).not.toBeNull();
        expect(fetched?.title).toBe('Test Play');
        expect(fetched?.author).toBe('Test Author');

        // Characters
        expect(fetched!.characters.length).toBe(2);
        const names = fetched!.characters.map((c) => c.name).sort();
        expect(names).toEqual(['Alice', 'Bob']);

        // Acts and Scenes
        expect(fetched!.acts.length).toBe(1);
        const act = fetched!.acts[0];
        expect(act.scenes.length).toBe(1);
        const scene = act.scenes[0];

        // Lines: dialogue and stage direction
        expect(scene.lines.length).toBe(2);
        const dialogue = scene.lines.find((l) => l.type === 'dialogue');
        const stageDir = scene.lines.find((l) => l.type === 'stage_direction');
        expect(dialogue?.text).toBe('Hello world');
        expect(stageDir?.text).toBe('Stage action');
    });
});
