import { NextResponse } from "next/server";
import { parseFromUrl, UrlParserError } from "../../../../lib/parsers/url-parser";
import type { ApiResponse, UrlParseInput } from "../../../../lib/types/api";
import type { DesignTokens } from "../../../../lib/types/design-tokens";

/** Handles URL parser requests and returns normalized design tokens. */
export async function POST(request: Request): Promise<NextResponse<ApiResponse<DesignTokens>>> {
  try {
    const body = (await request.json()) as Partial<UrlParseInput>;
    const input = validateUrlParseInput(body);
    const tokens = await parseFromUrl(input);

    return NextResponse.json({ success: true, data: tokens }, { status: 200 });
  } catch (error) {
    if (error instanceof UrlParserError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 422 });
    }

    if (error instanceof Error && error.message.startsWith("Invalid request:")) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: false, error: "Unexpected URL parser route error." }, { status: 500 });
  }
}

/** Validates the URL parser request body. */
function validateUrlParseInput(body: Partial<UrlParseInput>): UrlParseInput {
  if (typeof body.websiteUrl !== "string" || body.websiteUrl.trim().length === 0) {
    throw new Error("Invalid request: websiteUrl is required.");
  }

  try {
    new URL(body.websiteUrl);
  } catch {
    throw new Error("Invalid request: websiteUrl must be a valid URL.");
  }

  return { websiteUrl: body.websiteUrl };
}
