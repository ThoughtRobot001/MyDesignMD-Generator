import type { DesignTokens } from "../types/design-tokens";

export interface UrlParserInput {
  sourceUrl: string;
  html: string | null;
  cssText: string | null;
  screenshotUrl: string | null;
}

/** Extracts normalized design tokens from scraped website data. */
export async function parseUrlTokens(input: UrlParserInput): Promise<DesignTokens> {
  return {
    source: {
      type: "url",
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
    warnings: ["TODO: Implement CSS scraping and Claude-assisted URL token extraction."],
  };
}
