import { describe, expect, it } from "vitest";
import { generateDesignMd } from "../../lib/generators/design-md-generator";
import type { DesignTokens } from "../../lib/types/design-tokens";

const TOKENS_FIXTURE: DesignTokens = {
  source: {
    type: "url",
    value: "https://example.com",
    capturedAt: "2026-05-14T00:00:00.000Z",
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
  warnings: [],
};

describe("generateDesignMd", () => {
  /** Verifies the generator includes every required DESIGN.md section. */
  it("renders all required DESIGN.md sections", (): void => {
    const markdown = generateDesignMd(TOKENS_FIXTURE, {
      title: "Example",
      includeWarnings: false,
    });

    expect(markdown).toContain("## Overview");
    expect(markdown).toContain("## Colors");
    expect(markdown).toContain("## Typography");
    expect(markdown).toContain("## Spacing");
    expect(markdown).toContain("## Shapes");
    expect(markdown).toContain("## Elevation & Depth");
    expect(markdown).toContain("## Layout");
    expect(markdown).toContain("## Components");
    expect(markdown).toContain("## Motion");
  });
});
