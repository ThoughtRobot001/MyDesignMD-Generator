import { aiClient, aiClientStream } from "../claude/client";
import { CLAUDE_MAX_TOKENS, CLAUDE_MODEL, buildOverviewProsePrompt, buildDesignMdGeneratorPrompt } from "../claude/prompts";
import type { RenderedYamlBlocks } from "../claude/prompts";
import type { DesignMdDocument, DesignMdSection } from "../types/design-md";
import type { ColorToken, ComponentToken, DesignTokens, MotionToken, ShapeToken, TypographyToken } from "../types/design-tokens";
const ORDER = ["overview", "colors", "typography", "spacing", "shapes", "elevation", "layout", "components", "motion", "guidelines", "responsive", "iteration"] as const;
export class GeneratorError extends Error {
  /** Creates a typed generator error with optional section and cause details. */
  constructor(message: string, public section?: string, public cause?: unknown) {
    super(message);
    this.name = "GeneratorError";
  }
}
/** Generates a complete structured DESIGN.md document from normalized tokens. */
export async function generateDesignMd(tokens: DesignTokens): Promise<DesignMdDocument> {
  try {
    // Pre-render all YAML blocks so the AI receives exact, pre-calculated tokens.
    const renderedYaml = buildRenderedYamlBlocks(tokens);

    const prompt = buildDesignMdGeneratorPrompt({
      tokens,
      renderedYaml,
      behavioralIntelligence: tokens.meta.behavioralIntelligence,
    });

    console.time("4-generate-markdown");
    const rawMarkdown = await aiClientStream({
      system: prompt.system,
      maxTokens: 8192,
      messages: [{ role: "user", content: prompt.user }],
    }, () => {});
    console.timeEnd("4-generate-markdown");

    // Strip any accidental outer code fence the model might have added.
    const cleanMarkdown = sanitizeMarkdownColors(rawMarkdown, tokens)
      .trim()
      .replace(/^```(?:markdown|md)?\s*/i, "")
      .replace(/\s*```$/i, "");

    const frontMatter = buildFrontMatter(tokens);
    const raw = cleanMarkdown.startsWith("---")
      ? cleanMarkdown
      : `${frontMatter}\n\n${cleanMarkdown}`;

    return {
      name: getDocumentName(tokens),
      version: "1.0.0",
      sections: buildSectionsFromRaw(raw),
      raw,
      isValid: false,
      lintResult: null,
    };
  } catch (error) {
    throw new GeneratorError("Failed to assemble DESIGN.md document.", undefined, error);
  }
}

/** Streams a complete DESIGN.md document from normalized tokens. */
export async function generateDesignMdStream(
  tokens: DesignTokens,
  onChunk: (chunk: string) => void
): Promise<DesignMdDocument> {
  try {
    const renderedYaml = buildRenderedYamlBlocks(tokens);

    const prompt = buildDesignMdGeneratorPrompt({
      tokens,
      renderedYaml,
      behavioralIntelligence: tokens.meta.behavioralIntelligence,
    });

    console.time("4-generate-markdown");
    const colorGuard = createStreamingColorGuard(tokens, onChunk);
    const rawMarkdown = await aiClientStream({
      system: prompt.system,
      maxTokens: 8192,
      messages: [{ role: "user", content: prompt.user }],
    }, colorGuard.push);
    colorGuard.flush();
    console.timeEnd("4-generate-markdown");

    const cleanMarkdown = sanitizeMarkdownColors(rawMarkdown, tokens)
      .trim()
      .replace(/^```(?:markdown|md)?\s*/i, "")
      .replace(/\s*```$/i, "");

    const frontMatter = buildFrontMatter(tokens);
    const raw = cleanMarkdown.startsWith("---")
      ? cleanMarkdown
      : `${frontMatter}\n\n${cleanMarkdown}`;

    return {
      name: getDocumentName(tokens),
      version: "1.0.0",
      sections: buildSectionsFromRaw(raw),
      raw,
      isValid: false,
      lintResult: null,
    };
  } catch (error) {
    throw new GeneratorError("Failed to stream DESIGN.md document.", undefined, error);
  }
}

/** Pre-renders all YAML blocks from the normalized tokens. */
function buildRenderedYamlBlocks(tokens: DesignTokens): RenderedYamlBlocks {
  const colorsSection = renderColors(tokens);
  const typographySection = renderTypography(tokens);
  const spacingSection = renderSpacing(tokens);
  const shapesSection = renderShapes(tokens);
  const elevationSection = renderElevation(tokens);
  const motionSection = renderMotion(tokens);

  return {
    colors: colorsSection.yaml,
    typography: typographySection.yaml,
    spacing: spacingSection.yaml,
    shapes: shapesSection.yaml,
    elevation: elevationSection.yaml,
    motion: motionSection.yaml,
  };
}

/** Extracts lightweight section stubs from the raw markdown for downstream compatibility. */
function buildSectionsFromRaw(raw: string): DesignMdDocument["sections"] {
  const extractSection = (title: string): DesignMdSection => ({
    title,
    yaml: null,
    prose: "",
  });

  return {
    overview: extractSection("Overview"),
    colors: extractSection("Colors"),
    typography: extractSection("Typography"),
    spacing: extractSection("Spacing"),
    shapes: extractSection("Shapes"),
    elevation: extractSection("Elevation & Depth"),
    layout: extractSection("Layout"),
    components: extractSection("Components"),
    motion: extractSection("Motion"),
    guidelines: extractSection("Do's and Don'ts"),
    responsive: extractSection("Responsive Behavior"),
    iteration: extractSection("Iteration Guide"),
  };
}

/** Builds the YAML front matter block for the document. */
function buildFrontMatter(tokens: DesignTokens): string {
  const data = {
    name: getDocumentName(tokens),
    generated: tokens.meta.extractedAt,
    source: tokens.meta.source,
    confidence: tokens.meta.confidence,
  };
  const yaml = Object.entries(data)
    .map(([k, v]) => `${k}: "${String(v)}"`)
    .join("\n");
  return `---\n${yaml}\n---`;
}


/** Renders the prose-only Overview section. */
async function renderOverview(tokens: DesignTokens): Promise<DesignMdSection> {
  try {
    const prompt = buildOverviewProsePrompt({ colors: tokens.colors, typography: tokens.typography });
    const raw = await aiClient({ system: prompt.system, messages: [{ role: "user", content: prompt.user }] });
    return { title: "Overview", yaml: null, prose: parseOverviewResponse(raw) };
  } catch (error) {
    return fallbackSection("Overview", error);
  }
}
/** Renders the Colors section from semantic color tokens. */
function renderColors(tokens: DesignTokens): DesignMdSection {
  try {
    const counts = new Map<string, number>();
    const colors = tokens.colors.filter((color) => color.hex !== null && color.role !== "unknown");
    if (colors.length === 0) return { title: "Colors", yaml: null, prose: "No colors were detected. Define semantic color tokens manually before production use." };

    // Build YAML keys and prose in a single coordinated pass so each color
    // gets the correct disambiguated key (text, text2, …) in both places.
    const entries: Array<{ key: string; color: ColorToken }> = colors.map((color) => ({
      key: uniqueRoleKey(color, counts),
      color,
    }));

    const yaml = buildYamlBlock({ colors: Object.fromEntries(entries.map(({ key, color }) => [key, color.hex])) });
    const prose = entries.map(({ key, color }) => `${key} supports ${describeColorPurpose(color)}.`).join(" ");

    return { title: "Colors", yaml, prose };
  } catch (error) {
    return fallbackSection("Colors", error);
  }
}
/** Renders the Typography section from text style tokens. */
function renderTypography(tokens: DesignTokens): DesignMdSection {
  try {
    const entries = tokens.typography.filter((token) => token.role !== "unknown");
    const typography = Object.fromEntries(entries.map((token) => [token.role, compactTypography(token)]));
    const prose = entries.length === 0 ? "Typography scale could not be determined from the provided source." : `The type hierarchy uses ${summarizeFonts(entries)} to separate display, body, and utility text.`;
    return { title: "Typography", yaml: entries.length > 0 ? buildYamlBlock({ typography }) : null, prose };
  } catch (error) {
    return fallbackSection("Typography", error);
  }
}
/** Renders the Spacing section from the inferred spacing scale. */
function renderSpacing(tokens: DesignTokens): DesignMdSection {
  try {
    const spacing = Object.fromEntries(tokens.spacing.tokens.filter((token) => token.value !== null).map((token) => [token.name, token.value]));
    const yaml = Object.keys(spacing).length === 0 ? null : `# base unit: ${tokens.spacing.baseUnit ?? "unknown"}px\n${buildYamlBlock({ spacing })}`;
    const prose = yaml === null ? "Spacing scale could not be determined. Define a base unit and named spacing tokens manually." : `Spacing follows a ${tokens.spacing.baseUnit ?? "detected"}px base unit for predictable layout rhythm.`;
    return { title: "Spacing", yaml, prose };
  } catch (error) {
    return fallbackSection("Spacing", error);
  }
}
/** Renders the Shapes section from radius tokens. */
function renderShapes(tokens: DesignTokens): DesignMdSection {
  try {
    const validShapes = tokens.shapes.filter((s) => s.px !== null);

    if (validShapes.length === 0) {
      const defaults = {
        none: "0px",
        xs: "2px",
        sm: "4px",
        md: "8px",
        lg: "12px",
        xl: "16px",
        pill: "9999px",
      };
      return {
        title: "Shapes",
        yaml: buildYamlBlock({ rounded: defaults }),
        prose: "Shape scale uses sensible defaults — refine based on your actual component library.",
      };
    }

    const rounded: Record<string, string> = {};
    let maxNonPill = -1;

    for (const shape of validShapes) {
      const px = shape.px as number;
      let key = "";
      if (px === 0) key = "none";
      else if (px <= 3) key = "xs";
      else if (px <= 6) key = "sm";
      else if (px <= 12) key = "md";
      else if (px <= 20) key = "lg";
      else if (px <= 40) key = "xl";
      else if (px <= 9998) key = "2xl";
      else key = "pill";

      // Prevent overwriting a previously assigned key if we just want a simple mapping
      // We will assign it if not already present
      if (!(key in rounded)) {
        rounded[key] = shape.value ?? `${px}px`;
      }

      if (px < 9999 && px > maxNonPill) {
        maxNonPill = px;
      }
    }

    let prose = "";
    if (maxNonPill === -1) {
      prose = "Expressive rounding — strong pill tendency signals a modern, product-led aesthetic";
    } else if (maxNonPill <= 4) {
      prose = "Architectural precision — sharp edges signal a structured, data-focused interface";
    } else if (maxNonPill <= 10) {
      prose = "Approachable geometry — subtle rounding reduces rigidity without losing precision";
    } else if (maxNonPill <= 20) {
      prose = "Friendly and open — generous radius creates warmth and consumer-grade approachability";
    } else {
      prose = "Expressive rounding — strong pill tendency signals a modern, product-led aesthetic";
    }

    return {
      title: "Shapes",
      yaml: buildYamlBlock({ rounded }),
      prose,
    };
  } catch (error) {
    return fallbackSection("Shapes", error);
  }
}

/**
 * Resolves a ShapeToken to a canonical named token when its name is a CSS
 * variable reference (starts with '--'). Maps the px value to the closest
 * named size bucket.
 */
function resolveShapeToken(shape: ShapeToken): ShapeToken {
  if (!shape.name.startsWith("--")) return shape;

  const px = shape.px;

  if (px === null) return shape;

  // Pill shorthand
  if (px >= 9999) return { name: "pill", value: "9999px", px: 9999 };

  // Map to named bucket
  let bucketName: string;
  if (px <= 0) {
    bucketName = "none";
  } else if (px <= 3) {
    bucketName = "xs";
  } else if (px <= 6) {
    bucketName = "sm";
  } else if (px <= 12) {
    bucketName = "md";
  } else if (px <= 20) {
    bucketName = "lg";
  } else {
    bucketName = "xl";
  }

  // '0' and '0px' → canonical 'none' with value '0px'
  const resolvedValue = px <= 0 ? "0px" : shape.value ?? `${px}px`;

  return { name: bucketName, value: resolvedValue, px };
}
/** Renders the Elevation & Depth section from shadow tokens. */
function renderElevation(tokens: DesignTokens): DesignMdSection {
  try {
    const shadows = tokens.elevation.filter((shadow) => !shadow.isFlat && shadow.value !== null);
    if (shadows.length === 0) return { title: "Elevation & Depth", yaml: null, prose: "This design uses a flat visual hierarchy. Depth is communicated through color contrast and spacing rather than shadows." };
    return { title: "Elevation & Depth", yaml: buildYamlBlock({ elevation: Object.fromEntries(shadows.map((shadow) => [shadow.name, shadow.value])) }), prose: "Elevation uses restrained shadows to separate interactive surfaces and layered content." };
  } catch (error) {
    return fallbackSection("Elevation & Depth", error);
  }
}
/** Renders the prose-only Layout section from breakpoint tokens. */
function renderLayout(tokens: DesignTokens): DesignMdSection {
  try {
    const defaults = [{ name: "sm", minWidth: "640px" }, { name: "md", minWidth: "768px" }, { name: "lg", minWidth: "1024px" }, { name: "xl", minWidth: "1280px" }];
    const breakpoints = tokens.breakpoints.length > 0 ? tokens.breakpoints : defaults;
    return { title: "Layout", yaml: null, prose: `Layout uses a responsive grid with a default max-width of 1200px. Breakpoints: ${breakpoints.map((point) => `${point.name} ${point.minWidth}`).join(", ")}. Containers should preserve safe-area padding on narrow viewports.` };
  } catch (error) {
    return fallbackSection("Layout", error);
  }
}
/** Renders the prose-only Components section from component tokens. */
function renderComponents(tokens: DesignTokens): DesignMdSection {
  try {
    const prose = tokens.components.length === 0 ? "No components were detected. Define key components, variants, and interaction states manually." : tokens.components.map(renderComponentProse).join("\n\n");
    return { title: "Components", yaml: null, prose };
  } catch (error) {
    return fallbackSection("Components", error);
  }
}
/** Renders the Motion section from motion tokens or sensible defaults. */
function renderMotion(tokens: DesignTokens): DesignMdSection {
  try {
    const entries = tokens.motion.length > 0 ? tokens.motion : getDefaultMotion();
    const motion = Object.fromEntries(entries.map((token) => [token.name, { duration: token.duration, easing: token.easing }]));
    const suffix = tokens.motion.length === 0 ? " These are defaults because no motion tokens were detected." : "";
    return { title: "Motion", yaml: buildYamlBlock({ motion }), prose: `Motion should clarify state changes without distracting from content.${suffix}` };
  } catch (error) {
    return fallbackSection("Motion", error);
  }
}
/** Assembles all sections into the final raw DESIGN.md string. */
function assembleDocument(sections: Record<string, DesignMdSection>, tokens: DesignTokens): string {
  const frontMatter = buildYamlBlock({ name: getDocumentName(tokens), generated: tokens.meta.extractedAt, source: tokens.meta.source, confidence: tokens.meta.confidence });
  return `---\n${frontMatter}\n---\n\n${ORDER.map((key) => renderRawSection(sections[key])).join("\n\n")}`;
}
/** Recursively builds a simple YAML block for token objects. */
function buildYamlBlock(data: Record<string, unknown>, indent = 0): string {
  return Object.entries(data).map(([key, value]) => {
    const pad = " ".repeat(indent);
    return value !== null && typeof value === "object" && !Array.isArray(value) ? `${pad}${key}:\n${buildYamlBlock(value as Record<string, unknown>, indent + 2)}` : `${pad}${key}: ${formatYamlValue(value)}`;
  }).join("\n");
}
/** Renders one raw markdown section with optional YAML. */
function renderRawSection(section: DesignMdSection): string {
  return `## ${section.title}${section.yaml === null ? "" : `\n\n\`\`\`yaml\n${section.yaml}\n\`\`\``}\n\n${section.prose}`;
}
/** Parses Claude's Overview JSON response. */
function parseOverviewResponse(raw: string): string {
  try {
    const parsed = JSON.parse(raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "")) as { overview?: unknown };
    return typeof parsed.overview === "string" ? parsed.overview : "Overview prose could not be generated from the detected tokens.";
  } catch (error) {
    throw new GeneratorError("Claude returned invalid Overview JSON.", "Overview", error);
  }
}
/** Extracts text from a Claude SDK response. */
function extractClaudeText(response: unknown): string {
  return ((response as { content?: Array<{ type?: string; text?: string }> }).content ?? []).filter((item) => item.type === "text" && typeof item.text === "string").map((item) => item.text).join("");
}
/** Creates a fallback section for renderer failures. */
function fallbackSection(title: string, error: unknown): DesignMdSection {
  return { title, yaml: null, prose: `This section could not be generated: ${error instanceof Error ? error.message : "Unknown error"}` };
}
/** Derives a stable document name from token metadata. */
function getDocumentName(tokens: DesignTokens): string {
  return `${tokens.meta.source}-design-${tokens.meta.extractedAt.slice(0, 10)}`;
}
/** Formats primitive values for YAML output. */
function formatYamlValue(value: unknown): string {
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value === null || value === undefined) return "null";
  return `"${String(value).replace(/"/g, '\\"')}"`;
}
/** Builds a unique color key from a semantic role. */
function uniqueRoleKey(color: ColorToken, counts: Map<string, number>): string {
  const count = (counts.get(color.role) ?? 0) + 1;
  counts.set(color.role, count);
  return count === 1 ? color.role : `${color.role}${count}`;
}
/** Describes the likely semantic purpose of a color token. */
function describeColorPurpose(color: ColorToken): string {
  return color.role === "text" ? "legibility and content hierarchy" : `${color.role} visual emphasis`;
}
/** Removes null typography fields before YAML rendering. */
function compactTypography(token: TypographyToken): Record<string, string | number> {
  return Object.fromEntries(Object.entries({ fontFamily: token.fontFamily, fontSize: token.fontSize, fontWeight: token.fontWeight, lineHeight: token.lineHeight, letterSpacing: token.letterSpacing }).filter((entry): entry is [string, string | number] => entry[1] !== null));
}
/** Summarizes detected font families for typography prose. */
function summarizeFonts(tokens: TypographyToken[]): string {
  return Array.from(new Set(tokens.map((token) => token.fontFamily).filter(Boolean))).join(", ") || "detected font styles";
}

/** Builds a streaming color sanitizer that prevents invented hex values from reaching the UI. */
function createStreamingColorGuard(tokens: DesignTokens, onChunk: (chunk: string) => void): { push: (chunk: string) => void; flush: () => void } {
  let carry = "";

  return {
    push(chunk: string): void {
      const combined = carry + chunk;
      const processUntil = Math.max(0, combined.length - 12);
      const ready = combined.slice(0, processUntil);
      carry = combined.slice(processUntil);

      if (ready.length > 0) {
        onChunk(sanitizeMarkdownColors(ready, tokens));
      }
    },
    flush(): void {
      if (carry.length > 0) {
        onChunk(sanitizeMarkdownColors(carry, tokens));
        carry = "";
      }
    },
  };
}

/** Replaces hallucinated hex colors with extracted tokens from the parser. */
function sanitizeMarkdownColors(markdown: string, tokens: DesignTokens): string {
  const allowedHexes = new Set(tokens.colors.map((color) => normalizeHex(color.hex)).filter((hex): hex is string => Boolean(hex)));
  if (allowedHexes.size === 0) return markdown;

  return markdown.replace(/#[0-9a-f]{3,8}\b/gi, (match, offset) => {
    const normalized = normalizeHex(match);
    if (normalized === null || allowedHexes.has(normalized)) {
      return match;
    }

    return chooseReplacementColor(markdown.slice(Math.max(0, offset - 120), offset), tokens);
  });
}

/** Chooses the safest extracted token for an invented color based on nearby prose. */
function chooseReplacementColor(context: string, tokens: DesignTokens): string {
  const byRole = new Map(
    tokens.colors
      .map((color) => [String(color.role).toLowerCase(), normalizeHex(color.hex)] as const)
      .filter((entry): entry is readonly [string, string] => entry[1] !== null)
  );
  const loweredContext = context.toLowerCase();

  for (const role of ["text", "primary", "accent", "secondary", "surface", "background", "border", "success", "error", "warning", "info", "muted"]) {
    if (loweredContext.includes(role) && byRole.has(role)) {
      return byRole.get(role) as string;
    }
  }

  return byRole.get("primary") ?? byRole.get("accent") ?? byRole.get("text") ?? Array.from(byRole.values())[0] ?? "#000000";
}

/** Normalizes hex strings to #RRGGBB so comparisons are stable. */
function normalizeHex(hex: string | null): string | null {
  if (hex === null) return null;

  if (/^#[0-9a-f]{3}$/i.test(hex)) {
    const [, r, g, b] = hex;
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }

  if (/^#[0-9a-f]{6}$/i.test(hex)) {
    return hex.toUpperCase();
  }

  if (/^#[0-9a-f]{8}$/i.test(hex)) {
    return hex.slice(0, 7).toUpperCase();
  }

  return null;
}

/** Infers shape personality from radius values. */
function inferShapePersonality(shapes: ShapeToken[]): string {
  const values = shapes.map((shape) => shape.px).filter((value): value is number => value !== null);
  if (values.some((value) => value >= 9999)) return "Pill-forward, friendly shapes create soft, highly approachable controls.";
  if (values.length > 0 && values.every((value) => value <= 4)) return "Architectural sharpness gives the interface a precise, structured shape language.";
  return "Approachable and modern radius choices soften surfaces without making the system feel overly round.";
}
/** Renders prose for one component token. */
function renderComponentProse(component: ComponentToken): string {
  const variants = component.variants.map((variant) => variant.name).join(", ") || "none detected";
  const states = Array.from(new Set(component.variants.flatMap((variant) => variant.states))).join(", ") || "default";
  return `### ${component.name}\n${component.notes ?? "Component usage notes were not detected."}\nVariants: ${variants}\nStates: ${states}`;
}
/** Provides fallback motion tokens when none are detected. */
function getDefaultMotion(): MotionToken[] {
  return [{ name: "fast", duration: "100ms", easing: "ease-out" }, { name: "base", duration: "200ms", easing: "ease-in-out" }, { name: "slow", duration: "300ms", easing: "ease-in-out" }];
}
