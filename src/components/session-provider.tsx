"use client";

import { SessionProvider as NextAuthSessionProvider, useSession } from "next-auth/react";
import { useEffect, type ReactNode } from "react";
import { setTokens, clearTokens, getAccessToken, getRefreshToken } from "@/lib/api";
import { FavoritesProvider } from "@/context/favorites-context";

function TokenSync() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "authenticated" && session) {
      const accessToken = (session as any)?.accessToken;
      const refreshToken = (session as any)?.refreshToken;
      // Sync session tokens to localStorage if localStorage is empty
      // or if it has no refresh token (allows refresh to work).
      if (accessToken && refreshToken && (!getAccessToken() || !getRefreshToken())) {
        setTokens(accessToken, refreshToken);
      }
    } else if (status === "unauthenticated") {
      clearTokens();
    }
  }, [session, status]);

  return null;
}

export default function SessionProvider({ children }: { children: ReactNode }) {
  return (
    <NextAuthSessionProvider>
      <TokenSync />
      <FavoritesProvider>
        {children}
      </FavoritesProvider>
    </NextAuthSessionProvider>
  );
}
