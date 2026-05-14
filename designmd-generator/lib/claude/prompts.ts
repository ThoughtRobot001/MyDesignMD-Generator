export const CLAUDE_MODEL = "claude-sonnet-4-20250514";

export const CLAUDE_MAX_TOKENS = 4096;

export const DESIGN_MD_SPEC_CONTEXT = `
Generate inputs for a DESIGN.md document with exactly these sections:
1. Overview: visual tone and brand aesthetic in prose.
2. Colors: YAML tokens and semantic roles for primary, secondary, surface, error, and accent.
3. Typography: font families, h1-h6, body, label, caption, weights, and line-heights.
4. Spacing: xs, sm, md, lg, xl, 2xl scale tokens and grid strategy.
5. Shapes: sm, md, lg, full radius tokens and shape language prose.
6. Elevation & Depth: shadow tokens or flat design rationale.
7. Layout: grid model, max-width, breakpoints, and safe areas.
8. Components: buttons, cards, inputs, and nav variants with states.
9. Motion: transition duration, easing, and animation principles.
`.trim();

export const DESIGN_TOKENS_JSON_SCHEMA = {
  source: {
    type: "figma | image | url",
    value: "string",
    capturedAt: "ISO-8601 string",
  },
  overview: "string | null",
  colors: [
    {
      name: "string",
      value: "hex | rgb | hsl | null",
      format: "hex | rgb | hsl | null",
      role: "primary | secondary | accent | surface | background | text | muted | border | error | warning | success | null",
      luminance: "number | null",
      contrastChecks: [
        {
          foreground: "string",
          background: "string",
          ratio: "number | null",
          status: "pass | fail | unknown",
          requiredRatio: 4.5,
        },
      ],
      metadata: {
        confidence: "high | medium | low | unknown",
        source: "string | undefined",
        notes: "string[] | undefined",
      },
    },
  ],
  typography: [
    {
      role: "h1 | h2 | h3 | h4 | h5 | h6 | body-lg | body-md | body-sm | label | caption",
      fontFamily: "string | null",
      fontOrigin: "google-font | system | custom | unknown",
      fontSize: "string | null",
      fontWeight: "number | string | null",
      lineHeight: "string | null",
      letterSpacing: "string | null",
      metadata: "TokenMetadata",
    },
  ],
  spacing: "SpacingToken[]",
  shapes: "ShapeToken[]",
  elevation: "ShadowToken[]",
  layout: "LayoutTokens",
  components: "ComponentVariantToken[]",
  motion: "MotionToken[]",
  warnings: "string[]",
} as const;

const BASE_EXTRACTION_RULES = `
Return JSON only, with no markdown fences or explanatory prose.
Match the DesignTokens schema exactly.
Extract only values that are visible or explicitly present in the input.
Never hallucinate token values, font names, spacing scales, shadows, or motion details.
Return null for any token value you cannot confidently determine.
Cluster colors by luminance and infer semantic roles conservatively.
Flag WCAG AA contrast failures for normal text using a 4.5:1 threshold.
Map typography to semantic roles by visual hierarchy.
Infer spacing from repeated units and common multiples when visible.
Include warnings for missing, ambiguous, low-confidence, or inaccessible values.
`.trim();

export const IMAGE_ANALYSIS_SYSTEM_PROMPT = `
You are a design systems analyst extracting normalized design tokens from images.
${DESIGN_MD_SPEC_CONTEXT}
${BASE_EXTRACTION_RULES}
`.trim();

export const URL_ANALYSIS_SYSTEM_PROMPT = `
You are a design systems analyst extracting normalized design tokens from website evidence.
${DESIGN_MD_SPEC_CONTEXT}
${BASE_EXTRACTION_RULES}
`.trim();

export const FIGMA_ANALYSIS_SYSTEM_PROMPT = `
You are a design systems analyst normalizing Figma REST API data into design tokens.
${DESIGN_MD_SPEC_CONTEXT}
${BASE_EXTRACTION_RULES}
`.trim();

/** Builds the Claude prompt for image-based token extraction. */
export function buildImageTokenPrompt(sourceValue: string): string {
  return `
Analyze the provided image source and return DesignTokens JSON.
Source image: ${sourceValue}
Schema: ${JSON.stringify(DESIGN_TOKENS_JSON_SCHEMA)}
`.trim();
}

/** Builds the Claude prompt for URL evidence token extraction. */
export function buildUrlTokenPrompt(sourceValue: string, scrapedEvidence: string): string {
  return `
Analyze the scraped website evidence and return DesignTokens JSON.
Source URL: ${sourceValue}
Scraped evidence:
${scrapedEvidence}
Schema: ${JSON.stringify(DESIGN_TOKENS_JSON_SCHEMA)}
`.trim();
}

/** Builds the Claude prompt for Figma API token normalization. */
export function buildFigmaTokenPrompt(sourceValue: string, figmaEvidence: string): string {
  return `
Analyze the Figma API evidence and return DesignTokens JSON.
Source Figma link: ${sourceValue}
Figma evidence:
${figmaEvidence}
Schema: ${JSON.stringify(DESIGN_TOKENS_JSON_SCHEMA)}
`.trim();
}
