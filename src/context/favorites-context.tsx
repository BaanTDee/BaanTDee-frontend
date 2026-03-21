"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  getMyFavoriteIds,
  addFavorite,
  removeFavorite,
  getAccessToken,
  setTokens,
  ensureFreshToken,
} from "@/lib/api";

interface FavoritesCtx {
  ids: Set<number>;
  toggle: (listingId: number) => Promise<void>;
  has: (listingId: number) => boolean;
}

const FavoritesContext = createContext<FavoritesCtx>({
  ids: new Set(),
  toggle: async () => {},
  has: () => false,
});

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [ids, setIds] = useState<Set<number>>(new Set());

  /**
   * Ensure localStorage has valid tokens before making an API call.
   * If localStorage is empty (e.g. after clearTokens()), re-sync from
   * the NextAuth session, then proactively refresh if the access token
   * is expired. Returns a fresh access token or null.
   */
  const getFreshToken = useCallback(async (): Promise<string | null> => {
    // 1. Try local storage first (may have been refreshed by another call)
    let t = await ensureFreshToken();
    if (t) return t;

    // 2. localStorage empty — sync from session (stale access + unused refresh)
    const at = (session as any)?.accessToken as string | undefined;
    const rt = (session as any)?.refreshToken as string | undefined;
    if (at && rt) {
      setTokens(at, rt);
      // Now ensureFreshToken will detect the expired access token and use
      // the refresh token to obtain a new pair.
      t = await ensureFreshToken();
      if (t) return t;
    }

    return null;
  }, [session]);

  // Fetch favorite IDs when the user logs in
  useEffect(() => {
    if (!session?.user) {
      setIds(new Set());
      return;
    }
    (async () => {
      const token = await getFreshToken();
      if (token) {
        const result = await getMyFavoriteIds(token);
        setIds(result);
      }
    })();
  }, [session?.user, getFreshToken]);

  const has = useCallback((listingId: number) => ids.has(Number(listingId)), [ids]);

  const toggle = useCallback(
    async (listingId: number) => {
      if (!session?.user) return;

      const numId = Number(listingId);
      const wasFav = ids.has(numId);

      // Optimistic update
      setIds((prev) => {
        const next = new Set(prev);
        if (wasFav) next.delete(numId);
        else next.add(numId);
        return next;
      });

      try {
        const token = await getFreshToken();
        if (!token) throw new Error("No auth token");

        if (wasFav) {
          await removeFavorite(numId, token);
        } else {
          await addFavorite(numId, token);
        }
      } catch {
        // Revert on error
        setIds((prev) => {
          const next = new Set(prev);
          if (wasFav) next.add(numId);
          else next.delete(numId);
          return next;
        });
      }
    },
    [session?.user, ids, getFreshToken]
  );

  return (
    <FavoritesContext.Provider value={{ ids, toggle, has }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  return useContext(FavoritesContext);
}
