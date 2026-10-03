import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { normalizeCaCertificate, resolveSslConfig, stripSslParams } from './db-ssl';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL must be configured before Prisma can start.');
}

const ssl = resolveSslConfig({
  caCertificate: normalizeCaCertificate(process.env.SUPABASE_CA_CERT),
  isProduction: process.env.NODE_ENV === 'production',
  isBuildPhase: process.env.NEXT_PHASE === 'phase-production-build',
});

export const db = globalForPrisma.prisma ?? new PrismaClient({
  adapter: new PrismaPg({ connectionString: stripSslParams(connectionString), ssl }),
});
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
