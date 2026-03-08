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
      // ถ้าเป็น Facebook login - ต้องสร้าง/เช็ค user ใน backend
      if (account?.provider === "facebook") {
        try {
          // TODO: เพิ่ม endpoint POST /auth/facebook ใน backend
          // ที่รับ { access_token, facebook_id, name, email }
          // และ return JWT token เหมือน /auth/login

          // ตอนนี้ skip - ให้ NextAuth จัดการเอง
          // User จะเก็บใน NextAuth session แต่จะไม่มี backend JWT
          return true;
        } catch (error) {
          console.error("Facebook signup error:", error);
          return false;
        }
      }

      // ถ้าเป็น Google login - ต้องสร้าง/เช็ค user ใน backend
      if (account?.provider === "google") {
        try {
          // TODO: เพิ่ม endpoint POST /auth/google ใน backend
          // ที่รับ { access_token, google_id, name, email }
          // และ return JWT token เหมือน /auth/login

          // ตอนนี้ skip - ให้ NextAuth จัดการเอง
          return true;
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
          // Facebook login - ยังไม่มี backend integration
          token.provider = "facebook";
          token.facebookToken = account.access_token;
        } else if (account.provider === "google") {
          // Google login - ยังไม่มี backend integration
          token.provider = "google";
          token.googleToken = account.access_token;
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
