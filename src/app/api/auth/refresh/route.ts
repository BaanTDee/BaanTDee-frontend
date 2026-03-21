import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

/**
 * Proxy for backend /auth/refresh.
 * The backend reads the refresh token from an HttpOnly cookie,
 * but the browser can't programmatically set the Cookie header.
 * This server-side route receives the token in the body and
 * forwards it as a Cookie to the backend.
 */
export async function POST(req: NextRequest) {
  try {
    const { refresh_token } = await req.json();
    if (!refresh_token) {
      return NextResponse.json(
        { success: false, error: { code: "NO_TOKEN", message: "Missing refresh_token" } },
        { status: 400 }
      );
    }

    const backendRes = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `refresh_token=${refresh_token}`,
      },
    });

    const data = await backendRes.json();

    // Extract new refresh token from backend Set-Cookie header
    const setCookie = backendRes.headers.get("set-cookie");
    let newRefreshToken: string | undefined;
    if (setCookie) {
      const match = setCookie.match(/refresh_token=([^;]+)/);
      newRefreshToken = match?.[1];
    }

    if (data.success && data.data) {
      return NextResponse.json({
        success: true,
        data: {
          access_token: data.data.access_token,
          refresh_token: newRefreshToken || data.data.refresh_token,
          user: data.data.user,
        },
      });
    }

    return NextResponse.json(data, { status: backendRes.status });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "REFRESH_FAILED", message: "Token refresh failed" } },
      { status: 500 }
    );
  }
}
