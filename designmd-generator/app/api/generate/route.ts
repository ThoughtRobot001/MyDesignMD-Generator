import { ClientError } from "../../../lib/claude/client";
import { GeneratorError, generateDesignMdStream } from "../../../lib/generators/design-md-generator";
import { FigmaParserError, parseFromFigma } from "../../../lib/parsers/figma-parser";
import { ImageParserError, parseFromImage } from "../../../lib/parsers/image-parser";
import { UrlParserError, parseFromUrl } from "../../../lib/parsers/url-parser";
import type { GenerateRequest } from "../../../lib/types/api";
import type { DesignTokens } from "../../../lib/types/design-tokens";

/** Handles the full parse and DESIGN.md generation flow. */
export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as Partial<GenerateRequest>;
    const input = validateGenerateRequest(body, getCookie(request, "figma_token"));
    const encoder = new TextEncoder();
    const tokens = await parseByInputType(input);

    return new Response(
      new ReadableStream({
        async start(controller) {
          try {
            controller.enqueue(encoder.encode(formatTokenEnvelope(tokens)));

            await generateDesignMdStream(tokens, (chunk) => {
              controller.enqueue(encoder.encode(chunk));
            });

            controller.close();
          } catch (error) {
            console.error("[/api/generate] Streaming error:", error);
            const message = getRouteErrorMessage(error);
            controller.enqueue(encoder.encode(`Generation failed: ${message}`));
            controller.close();
          }
        },
      }),
      { headers: { "Content-Type": "text/plain; charset=utf-8" } }
    );
  } catch (error) {
    console.error("[/api/generate] Unhandled error:", error);
    if (error instanceof UrlParserError || error instanceof ImageParserError || error instanceof FigmaParserError) {
      return textError(error.message, 422);
    }

    if (error instanceof GeneratorError) {
      console.error("[/api/generate] GeneratorError cause:", (error as GeneratorError).cause);
      const cause = (error as GeneratorError).cause;
      const message = cause instanceof ClientError ? cause.message : "DESIGN.md generation failed.";
      return textError(message, 500);
    }

    if (error instanceof ClientError) {
      return textError(error.message, 502);
    }

    if (error instanceof Error && error.message.startsWith("Invalid request:")) {
      return textError(error.message, 400);
    }

    return textError("Unexpected generate route error.", 500);
  }
}

/** Returns a plain text error response for the streaming endpoint. */
function textError(message: string, status: number): Response {
  return new Response(message, {
    status,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

/** Extracts a visible message for stream-time generation failures. */
function getRouteErrorMessage(error: unknown): string {
  if (error instanceof GeneratorError) {
    const cause = error.cause;
    return cause instanceof ClientError ? cause.message : error.message;
  }

  if (error instanceof ClientError || error instanceof Error) {
    return error.message;
  }

  return "Unexpected generate route error.";
}

/** Validates the generate request body for the selected input type. */
function validateGenerateRequest(body: Partial<GenerateRequest>, figmaCookieToken: string | null): GenerateRequest {
  if (body.inputType !== "figma" && body.inputType !== "image" && body.inputType !== "url") {
    throw new Error("Invalid request: inputType must be figma, image, or url.");
  }

  if (body.inputType === "figma" && !body.figmaUrl) {
    throw new Error("Invalid request: figmaUrl is required.");
  }

  if (body.inputType === "figma") {
    const manualToken = typeof body.figmaToken === "string" && body.figmaToken.trim().length > 0
      ? body.figmaToken
      : null;
    const figmaToken = manualToken ?? figmaCookieToken;
    if (!figmaToken) {
      throw new Error("Invalid request: figmaToken is required.");
    }

    return { ...body, figmaToken } as GenerateRequest;
  }

  if (body.inputType === "image" && (!body.imageBase64 || !body.imageMimeType)) {
    throw new Error("Invalid request: imageBase64 and imageMimeType are required.");
  }

  if (body.inputType === "url" && !body.websiteUrl) {
    throw new Error("Invalid request: websiteUrl is required.");
  }

  return body as GenerateRequest;
}

/** Reads a cookie value from the request header. */
function getCookie(request: Request, name: string): string | null {
  const cookie = request.headers.get("cookie") ?? "";
  const match = cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

/** Routes a valid generation request to the correct parser. */
async function parseByInputType(input: GenerateRequest): Promise<DesignTokens> {
  if (input.inputType === "url") {
    return parseFromUrl({ websiteUrl: input.websiteUrl ?? "" });
  }

  if (input.inputType === "image") {
    return parseFromImage({ imageBase64: input.imageBase64 ?? "", mimeType: input.imageMimeType ?? "" });
  }

  return parseFromFigma({ figmaUrl: input.figmaUrl ?? "", figmaToken: input.figmaToken ?? "" });
}

/** Sends normalized tokens ahead of markdown so the UI can render accurate spec tabs. */
function formatTokenEnvelope(tokens: DesignTokens): string {
  return `<!--DESIGNMD_TOKENS:${encodeURIComponent(JSON.stringify(tokens))}-->\n`;
}
