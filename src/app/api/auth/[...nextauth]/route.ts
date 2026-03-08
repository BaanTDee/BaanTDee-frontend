import NextAuth, { NextAuthOptions, User as NextAuthUser } from "next-auth";
import FacebookProvider from "next-auth/providers/facebook";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import type { JWT } from "next-auth/jwt";

// Custom types
interface BackendUser {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: string;
  avatar: string | null;
  created_at: string;
}

interface BackendAuthResponse {
  success: boolean;
  data?: {
    access_token: string;
    refresh_token: string;
    user: BackendUser;
  };
  error?: {
    code: string;
    message: string;
  };
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

export const authOptions: NextAuthOptions = {
  providers: [
    // Facebook OAuth
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID || "",
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET || "",
      authorization: {
        params: {
          scope: "public_profile email",
        },
      },
    }),

    // Google OAuth
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: {
        params: {
          scope: "openid email profile",
        },
      },
    }),

    // Email/Password login (ใช้ backend API)
    CredentialsProvider({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const res = await fetch(`${API_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          const data: BackendAuthResponse = await res.json();

          if (data.success && data.data) {
            return {
              id: String(data.data.user.id),
              name: data.data.user.name,
              email: data.data.user.email,
              image: data.data.user.avatar,
              accessToken: data.data.access_token,
              refreshToken: data.data.refresh_token,
              backendUser: data.data.user,
            } as any;
          }

          return null;
        } catch (error) {
          console.error("Login error:", error);
          return null;
        }
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account, profile }) {
      // ถ้าเป็น Facebook login - เรียก backend endpoint
      if (account?.provider === "facebook") {
        try {
          const res = await fetch(`${API_URL}/auth/facebook`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              facebook_id: profile?.id,
              access_token: account.access_token,
              name: user.name || "",
              email: user.email || "",
              avatar: user.image || null,
            }),
          });

          const data: BackendAuthResponse = await res.json();

          if (data.success && data.data) {
            // Store backend tokens in user object (will be available in jwt callback)
            (user as any).backendAccessToken = data.data.access_token;
            (user as any).backendRefreshToken = data.data.refresh_token;
            (user as any).backendUser = data.data.user;
            return true;
          }

          console.error("Facebook backend login failed:", data.error);
          return false;
        } catch (error) {
          console.error("Facebook signup error:", error);
          return false;
        }
      }

      // ถ้าเป็น Google login - เรียก backend endpoint
      if (account?.provider === "google") {
        try {
          const res = await fetch(`${API_URL}/auth/google`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              google_id: profile?.sub,
              access_token: account.access_token,
              name: user.name || "",
              email: user.email || "",
              avatar: user.image || null,
            }),
          });

          const data: BackendAuthResponse = await res.json();

          if (data.success && data.data) {
            // Store backend tokens in user object (will be available in jwt callback)
            (user as any).backendAccessToken = data.data.access_token;
            (user as any).backendRefreshToken = data.data.refresh_token;
            (user as any).backendUser = data.data.user;
            return true;
          }

          console.error("Google backend login failed:", data.error);
          return false;
        } catch (error) {
          console.error("Google signup error:", error);
          return false;
        }
      }

      return true;
    },

    async jwt({ token, user, account }) {
      // เมื่อ login ครั้งแรก - เก็บข้อมูลจาก user
      if (user && account) {
        if (account.provider === "credentials") {
          // Email login - มี backend token
          token.accessToken = (user as any).accessToken;
          token.refreshToken = (user as any).refreshToken;
          token.backendUser = (user as any).backendUser;
        } else if (account.provider === "facebook") {
          // Facebook login - มี backend token จาก signIn callback
          token.provider = "facebook";
          token.accessToken = (user as any).backendAccessToken;
          token.refreshToken = (user as any).backendRefreshToken;
          token.backendUser = (user as any).backendUser;
        } else if (account.provider === "google") {
          // Google login - มี backend token จาก signIn callback
          token.provider = "google";
          token.accessToken = (user as any).backendAccessToken;
          token.refreshToken = (user as any).backendRefreshToken;
          token.backendUser = (user as any).backendUser;
        }
      }

      return token;
    },

    async session({ session, token }) {
      // ส่งข้อมูลไปยัง client
      if (token && session.user) {
        (session.user as any).id = token.sub || "";
        (session as any).accessToken = token.accessToken;
        (session as any).refreshToken = token.refreshToken;
        (session as any).backendUser = token.backendUser;
        (session as any).provider = token.provider || "credentials";
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },

  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
