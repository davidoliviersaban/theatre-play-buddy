import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

declare global {
    var prisma: PrismaClient | undefined;
}

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
});

// Reduce noisy query-level logging; keep warn/error for signal, and info optionally via env
const baseLog: ('info' | 'warn' | 'error')[] = ['warn', 'error'];
const includeInfo = (process.env.PRISMA_LOG_INFO || '').toLowerCase() === 'true';
export const prisma =
    global.prisma ||
    new PrismaClient({ adapter, log: includeInfo ? [...baseLog, 'info'] : baseLog });

if (process.env.NODE_ENV !== 'production') {
    global.prisma = prisma;
}

export default prisma;
