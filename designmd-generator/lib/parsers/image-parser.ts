import type { DesignTokens } from "../types/design-tokens";

export type ImageInputKind = "file" | "blob-url" | "base64" | "remote-url";

export interface ImageParserInput {
  sourceValue: string;
  kind: ImageInputKind;
  mediaType: string | null;
}

/** Extracts normalized design tokens from image data. */
export async function parseImageTokens(input: ImageParserInput): Promise<DesignTokens> {
  return {
    source: {
      type: "image",
      value: input.sourceValue,
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
    warnings: ["TODO: Implement Claude vision token extraction for image inputs."],
  };
}
