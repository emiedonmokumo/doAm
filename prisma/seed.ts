import bcrypt from 'bcryptjs';
import { Prisma, PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL must be configured before seeding.');
const databaseUrl = connectionString.includes('sslmode=')
  ? connectionString
  : `${connectionString}${connectionString.includes('?') ? '&' : '?'}sslmode=require`;
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });

async function main() {
  const passwordHash = await bcrypt.hash('DoAmDemo2026!', 12);
  const ada = await db.user.upsert({
    where: { email: 'ada@example.test' },
    update: {},
    create: {
      email: 'ada@example.test',
      name: 'Ada Okafor',
      passwordHash,
      profile: {
        create: {
          username: 'ada_okafor',
          fullName: 'Ada Okafor',
          bio: 'Helping my Lagos community.',
          skills: ['Moving', 'Errands'],
          location: {
            create: {
              latitude: new Prisma.Decimal('6.5244'),
              longitude: new Prisma.Decimal('3.3792'),
              city: 'Lagos',
              region: 'Lagos',
            },
          },
        },
      },
    },
  });

  await db.doAm.upsert({
    where: { id: 'seed-help-move' },
    update: {},
    create: {
      id: 'seed-help-move',
      creatorId: ada.id,
      title: 'Help move a sofa upstairs',
      description: 'Two people would make this quick.',
      reward: new Prisma.Decimal(3000),
      category: 'Moving',
      status: 'PUBLISHED',
      location: {
        create: {
          latitude: new Prisma.Decimal('6.5249'),
          longitude: new Prisma.Decimal('3.3801'),
          city: 'Lagos',
          region: 'Lagos',
          approximateAddress: 'Near CMS',
        },
      },
    },
  });
}

main()
  .then(() => console.info('Seed completed.'))
  .finally(async () => db.$disconnect());
