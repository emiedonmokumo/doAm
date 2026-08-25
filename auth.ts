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
