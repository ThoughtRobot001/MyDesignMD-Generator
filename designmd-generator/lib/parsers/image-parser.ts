import { CLAUDE_MAX_TOKENS, CLAUDE_MODEL, buildImageAnalysisPrompt } from "../claude/prompts";
import { aiClient } from "../claude/client";
import type { ImageParseInput } from "../types/api";
import type { ColorRole, ColorToken, ComponentToken, DesignTokens } from "../types/design-tokens";
const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
const SUPPORTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
export class ImageParserError extends Error {
  /** Creates a typed image parser error with an optional cause. */
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = "ImageParserError";
  }
}

/** Parses an image input into normalized design tokens. */
export async function parseFromImage(input: ImageParseInput): Promise<DesignTokens> {
  validateImage(input.imageBase64, input.mimeType);
  const [componentInventory, tokens] = await Promise.all([
    inventoryComponents(input.imageBase64, input.mimeType),
    callClaudeVision(input.imageBase64, input.mimeType, null),
  ]);

  if (componentInventory && tokens.components.length === 0) {
    tokens.components = mapInventoryToComponents(componentInventory);
  }

  return {
    ...tokens,
    colors: normalizeColors(tokens),
    meta: {
      source: "image",
      extractedAt: new Date().toISOString(),
      confidence: 0.75,
      warnings: tokens.meta?.warnings ?? [],
    },
  };
}

/** Validates image MIME type, presence, and approximate payload size. */
function validateImage(base64: string, mimeType: string): void {
  if (!SUPPORTED_IMAGE_TYPES.includes(mimeType as (typeof SUPPORTED_IMAGE_TYPES)[number])) {
    throw new ImageParserError(`Unsupported image MIME type: ${mimeType}`);
  }

  if (base64.trim().length === 0) {
    throw new ImageParserError("Image base64 content cannot be empty.");
  }

  if (base64.length * 0.75 > MAX_IMAGE_BYTES) {
    throw new ImageParserError("Image payload exceeds the 20MB limit.");
  }
}
/** Calls Claude vision to extract normalized design tokens from an image. */
async function callClaudeVision(base64: string, mimeType: string, componentInventory: string | null): Promise<DesignTokens> {
  const prompt = buildImageAnalysisPrompt({ mimeType });
  const userText = componentInventory ? `COMPONENT INVENTORY (pre-analyzed, use these exact colors):
${componentInventory}

These colors were sampled directly from the pixels.
Use them when populating the components array in your response.
Do not contradict these color values.

${prompt.user}` : prompt.user;

  const raw = await aiClient({
    system: prompt.system,
    maxTokens: 4096,
    messages: [
      {
        role: "user",
        content: [
          { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64}` } },
          { type: "text", text: userText },
        ],
      }
    ],
  });
  const parsed = parseClaudeJson(raw);

  return assertDesignTokens(parsed);
}

/** Performs a pre-analysis pass to inventory all visible UI components in the image. */
async function inventoryComponents(base64: string, mimeType: string): Promise<string> {
  const raw = await aiClient({
    system: `You are a precise UI analyst. Describe every interactive component you can see in this screenshot.
For each component state:
- What is the exact background color (sample the pixels)
- What is the exact text color
- What is the border color if any
- What is the border radius (estimate in px)
- What size is it
Be extremely literal. Only describe what you can see.
Do not infer. Do not use design system names.
Return JSON array of components.`,
    maxTokens: 1000,
    messages: [
      {
        role: "user",
        content: [
          { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64}` } },
          {
            type: "text",
            text: `List every button, input, navigation item, card, and interactive element visible. For each one describe its exact visual properties right now in its current state.

Return ONLY this JSON structure:
[
  {
    "componentFamily": "generic design system name (e.g., Button, Input, Card, Badge, Navigation, Modal)",
    "literalDescription": "what this specific instance is (e.g., 'Search Projects input', 'Upgrade to Pro button')",
    "currentState": "what state it appears to be in",
    "backgroundColor": "exact hex you can see",
    "textColor": "exact hex you can see",
    "borderColor": "exact hex or null",
    "borderRadius": "estimated px",
    "notes": "anything notable about this component"
  }
]`,
          },
        ],
      },
    ],
  });

  try {
    const parsed = parseClaudeJson(raw);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return raw;
  }
}
/** Converts raw component inventory JSON into normalized component tokens. */
function mapInventoryToComponents(inventory: string): ComponentToken[] {
  let parsed: unknown;

  try {
    parsed = parseClaudeJson(inventory);
  } catch {
    return [];
  }

  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed
    .map((item) => {
      const record = getOptionalRecord(item);
      if (record === null) {
        return null;
      }

      const name = getString(record.componentFamily) ?? "Component";
      const state = getString(record.currentState) ?? "default";
      const description = getString(record.literalDescription);
      const notes = [
        getString(record.notes),
        getString(record.backgroundColor) ? `Background ${getString(record.backgroundColor)}` : null,
        getString(record.textColor) ? `Text ${getString(record.textColor)}` : null,
        getString(record.borderColor) ? `Border ${getString(record.borderColor)}` : null,
        getString(record.borderRadius) ? `Radius ${getString(record.borderRadius)}` : null,
      ].filter((part): part is string => part !== null).join(". ");

      return {
        name,
        variants: [
          {
            name: state,
            description,
            states: [state],
          },
        ],
        notes: notes.length > 0 ? notes : null,
      };
    })
    .filter((component): component is ComponentToken => component !== null && component.name.trim().length > 0);
}
/** Deduplicates colors, assigns roles, and computes basic WCAG status. */
function normalizeColors(tokens: DesignTokens): ColorToken[] {
  const unique = new Map<string, ColorToken>();

  for (const color of tokens.colors) {
    if (color.hex === null) {
      continue;
    }

    const normalizedHex = normalizeHex(color.hex);
    const luminance = hexToLuminance(normalizedHex);
    const role = chooseColorRole(color.role, normalizedHex, luminance);

    unique.set(normalizedHex.toLowerCase(), {
      hex: normalizedHex,
      role,
      wcagAA: hasAccessibleContrast(normalizedHex, 4.5),
      wcagAAA: hasAccessibleContrast(normalizedHex, 7),
    });
  }

  return Array.from(unique.values());
}
/** Converts a HEX color into WCAG relative luminance. */
function hexToLuminance(hex: string): number {
  const normalized = normalizeHex(hex).replace("#", "");
  const channels = [0, 2, 4].map((offset) => parseInt(normalized.slice(offset, offset + 2), 16) / 255);
  const [red, green, blue] = channels.map((channel) =>
    channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
  );

  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}
/** Parses Claude JSON output and normalizes accidental markdown fences. */
function parseClaudeJson(raw: string): unknown {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "");

  try {
    return JSON.parse(cleaned) as unknown;
  } catch (error) {
    throw new ImageParserError("Claude returned invalid JSON for image parsing.", error);
  }
}
/** Chooses a conservative color role from luminance and saturation. */
function chooseColorRole(existingRole: ColorRole, hex: string, luminance: number): ColorRole {
  if (existingRole !== "unknown") {
    return existingRole;
  }

  if (luminance > 0.85) {
    return "surface";
  }

  if (luminance < 0.15) {
    return "primary";
  }

  return getSaturation(hex) > 0.45 ? "accent" : "secondary";
}
/** Calculates whether a color passes contrast against white or black. */
function hasAccessibleContrast(hex: string, threshold: number): boolean {
  return Math.max(getContrastRatio(hex, "#ffffff"), getContrastRatio(hex, "#000000")) >= threshold;
}
/** Calculates the WCAG contrast ratio between two HEX colors. */
function getContrastRatio(firstHex: string, secondHex: string): number {
  const first = hexToLuminance(firstHex);
  const second = hexToLuminance(secondHex);
  const lighter = Math.max(first, second);
  const darker = Math.min(first, second);

  return (lighter + 0.05) / (darker + 0.05);
}
/** Normalizes short or long HEX values to uppercase #RRGGBB format. */
function normalizeHex(hex: string): string {
  const cleaned = hex.trim().replace("#", "");
  const expanded =
    cleaned.length === 3
      ? cleaned
          .split("")
          .map((char) => `${char}${char}`)
          .join("")
      : cleaned;

  return `#${expanded.slice(0, 6).padEnd(6, "0").toUpperCase()}`;
}
/** Estimates saturation from a HEX color. */
function getSaturation(hex: string): number {
  const normalized = normalizeHex(hex).replace("#", "");
  const channels = [0, 2, 4].map((offset) => parseInt(normalized.slice(offset, offset + 2), 16) / 255);
  const max = Math.max(...channels);
  const min = Math.min(...channels);

  return max === 0 ? 0 : (max - min) / max;
}
/** Extracts text content from a Claude SDK response. */
function extractClaudeText(response: unknown): string {
  const content = getRecord(response).content;

  if (!Array.isArray(content)) {
    throw new ImageParserError("Claude response did not include content.");
  }

  return content
    .map((item) => getRecord(item))
    .filter((item) => item.type === "text" && typeof item.text === "string")
    .map((item) => item.text)
    .join("");
}
/** Validates the minimum token shape returned by Claude. */
function assertDesignTokens(value: unknown): DesignTokens {
  const record = getRecord(value);

  if (!Array.isArray(record.colors) || !Array.isArray(record.typography)) {
    throw new ImageParserError("Claude JSON is missing required token arrays.");
  }

  return record as DesignTokens;
}
/** Narrows an unknown value to a string-keyed record. */
function getRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null) {
    throw new ImageParserError("Expected a JSON object.");
  }

  return value as Record<string, unknown>;
}
/** Narrows optional parsed JSON objects without throwing. */
function getOptionalRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? value as Record<string, unknown> : null;
}
/** Reads a string from unknown parsed JSON. */
function getString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}
