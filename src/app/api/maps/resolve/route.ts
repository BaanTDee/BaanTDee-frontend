import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return NextResponse.json({ error: "missing url" }, { status: 400 });

  try {
    // Follow redirects server-side (Next.js server can reach Google)
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(8000),
    });
    const finalUrl = res.url;

    // Extract @lat,lng from the resolved URL
    const atMatch = finalUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (atMatch) {
      return NextResponse.json({ lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]), url: finalUrl });
    }
    // Extract ?q=lat,lng format
    const qMatch = finalUrl.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (qMatch) {
      return NextResponse.json({ lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]), url: finalUrl });
    }

    return NextResponse.json({ url: finalUrl });
  } catch {
    return NextResponse.json({ error: "failed to resolve" }, { status: 500 });
  }
}
