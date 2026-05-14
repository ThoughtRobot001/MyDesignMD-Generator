import type { ApiResponse, ValidationResponseData } from "../../../lib/types/api";

export const runtime = "edge";

/** Validates generated DESIGN.md content. */
export async function POST(_request: Request): Promise<Response> {
  const response: ApiResponse<ValidationResponseData> = {
    success: false,
    error: "TODO: Implement @google/design.md lint execution.",
  };

  return Response.json(response, { status: 501 });
}
