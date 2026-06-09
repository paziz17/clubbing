import { NextAuthOptions } from "next-auth";
import type { OAuthConfig } from "next-auth/providers/oauth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "./db";

interface InstagramProfile {
  id: string;
  username: string;
  account_type?: string;
}

/**
 * Instagram OAuth provider (Basic Display API).
 * NextAuth has no built-in Instagram provider, so we use a custom OAuth config.
 * Requires INSTAGRAM_CLIENT_ID / INSTAGRAM_CLIENT_SECRET in .env to be active.
 */
function InstagramProvider(): OAuthConfig<InstagramProfile> {
  return {
    id: "instagram",
    name: "Instagram",
    type: "oauth",
    authorization: {
      url: "https://api.instagram.com/oauth/authorize",
      params: { scope: "user_profile", response_type: "code" },
    },
    token: "https://api.instagram.com/oauth/access_token",
    userinfo:
      "https://graph.instagram.com/me?fields=id,username,account_type",
    clientId: process.env.INSTAGRAM_CLIENT_ID,
    clientSecret: process.env.INSTAGRAM_CLIENT_SECRET,
    profile(profile: InstagramProfile) {
      return {
        id: profile.id,
        name: profile.username,
        email: null,
        image: null,
      };
    },
  };
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db) as any,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth",
  },
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
    ...(process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET
      ? [
          FacebookProvider({
            clientId: process.env.FACEBOOK_CLIENT_ID,
            clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
          }),
        ]
      : []),
    ...(process.env.INSTAGRAM_CLIENT_ID && process.env.INSTAGRAM_CLIENT_SECRET
      ? [InstagramProvider()]
      : []),
    CredentialsProvider({
      id: "guest",
      name: "Guest",
      credentials: {
        name: { label: "Name", type: "text" },
      },
      async authorize(creds) {
        const guest = await db.user.create({
          data: {
            name: creds?.name || "אורח",
            isGuest: true,
          },
        });
        return {
          id: guest.id,
          name: guest.name,
          email: guest.email,
          image: guest.image,
        };
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (token?.sub) {
        (session.user as any).id = token.sub;
        const user = await db.user.findUnique({
          where: { id: token.sub },
          select: { role: true, isGuest: true },
        });
        if (user) {
          (session.user as any).role = user.role;
          (session.user as any).isGuest = user.isGuest;
        }
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
