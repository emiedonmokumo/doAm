import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL must be configured before Prisma can start.');
}

const caCertificate = process.env.SUPABASE_CA_CERT;
const ssl = caCertificate
  ? { ca: caCertificate, rejectUnauthorized: true }
  : { rejectUnauthorized: false };

export const db = globalForPrisma.prisma ?? new PrismaClient({
  adapter: new PrismaPg({ connectionString, ssl }),
});
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
