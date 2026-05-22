import { describe, expect, it } from "vitest";
import { parseFromUrl as parseUrlTokens, type UrlParserInput } from "../../lib/parsers/url-parser";

describe("parseUrlTokens", () => {
  /** Verifies the URL parser returns the normalized token contract. */
  it("returns a DesignTokens-shaped result", async (): Promise<void> => {
    const input: UrlParserInput = {
      sourceUrl: "https://example.com",
      html: null,
      cssText: null,
      screenshotUrl: null,
    };

    const result = await parseUrlTokens(input);

    expect(result.source.type).toBe("url");
    expect(result.spacing).toEqual([]);
  });
});
