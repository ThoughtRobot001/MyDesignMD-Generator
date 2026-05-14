import { describe, expect, it } from "vitest";
import { parseFigmaTokens, type FigmaParserInput } from "../../lib/parsers/figma-parser";

describe("parseFigmaTokens", () => {
  /** Verifies the Figma parser returns the normalized token contract. */
  it("returns a DesignTokens-shaped result", async (): Promise<void> => {
    const input: FigmaParserInput = {
      sourceUrl: "https://figma.com/file/example",
      fileKey: "example",
      apiResponse: {},
    };

    const result = await parseFigmaTokens(input);

    expect(result.source.type).toBe("figma");
    expect(result.colors).toEqual([]);
  });
});
