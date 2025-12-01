import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { MOCK_PLAYS } from '../src/lib/mock-data';
import { savePlay } from '../src/lib/db/plays-db-prisma';
import type { Playbook } from '../src/lib/parse/schemas';

// Load .env.local first, then fall back to .env
config({ path: '.env.local' });
config({ path: '.env' });

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ log: ['query', 'info', 'warn', 'error'], adapter });

async function main() {
    console.log('[Seed] Checking database state...');
    const existingPlaysCount = await prisma.playbook.count();

    if (existingPlaysCount >= MOCK_PLAYS.length) {
        console.log(`[Seed] Database already contains ${existingPlaysCount} plays, skipping seeding`);
        return;
    }

    console.log('[Seed] Seeding database with mock data...');

    for (const mockPlay of MOCK_PLAYS) {
        try {
            // Convert mock play to Playbook format (IDs become optional llmSourceIds)
            const playbook: Playbook = {
                title: mockPlay.title,
                author: mockPlay.author,
                year: mockPlay.year,
                genre: mockPlay.genre || 'Drama',
                description: mockPlay.description || '',
                characters: mockPlay.characters.map(char => ({
                    id: char.id, // Will be stored as llmSourceId
                    name: char.name,
                    description: char.description,
                })),
                acts: mockPlay.acts.map(act => ({
                    id: act.id, // Will be stored as llmSourceId
                    title: act.title,
                    scenes: act.scenes.map(scene => ({
                        id: scene.id, // Will be stored as llmSourceId
                        title: scene.title,
                        lines: scene.lines.map(line => ({
                            id: line.id, // Will be stored as llmSourceId
                            text: line.text,
                            type: line.type as 'dialogue' | 'stage_direction',
                            characterId: line.characterId,
                        })),
                    })),
                })),
            };

            await savePlay(playbook);
            console.log(`[Seed] ✓ Saved: ${mockPlay.title}`);
        } catch (error) {
            console.error(`[Seed] ✗ Failed to save ${mockPlay.title}:`, error);
        }
    }

    const finalCount = await prisma.playbook.count();
    console.log(`[Seed] ✅ Seeding complete! Database now contains ${finalCount} plays`);
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
