import { describe, expect, it } from "vitest";
import { parseFromImage as parseImageTokens, type ImageParserInput } from "../../lib/parsers/image-parser";

describe("parseImageTokens", () => {
  /** Verifies the image parser returns the normalized token contract. */
  it("returns a DesignTokens-shaped result", async (): Promise<void> => {
    const input: ImageParserInput = {
      sourceValue: "data:image/png;base64,example",
      kind: "base64",
      mediaType: "image/png",
    };

    const result = await parseImageTokens(input);

    expect(result.source.type).toBe("image");
    expect(result.typography).toEqual([]);
  });
});
