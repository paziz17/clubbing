import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Facebook from "next-auth/providers/facebook";
import Google from "next-auth/providers/google";
import Instagram from "next-auth/providers/instagram";
import { prisma } from "@/lib/prisma";

const providers = [];
if (process.env.AUTH_FACEBOOK_ID && process.env.AUTH_FACEBOOK_SECRET) {
  providers.push(
    Facebook({
      clientId: process.env.AUTH_FACEBOOK_ID,
      clientSecret: process.env.AUTH_FACEBOOK_SECRET,
      authorization: { params: { scope: "email,public_profile" } },
    })
  );
}
if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  const base = (process.env.AUTH_URL || process.env.NEXTAUTH_URL || "").replace(
    /\/$/,
    ""
  );
  providers.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      ...(base && {
        authorization: {
          params: {
            redirect_uri: `${base}/api/auth/callback/google`,
          },
        },
      }),
    })
  );
}
if (process.env.AUTH_INSTAGRAM_ID && process.env.AUTH_INSTAGRAM_SECRET) {
  providers.push(
    Instagram({
      clientId: process.env.AUTH_INSTAGRAM_ID,
      clientSecret: process.env.AUTH_INSTAGRAM_SECRET,
    })
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  adapter: PrismaAdapter(prisma),
  providers: providers as any,
  pages: {
    signIn: "/auth",
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        (session.user as { id?: string }).id = user.id;
        session.user.image = user.image ?? undefined;
      }
      return session;
    },
  },
  session: { strategy: "database", maxAge: 30 * 24 * 60 * 60 },
});
