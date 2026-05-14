import type { DesignTokens } from "../types/design-tokens";

export interface FigmaParserInput {
  sourceUrl: string;
  fileKey: string;
  apiResponse: unknown;
}

/** Extracts normalized design tokens from Figma API data. */
export async function parseFigmaTokens(input: FigmaParserInput): Promise<DesignTokens> {
  return {
    source: {
      type: "figma",
      value: input.sourceUrl,
      capturedAt: new Date().toISOString(),
    },
    overview: null,
    colors: [],
    typography: [],
    spacing: [],
    shapes: [],
    elevation: [],
    layout: {
      gridStrategy: null,
      maxWidth: null,
      safeArea: null,
      breakpoints: [],
    },
    components: [],
    motion: [],
    warnings: ["TODO: Implement Figma API response traversal and token extraction."],
  };
}
