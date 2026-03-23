import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import Credentials from "next-auth/providers/credentials";
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
const googleId = process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID;
const googleSecret = process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET;
if (googleId && googleSecret) {
  providers.push(
    Google({
      clientId: googleId,
      clientSecret: googleSecret,
      authorization: { params: { scope: "openid email profile" } },
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture ?? profile.image ?? null,
        };
      },
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

providers.push(
  Credentials({
    id: "credentials",
    name: "credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      const email = String(credentials?.email ?? "")
        .toLowerCase()
        .trim();
      const password = String(credentials?.password ?? "");
      if (!email || !password) return null;
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user?.passwordHash) return null;
      const match = await bcrypt.compare(password, user.passwordHash);
      if (!match) return null;
      if (!user.emailVerified) return null;
      return {
        id: user.id,
        email: user.email ?? "",
        name: user.name,
        image: user.image,
      };
    },
  })
);

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  adapter: PrismaAdapter(prisma),
  providers: providers as any,
  pages: {
    signIn: "/auth",
    error: "/auth",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        if (account?.provider === "google" && profile) {
          const image = (profile as { picture?: string }).picture ?? (profile as { image?: string }).image;
          const email = (profile as { email?: string }).email;
          if (image && email) {
            await prisma.user.updateMany({
              where: { email },
              data: { image, profilePhotoUrl: image },
            });
          }
        }
      } catch {
        // לא לכשול את ההתחברות אם עדכון התמונה נכשל
      }
      return true;
    },
    async session({ session, user }) {
      if (session.user) {
        (session.user as { id?: string }).id = user.id;
        const img = user.image ?? (user as { profilePhotoUrl?: string }).profilePhotoUrl ?? undefined;
        session.user.image = img;
      }
      return session;
    },
  },
  session: { strategy: "database", maxAge: 30 * 24 * 60 * 60 },
});
