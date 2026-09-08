import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { resolveAccess } from "@/lib/access";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [Google],
  session: { strategy: "database" },
  pages: { signIn: "/login" },
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;
      const access = await resolveAccess(user.email);
      return access.allowed;
    },
    async session({ session, user }) {
      if (session.user && user.email) {
        const access = await resolveAccess(user.email);
        session.user.id = user.id;
        session.user.role = access.allowed ? access.role : "CONTRIBUTOR";
        session.user.professionalId = access.allowed ? access.professionalId : undefined;
      }
      return session;
    },
  },
});
