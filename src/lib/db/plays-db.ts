import fs from 'fs/promises';
import path from 'path';
import type { Playbook } from '../parse/schemas';
import type { PlayMetadata } from '../types';

// Re-export PlayMetadata for convenience
export type { PlayMetadata };

const DB_DIR = path.join(process.cwd(), 'data', 'plays');
const INDEX_FILE = path.join(DB_DIR, '_index.json');

interface PlayIndex {
    plays: PlayMetadata[];
    lastUpdated: string;
}

/**
 * Initialize the database directory structure
 */
async function ensureDbDirectory(): Promise<void> {
    try {
        await fs.mkdir(DB_DIR, { recursive: true });
    } catch (error) {
        console.error('Failed to create database directory:', error);
        throw new Error('Database initialization failed');
    }
}

/**
 * Read the play index file
 */
async function readIndex(): Promise<PlayIndex> {
    try {
        await ensureDbDirectory();
        const indexData = await fs.readFile(INDEX_FILE, 'utf-8');
        return JSON.parse(indexData);
    } catch (error) {
        // If index doesn't exist, return empty index
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
            return { plays: [], lastUpdated: new Date().toISOString() };
        }
        throw error;
    }
}

/**
 * Get metadata for a single play by ID from the index (does NOT read full play file)
 */
export async function getPlayMetadataById(playId: string): Promise<PlayMetadata | null> {
    const index = await readIndex();
    return index.plays.find(p => p.id === playId) ?? null;
}

/**
 * Write the play index file
 */
async function writeIndex(index: PlayIndex): Promise<void> {
    await ensureDbDirectory();
    index.lastUpdated = new Date().toISOString();
    await fs.writeFile(INDEX_FILE, JSON.stringify(index, null, 2), 'utf-8');
}

/**
 * Get the file path for a play
 */
function getPlayFilePath(playId: string): string {
    return path.join(DB_DIR, `${playId}.json`);
}

/**
 * Create metadata from a playbook
 */
function createMetadata(play: Playbook, isUpdate = false): PlayMetadata {
    const now = new Date().toISOString();
    const lineCount = play.acts.reduce((total, act) =>
        total + act.scenes.reduce((sceneTotal, scene) =>
            sceneTotal + scene.lines.length, 0), 0);

    return {
        id: play.id,
        title: play.title,
        author: play.author,
        genre: play.genre,
        year: play.year ?? 0,
        createdAt: isUpdate ? (play as PlayMetadata & Playbook).createdAt || now : now,
        updatedAt: now,
        characterCount: play.characters.length,
        actCount: play.acts.length,
        lineCount,
    };
}

/**
 * Save a play to the database
 */
export async function savePlay(play: Playbook): Promise<void> {
    await ensureDbDirectory();

    // Check if play already exists
    const index = await readIndex();
    const existingIndex = index.plays.findIndex(p => p.id === play.id);
    const isUpdate = existingIndex !== -1;

    // Create metadata
    const metadata = createMetadata(play, isUpdate);

    // Save the full play data
    const playPath = getPlayFilePath(play.id);
    await fs.writeFile(playPath, JSON.stringify(play, null, 2), 'utf-8');

    // Update index
    if (isUpdate) {
        index.plays[existingIndex] = metadata;
    } else {
        index.plays.push(metadata);
    }

    await writeIndex(index);
    console.log(`[DB] Saved play: ${play.id} (${isUpdate ? 'updated' : 'created'})`);
}

/**
 * Get a play by ID
 */
export async function getPlayById(playId: string): Promise<Playbook | null> {
    try {
        const playPath = getPlayFilePath(playId);
        const playData = await fs.readFile(playPath, 'utf-8');
        return JSON.parse(playData) as Playbook;
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
            return null;
        }
        console.error(`Failed to read play ${playId}:`, error);
        throw error;
    }
}

/**
 * Get all plays metadata (lightweight list)
 */
export async function getAllPlays(): Promise<PlayMetadata[]> {
    const index = await readIndex();
    return index.plays.sort((a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
}

/**
 * Update play metadata in the index
 * This updates only the metadata without touching the full play data
 */
export async function updatePlayMetadata(playId: string, updates: Partial<Omit<PlayMetadata, 'id' | 'createdAt'>>): Promise<PlayMetadata | null> {
    try {
        const index = await readIndex();
        const playIndex = index.plays.findIndex(p => p.id === playId);

        if (playIndex === -1) {
            return null;
        }

        // Update the metadata
        const updatedMetadata = {
            ...index.plays[playIndex],
            ...updates,
            updatedAt: new Date().toISOString(),
        };

        index.plays[playIndex] = updatedMetadata;
        await writeIndex(index);

        console.log(`[DB] Updated metadata for play: ${playId}`);
        return updatedMetadata;
    } catch (error) {
        console.error(`Failed to update metadata for play ${playId}:`, error);
        throw error;
    }
}

/**
 * Delete a play
 */
export async function deletePlay(playId: string): Promise<boolean> {
    try {
        // Remove from index
        const index = await readIndex();
        const playIndex = index.plays.findIndex(p => p.id === playId);

        if (playIndex === -1) {
            return false;
        }

        index.plays.splice(playIndex, 1);
        await writeIndex(index);

        // Delete the file
        const playPath = getPlayFilePath(playId);
        await fs.unlink(playPath);

        console.log(`[DB] Deleted play: ${playId}`);
        return true;
    } catch (error) {
        console.error(`Failed to delete play ${playId}:`, error);
        throw error;
    }
}

/**
 * Search plays by title or author
 */
export async function searchPlays(query: string): Promise<PlayMetadata[]> {
    const index = await readIndex();
    const lowerQuery = query.toLowerCase();

    return index.plays.filter(play =>
        play.title.toLowerCase().includes(lowerQuery) ||
        play.author.toLowerCase().includes(lowerQuery)
    );
}

/**
 * Get database statistics
 */
export async function getDbStats(): Promise<{
    totalPlays: number;
    totalCharacters: number;
    totalLines: number;
    lastUpdated: string;
}> {
    const index = await readIndex();

    return {
        totalPlays: index.plays.length,
        totalCharacters: index.plays.reduce((sum, p) => sum + p.characterCount, 0),
        totalLines: index.plays.reduce((sum, p) => sum + p.lineCount, 0),
        lastUpdated: index.lastUpdated,
    };
}

/**
 * Check if a play exists
 */
export async function playExists(playId: string): Promise<boolean> {
    const index = await readIndex();
    return index.plays.some(p => p.id === playId);
}
