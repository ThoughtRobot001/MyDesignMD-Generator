import { NextResponse } from "next/server";
import { ImageParserError, parseFromImage } from "../../../../lib/parsers/image-parser";
import type { ApiResponse, ImageParseInput } from "../../../../lib/types/api";
import type { DesignTokens } from "../../../../lib/types/design-tokens";

const SUPPORTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;

export const runtime = "edge";

/** Handles image parser requests and returns normalized design tokens. */
export async function POST(request: Request): Promise<NextResponse<ApiResponse<DesignTokens>>> {
  try {
    const body = (await request.json()) as Partial<ImageParseInput> & { imageMimeType?: string };
    const input = validateImageParseInput(body);
    const tokens = await parseFromImage(input);

    return NextResponse.json({ success: true, data: tokens }, { status: 200 });
  } catch (error) {
    if (error instanceof ImageParserError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 422 });
    }

    if (error instanceof Error && error.message.startsWith("Invalid request:")) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: false, error: "Unexpected image parser route error." }, { status: 500 });
  }
}

/** Validates the image parser request body. */
function validateImageParseInput(body: Partial<ImageParseInput> & { imageMimeType?: string }): ImageParseInput {
  const mimeType = body.mimeType ?? body.imageMimeType;

  if (typeof body.imageBase64 !== "string" || body.imageBase64.trim().length === 0) {
    throw new Error("Invalid request: imageBase64 is required.");
  }

  if (typeof mimeType !== "string" || !SUPPORTED_IMAGE_TYPES.includes(mimeType as (typeof SUPPORTED_IMAGE_TYPES)[number])) {
    throw new Error("Invalid request: imageMimeType must be a supported image MIME type.");
  }

  return { imageBase64: body.imageBase64, mimeType };
}
