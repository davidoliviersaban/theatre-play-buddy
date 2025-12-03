#!/usr/bin/env node
/**
 * Migration Script: ParsingSession → ParseJob
 * 
 * Converts existing ParsingSession records to the new ParseJob model.
 * Run this script after the ParseJob migration has been applied.
 * 
 * Usage: npx tsx scripts/migrate-parsing-session-to-parse-job.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Map old ParsingStatus to new JobStatus
function mapStatus(oldStatus: string): string {
  const statusMap: Record<string, string> = {
    pending: 'queued',
    warming: 'running',
    parsing: 'running',
    completed: 'completed',
    failed: 'failed',
    aborted: 'cancelled',
  };
  return statusMap[oldStatus] || 'queued';
}

async function migrateParsingSessionsToParseJobs() {
  console.log('🔄 Starting migration: ParsingSession → ParseJob');

  try {
    // Fetch all existing ParsingSession records
    const sessions = await prisma.parsingSession.findMany({
      orderBy: { startedAt: 'asc' },
    });

    console.log(`📊 Found ${sessions.length} ParsingSession records to migrate`);

    if (sessions.length === 0) {
      console.log('✅ No records to migrate');
      return;
    }

    let migrated = 0;
    let skipped = 0;

    for (const session of sessions) {
      try {
        // Check if already migrated (by checking if a ParseJob exists with matching playbookId and filename)
        const existing = await prisma.parseJob.findFirst({
          where: {
            playbookId: session.playbookId,
            filename: session.filename,
          },
        });

        if (existing) {
          console.log(`⏭️  Skipping session ${session.id} - already migrated`);
          skipped++;
          continue;
        }

        // Map ParsingSession to ParseJob
        const newStatus = mapStatus(session.status);

        await prisma.parseJob.create({
          data: {
            // Preserve original ID for traceability
            id: session.id,

            // Job metadata
            type: 'PARSE_PLAY',
            priority: 0, // Default priority for migrated jobs
            status: newStatus,

            // Input data
            rawText: session.rawText,
            filename: session.filename,
            config: {
              // Preserve any config we can infer
              title: session.title,
              author: session.author,
              year: session.year,
              genre: session.genre,
              description: session.description,
            },

            // Output reference
            playbookId: session.status === 'completed' ? session.playbookId : null,

            // Execution state (preserve for resume capability)
            retryCount: 0,
            maxRetries: 3,
            checkpoints: [],
            currentState: session.currentState,

            // Progress tracking
            totalChunks: session.totalChunks,
            completedChunks: session.currentChunk,
            progress: session.totalChunks > 0
              ? (session.currentChunk / session.totalChunks) * 100
              : 0,

            // Error tracking
            lastError: session.failureReason,
            failureReason: session.failureReason,

            // Distributed lock (no active locks from old sessions)
            workerId: null,
            lockedAt: null,
            lockExpiry: null,

            // Timestamps
            createdAt: session.startedAt,
            startedAt: session.status !== 'pending' ? session.startedAt : null,
            completedAt: session.completedAt,
            updatedAt: new Date(),
          },
        });

        console.log(`✅ Migrated session ${session.id} (status: ${session.status} → ${newStatus})`);
        migrated++;

      } catch (error) {
        console.error(`❌ Failed to migrate session ${session.id}:`, error);
      }
    }

    console.log('\n📈 Migration Summary:');
    console.log(`   Migrated: ${migrated}`);
    console.log(`   Skipped:  ${skipped}`);
    console.log(`   Total:    ${sessions.length}`);

    if (migrated > 0) {
      console.log('\n⚠️  Next steps:');
      console.log('   1. Verify migrated ParseJob records in database');
      console.log('   2. Update application code to use ParseJob instead of ParsingSession');
      console.log('   3. Once stable, drop ParsingSession table with a new migration');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
migrateParsingSessionsToParseJobs()
  .then(() => {
    console.log('\n✅ Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });
