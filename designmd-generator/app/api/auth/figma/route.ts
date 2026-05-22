/** Redirects the user to Figma OAuth with a CSRF state cookie. */
export function GET(): Response {
  const state = crypto.randomUUID();
  const params = new URLSearchParams({
    client_id: process.env.FIGMA_CLIENT_ID!,
    redirect_uri: process.env.FIGMA_REDIRECT_URI!,
    scope: "file_read",
    state,
    response_type: "code",
  });

  return new Response(null, {
    status: 302,
    headers: {
      Location: `https://www.figma.com/oauth?${params.toString()}`,
      "Set-Cookie": `figma_oauth_state=${state}; HttpOnly; Path=/; Max-Age=600; SameSite=Lax`,
    },
  });
}
