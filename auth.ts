import { randomBytes } from 'node:crypto';
import { PrismaAdapter } from '@auth/prisma-adapter';
import bcrypt from 'bcryptjs';
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import { z } from 'zod';
import { db } from '@/lib/db';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: 'jwt' },
  callbacks: {
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      if (!user.id) return;
      const fullName = (user.name?.trim() || user.email?.split('@')[0] || 'DoAm member').slice(0, 80);
      const usernameBase = (user.email?.split('@')[0] || fullName)
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '')
        .slice(0, 20) || 'member';
      const username = `${usernameBase}_${randomBytes(4).toString('hex')}`;
      await db.profile.upsert({
        where: { id: user.id },
        update: {},
        create: { id: user.id, username, fullName },
      });
    },
  },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      authorize: async (credentials) => {
        const input = z.object({ email: z.string().email(), password: z.string().min(8) }).safeParse(credentials);
        if (!input.success) return null;
        const user = await db.user.findUnique({ where: { email: input.data.email.toLowerCase() } });
        if (!user?.passwordHash || !(await bcrypt.compare(input.data.password, user.passwordHash))) return null;
        return { id: user.id, email: user.email, name: user.name, image: user.image };
      },
    }),
    Google,
  ],
});
