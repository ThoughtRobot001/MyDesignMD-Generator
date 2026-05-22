/** Reports whether a Figma OAuth token exists without exposing it. */
export function GET(request: Request): Response {
  const token = getCookie(request, "figma_token");
  const hasToken = Boolean(token);

  return Response.json({ connected: hasToken, hasToken });
}

/** Clears the Figma OAuth token cookie. */
export function DELETE(): Response {
  return Response.json(
    { connected: false, hasToken: false },
    {
      headers: {
        "Set-Cookie": "figma_token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax",
      },
    }
  );
}

/** Reads a cookie value from the request header. */
function getCookie(request: Request, name: string): string | null {
  const cookie = request.headers.get("cookie") ?? "";
  const match = cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}
