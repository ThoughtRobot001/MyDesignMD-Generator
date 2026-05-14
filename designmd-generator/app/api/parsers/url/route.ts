import type { ApiResponse, ParserResponseData } from "../../../../../lib/types/api";

export const runtime = "edge";

/** Parses design tokens from a website URL input request. */
export async function POST(_request: Request): Promise<Response> {
  const response: ApiResponse<ParserResponseData> = {
    success: false,
    error: "TODO: Implement website scraping and URL token extraction.",
  };

  return Response.json(response, { status: 501 });
}
