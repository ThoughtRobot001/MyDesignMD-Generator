import { NextResponse } from "next/server";
import { FigmaParserError, parseFromFigma } from "../../../../lib/parsers/figma-parser";
import type { ApiResponse, FigmaParseInput } from "../../../../lib/types/api";
import type { DesignTokens } from "../../../../lib/types/design-tokens";

export const runtime = "edge";

/** Handles Figma parser requests and returns normalized design tokens. */
export async function POST(request: Request): Promise<NextResponse<ApiResponse<DesignTokens>>> {
  try {
    const body = (await request.json()) as Partial<FigmaParseInput>;
    const input = validateFigmaParseInput(body, getCookie(request, "figma_token"));
    const tokens = await parseFromFigma(input);

    return NextResponse.json({ success: true, data: tokens }, { status: 200 });
  } catch (error) {
    if (error instanceof FigmaParserError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 422 });
    }

    if (error instanceof Error && error.message.startsWith("Invalid request:")) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: false, error: "Unexpected Figma parser route error." }, { status: 500 });
  }
}

/** Validates the Figma parser request body. */
function validateFigmaParseInput(body: Partial<FigmaParseInput>, cookieToken: string | null): FigmaParseInput {
  if (typeof body.figmaUrl !== "string" || !body.figmaUrl.includes("figma.com")) {
    throw new Error("Invalid request: figmaUrl must be a Figma URL.");
  }

  const manualToken = typeof body.figmaToken === "string" && body.figmaToken.trim().length > 0
    ? body.figmaToken
    : null;
  const figmaToken = manualToken ?? cookieToken;

  if (typeof figmaToken !== "string" || figmaToken.trim().length === 0) {
    throw new Error("Invalid request: figmaToken is required.");
  }

  return { figmaUrl: body.figmaUrl, figmaToken: figmaToken.trim() };
}

/** Reads a cookie value from the request header. */
function getCookie(request: Request, name: string): string | null {
  const cookie = request.headers.get("cookie") ?? "";
  const match = cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}
