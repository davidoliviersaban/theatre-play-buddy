import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { MOCK_PLAYS } from '../src/lib/mock-data';

// Load .env.local first, then fall back to .env
config({ path: '.env.local' });
config({ path: '.env' });

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

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
            // Create playbook with all nested data
            await prisma.playbook.create({
                data: {
                    id: mockPlay.id,
                    title: mockPlay.title,
                    author: mockPlay.author,
                    year: mockPlay.year,
                    genre: mockPlay.genre,
                    description: mockPlay.description,
                    coverImage: mockPlay.coverImage,
                    characters: {
                        create: mockPlay.characters.map(char => ({
                            id: char.id,
                            name: char.name,
                            description: char.description,
                            isFavorite: char.isFavorite ?? false,
                            lastSelected: char.lastSelected ?? false,
                            completionRate: char.completionRate ?? 0,
                        })),
                    },
                    acts: {
                        create: mockPlay.acts.map((act, actIndex) => ({
                            id: act.id,
                            title: act.title,
                            order: actIndex,
                            scenes: {
                                create: act.scenes.map((scene, sceneIndex) => ({
                                    id: scene.id,
                                    title: scene.title,
                                    order: sceneIndex,
                                    lines: {
                                        create: scene.lines.map((line, lineIndex) => ({
                                            id: line.id,
                                            text: line.text,
                                            type: line.type,
                                            order: lineIndex,
                                            // Handle character relationship
                                            characters: line.characterId
                                                ? {
                                                    create: {
                                                        characterId: line.characterId,
                                                        order: 0,
                                                    },
                                                }
                                                : undefined,
                                        })),
                                    },
                                })),
                            },
                        })),
                    },
                },
            });
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
