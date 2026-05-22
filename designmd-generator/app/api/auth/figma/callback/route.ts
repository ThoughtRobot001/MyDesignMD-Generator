type FigmaTokenResponse = {
  access_token?: string;
};

/** Handles Figma OAuth callback, verifies state, and stores the access token. */
export async function GET(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const storedState = getCookie(request, "figma_oauth_state");

    if (!code || !state || !storedState || state !== storedState) {
      return redirectWithStatus(request, "error");
    }

    const token = await exchangeCodeForToken(code);

    if (!token) {
      return redirectWithStatus(request, "error");
    }

    const headers = new Headers({
      Location: new URL("/?figma=connected", request.url).toString(),
    });
    headers.append("Set-Cookie", `figma_token=${encodeURIComponent(token)}; HttpOnly; Path=/; Max-Age=3600; SameSite=Lax`);
    headers.append("Set-Cookie", "figma_oauth_state=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax");

    return new Response(null, { status: 302, headers });
  } catch {
    return redirectWithStatus(request, "error");
  }
}

/** Exchanges an OAuth code for a Figma access token. */
async function exchangeCodeForToken(code: string): Promise<string | null> {
  const response = await fetch("https://www.figma.com/api/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.FIGMA_CLIENT_ID!,
      client_secret: process.env.FIGMA_CLIENT_SECRET!,
      redirect_uri: process.env.FIGMA_REDIRECT_URI!,
      code,
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as FigmaTokenResponse;
  return typeof payload.access_token === "string" && payload.access_token.length > 0 ? payload.access_token : null;
}

/** Reads a cookie value from the request header. */
function getCookie(request: Request, name: string): string | null {
  const cookie = request.headers.get("cookie") ?? "";
  const match = cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

/** Redirects back to the app with a Figma OAuth status. */
function redirectWithStatus(request: Request, status: "connected" | "error"): Response {
  return Response.redirect(new URL(`/?figma=${status}`, request.url));
}
