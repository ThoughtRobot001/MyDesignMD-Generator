import { buildFigmaAnalysisPrompt } from "../claude/prompts";
import { aiClient } from "../claude/client";
import type { FigmaParseInput } from "../types/api";
import type { DesignTokens } from "../types/design-tokens";

type FigmaColor = { r: number; g: number; b: number; a: number };
type FigmaPaint = { type?: string; visible?: boolean; color?: FigmaColor; opacity?: number };
type FigmaNodeSummary = {
  id: string | null;
  name: string | null;
  type: string | null;
};
type FigmaTextStyleSummary = FigmaNodeSummary & {
  characters: string | null;
  style: Record<string, unknown>;
  styles: Record<string, unknown>;
};
type FigmaComponentSummary = FigmaNodeSummary & {
  description: string | null;
  componentId: string | null;
  variantProperties: Record<string, unknown>;
};
type FigmaTarget = {
  fileKey: string;
  nodeId: string | null;
};

const FIGMA_PROMPT_CHAR_LIMIT = 750_000;
const MAX_STYLE_RECORDS = 300;
const MAX_COLOR_RECORDS = 240;
const MAX_TEXT_STYLE_RECORDS = 240;
const MAX_COMPONENT_RECORDS = 240;
const MAX_LAYOUT_RECORDS = 180;
const MAX_RADIUS_RECORDS = 160;
const MAX_EFFECT_RECORDS = 120;
const MAX_NAME_LENGTH = 160;

export class FigmaParserError extends Error {
  /** Creates a typed Figma parser error with an optional cause. */
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = "FigmaParserError";
  }
}

/** Parses a Figma file into normalized design tokens. */
export async function parseFromFigma(input: FigmaParseInput): Promise<DesignTokens> {
  const figmaJson = await fetchFigmaFile(input.figmaUrl, input.figmaToken);
  const tokens = await callClaudeForTokens(figmaJson);

  return {
    ...tokens,
    meta: {
      source: "figma",
      extractedAt: new Date().toISOString(),
      confidence: 0.95,
      warnings: tokens.meta?.warnings ?? [],
    },
  };
}

/** Fetches Figma file and style data and converts them into a compact token-focused JSON string. */
async function fetchFigmaFile(figmaUrl: string, figmaToken: string): Promise<string> {
  const target = parseFigmaTarget(figmaUrl);
  const headers = { "X-Figma-Token": figmaToken };
  const stylesUrl = `https://api.figma.com/v1/files/${target.fileKey}/styles`;
  const fileUrl = target.nodeId
    ? `https://api.figma.com/v1/files/${target.fileKey}/nodes?ids=${encodeURIComponent(target.nodeId)}`
    : `https://api.figma.com/v1/files/${target.fileKey}`;
  const [stylesResponse, fileResponse] = await Promise.all([
    fetch(stylesUrl, { headers }),
    fetch(fileUrl, { headers }),
  ]);

  if (!stylesResponse.ok) {
    throw new FigmaParserError(buildFigmaRequestError("styles", stylesResponse.status));
  }

  if (!fileResponse.ok) {
    throw new FigmaParserError(buildFigmaRequestError("file", fileResponse.status));
  }

  const styles = (await stylesResponse.json()) as unknown;
  const file = (await fileResponse.json()) as unknown;

  return serializeFigmaExtract(compactFigmaPayload(target, styles, file));
}

/** Gives manual-token users a clearer failure reason when Figma rejects the request. */
function buildFigmaRequestError(resource: string, status: number): string {
  if (status === 401 || status === 403) {
    return `Figma ${resource} request failed: ${status}. Check that your personal access token is valid and has access to this file.`;
  }

  if (status === 404) {
    return `Figma ${resource} request failed: ${status}. Check that the Figma link points to a file your token can access.`;
  }

  return `Figma ${resource} request failed: ${status}`;
}

/** Keeps the Figma payload under OpenAI input limits while preserving design-system signal. */
function compactFigmaPayload(target: FigmaTarget, styles: unknown, file: unknown): Record<string, unknown> {
  const fileRecord = asRecord(file);
  const document = resolveFigmaDocument(fileRecord, target.nodeId);
  const collector = createFigmaCollector();

  walkFigmaNode(document, collector);

  return {
    fileKey: target.fileKey,
    selectedNodeId: target.nodeId,
    scope: target.nodeId ? "selected-node" : "entire-file",
    name: truncateText(asString(fileRecord.name), MAX_NAME_LENGTH),
    selectedNodeName: truncateText(asString(document.name), MAX_NAME_LENGTH),
    lastModified: asString(fileRecord.lastModified),
    version: asString(fileRecord.version),
    note: target.nodeId
      ? "This compact Figma extract is scoped to the selected node from the provided URL. Prefer colors, typography, components, and layout signals from this selected node over file-level style names."
      : "This is a compact Figma extract for the entire file because the URL did not include a selected node-id. It keeps named styles, repeated visual values, layout signals, and component samples instead of the full Figma file JSON.",
    pages: getChildren(document).map((node) => ({
      id: asString(asRecord(node).id),
      name: truncateText(asString(asRecord(node).name), MAX_NAME_LENGTH),
      type: asString(asRecord(node).type),
    })),
    localStyles: extractLocalStyles(styles),
    colorUsage: Array.from(collector.colors.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, MAX_COLOR_RECORDS),
    textStyles: collector.textStyles.slice(0, MAX_TEXT_STYLE_RECORDS),
    components: collector.components.slice(0, MAX_COMPONENT_RECORDS),
    layouts: collector.layouts.slice(0, MAX_LAYOUT_RECORDS),
    radii: collector.radii.slice(0, MAX_RADIUS_RECORDS),
    effects: collector.effects.slice(0, MAX_EFFECT_RECORDS),
    stats: collector.stats,
  };
}

/** Resolves either the full Figma document or the selected node returned by /nodes. */
function resolveFigmaDocument(fileRecord: Record<string, unknown>, nodeId: string | null): Record<string, unknown> {
  if (!nodeId) {
    return asRecord(fileRecord.document);
  }

  const nodes = asRecord(fileRecord.nodes);
  const directNode = asRecord(nodes[nodeId]);
  const directDocument = asRecord(directNode.document);

  if (Object.keys(directDocument).length > 0) {
    return directDocument;
  }

  const firstNode = asRecord(Object.values(nodes)[0]);
  const firstDocument = asRecord(firstNode.document);

  if (Object.keys(firstDocument).length > 0) {
    return firstDocument;
  }

  throw new FigmaParserError("Selected Figma node was not found. Make sure the URL includes a valid node-id and your token can access it.");
}

/** Creates mutable collection buckets for one Figma document walk. */
function createFigmaCollector(): {
  colors: Map<string, { hex: string; count: number; paintTypes: string[]; examples: string[] }>;
  textStyles: FigmaTextStyleSummary[];
  components: FigmaComponentSummary[];
  layouts: Array<FigmaNodeSummary & Record<string, unknown>>;
  radii: Array<FigmaNodeSummary & Record<string, unknown>>;
  effects: Array<FigmaNodeSummary & { effects: unknown[] }>;
  stats: Record<string, number>;
} {
  return {
    colors: new Map(),
    textStyles: [],
    components: [],
    layouts: [],
    radii: [],
    effects: [],
    stats: {
      totalNodesVisited: 0,
      textNodesSeen: 0,
      componentNodesSeen: 0,
      layoutNodesSeen: 0,
      colorPaintsSeen: 0,
    },
  };
}

/** Walks the Figma tree once and extracts only values that help build design tokens. */
function walkFigmaNode(
  node: Record<string, unknown>,
  collector: ReturnType<typeof createFigmaCollector>,
): void {
  collector.stats.totalNodesVisited += 1;
  const summary = summarizeNode(node);
  const type = summary.type ?? "";

  collectPaints(node.fills, summary, collector);
  collectPaints(node.strokes, summary, collector);

  if (type === "TEXT") {
    collector.stats.textNodesSeen += 1;
    if (collector.textStyles.length < MAX_TEXT_STYLE_RECORDS) {
      collector.textStyles.push({
        ...summary,
        characters: truncateText(asString(node.characters), 120),
        style: pickTextStyle(asRecord(node.style)),
        styles: asRecord(node.styles),
      });
    }
  }

  if (type === "COMPONENT" || type === "COMPONENT_SET" || type === "INSTANCE") {
    collector.stats.componentNodesSeen += 1;
    if (collector.components.length < MAX_COMPONENT_RECORDS) {
      collector.components.push({
        ...summary,
        description: truncateText(asString(node.description), 240),
        componentId: asString(node.componentId),
        variantProperties: asRecord(node.variantProperties),
      });
    }
  }

  if (typeof node.layoutMode === "string") {
    collector.stats.layoutNodesSeen += 1;
    if (collector.layouts.length < MAX_LAYOUT_RECORDS) {
      collector.layouts.push({
        ...summary,
        layoutMode: node.layoutMode,
        primaryAxisSizingMode: node.primaryAxisSizingMode,
        counterAxisSizingMode: node.counterAxisSizingMode,
        itemSpacing: node.itemSpacing,
        paddingLeft: node.paddingLeft,
        paddingRight: node.paddingRight,
        paddingTop: node.paddingTop,
        paddingBottom: node.paddingBottom,
      });
    }
  }

  if (hasRadius(node) && collector.radii.length < MAX_RADIUS_RECORDS) {
    collector.radii.push({
      ...summary,
      cornerRadius: node.cornerRadius,
      rectangleCornerRadii: node.rectangleCornerRadii,
    });
  }

  if (Array.isArray(node.effects) && node.effects.length > 0 && collector.effects.length < MAX_EFFECT_RECORDS) {
    collector.effects.push({
      ...summary,
      effects: node.effects.slice(0, 4),
    });
  }

  getChildren(node).forEach((child) => walkFigmaNode(asRecord(child), collector));
}

/** Extracts named Figma styles returned by the styles endpoint. */
function extractLocalStyles(styles: unknown): Array<Record<string, unknown>> {
  const styleRecords = asArray(asRecord(asRecord(styles).meta).styles);

  return styleRecords.slice(0, MAX_STYLE_RECORDS).map((style) => {
    const record = asRecord(style);
    return {
      name: truncateText(asString(record.name), MAX_NAME_LENGTH),
      styleType: asString(record.style_type),
      description: truncateText(asString(record.description), 240),
      nodeId: asString(record.node_id),
    };
  });
}

/** Adds visible solid fills/strokes to the color frequency table. */
function collectPaints(
  value: unknown,
  node: FigmaNodeSummary,
  collector: ReturnType<typeof createFigmaCollector>,
): void {
  asArray(value).forEach((paintValue) => {
    const paint = asRecord(paintValue) as FigmaPaint;
    if (paint.visible === false || paint.type !== "SOLID" || !paint.color) {
      return;
    }

    const hex = convertFigmaColor({ ...paint.color, a: paint.color.a ?? paint.opacity ?? 1 });
    const current = collector.colors.get(hex) ?? { hex, count: 0, paintTypes: [], examples: [] };
    current.count += 1;
    collector.stats.colorPaintsSeen += 1;

    if (paint.type && !current.paintTypes.includes(paint.type)) {
      current.paintTypes.push(paint.type);
    }

    const example = [node.type, node.name].filter(Boolean).join(": ");
    if (example && current.examples.length < 8 && !current.examples.includes(example)) {
      current.examples.push(example);
    }

    collector.colors.set(hex, current);
  });
}

/** Pulls typography-relevant fields from a Figma text style object. */
function pickTextStyle(style: Record<string, unknown>): Record<string, unknown> {
  return {
    fontFamily: style.fontFamily,
    fontPostScriptName: style.fontPostScriptName,
    fontSize: style.fontSize,
    fontWeight: style.fontWeight,
    lineHeightPx: style.lineHeightPx,
    lineHeightPercent: style.lineHeightPercent,
    letterSpacing: style.letterSpacing,
    textCase: style.textCase,
    textDecoration: style.textDecoration,
  };
}

/** Returns a small identity summary for a Figma node. */
function summarizeNode(node: Record<string, unknown>): FigmaNodeSummary {
  return {
    id: asString(node.id),
    name: truncateText(asString(node.name), MAX_NAME_LENGTH),
    type: asString(node.type),
  };
}

/** Detects whether a node carries corner radius values. */
function hasRadius(node: Record<string, unknown>): boolean {
  return typeof node.cornerRadius === "number" || Array.isArray(node.rectangleCornerRadii);
}

/** Serializes the compact extract and hard-caps it with valid JSON if needed. */
function serializeFigmaExtract(payload: Record<string, unknown>): string {
  const serialized = JSON.stringify(payload);
  if (serialized.length <= FIGMA_PROMPT_CHAR_LIMIT) {
    return serialized;
  }

  return JSON.stringify({
    ...payload,
    localStyles: asArray(payload.localStyles).slice(0, 120),
    colorUsage: asArray(payload.colorUsage).slice(0, 120),
    textStyles: asArray(payload.textStyles).slice(0, 100),
    components: asArray(payload.components).slice(0, 100),
    layouts: asArray(payload.layouts).slice(0, 80),
    radii: asArray(payload.radii).slice(0, 80),
    effects: asArray(payload.effects).slice(0, 60),
    truncatedForPromptLimit: true,
  });
}

/** Safely coerces unknown values into object records. */
function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

/** Safely coerces unknown values into arrays. */
function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

/** Reads children from a Figma node. */
function getChildren(node: Record<string, unknown>): unknown[] {
  return asArray(node.children);
}

/** Safely reads optional strings. */
function asString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

/** Truncates noisy Figma names/descriptions before they enter the prompt. */
function truncateText(value: string | null, maxLength: number): string | null {
  if (value === null || value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength)}...`;
}

/** Extracts the Figma file key and selected node from supported Figma URL patterns. */
function parseFigmaTarget(figmaUrl: string): FigmaTarget {
  try {
    const url = new URL(figmaUrl);
    const segments = url.pathname.split("/").filter(Boolean);
    const fileIndex = segments.findIndex((segment) => segment === "file" || segment === "design");
    const fileKey = fileIndex >= 0 ? segments[fileIndex + 1] : null;

    if (fileKey === null || fileKey.length === 0) {
      throw new FigmaParserError("Figma URL does not include a file key.");
    }

    return {
      fileKey,
      nodeId: normalizeFigmaNodeId(url.searchParams.get("node-id")),
    };
  } catch (error) {
    if (error instanceof FigmaParserError) {
      throw error;
    }

    throw new FigmaParserError("Figma URL is not valid.", error);
  }
}

/** Converts Figma URL node ids such as 12-34 into API ids such as 12:34. */
function normalizeFigmaNodeId(nodeId: string | null): string | null {
  if (!nodeId || nodeId.trim().length === 0) {
    return null;
  }

  return decodeURIComponent(nodeId).replace("-", ":");
}

/** Calls Claude to map Figma REST API JSON into normalized design tokens. */
async function callClaudeForTokens(figmaJson: string): Promise<DesignTokens> {
  const prompt = buildFigmaAnalysisPrompt({ figmaJson });
  const raw = await aiClient({
    system: prompt.system,
    maxTokens: 4096,
    messages: [{ role: "user", content: prompt.user }],
  });
  const parsed = parseClaudeJson(raw);

  return assertDesignTokens(parsed);
}

/** Converts a Figma RGBA color to uppercase #RRGGBB format. */
function convertFigmaColor(figmaColor: FigmaColor): string {
  const channels = [figmaColor.r, figmaColor.g, figmaColor.b].map((value) =>
    Math.round(clamp(value, 0, 1) * 255)
      .toString(16)
      .padStart(2, "0")
      .toUpperCase(),
  );

  return `#${channels.join("")}`;
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
    throw new FigmaParserError("Claude returned invalid JSON for Figma parsing.", error);
  }
}

/** Extracts text content from a Claude SDK response. */
function extractClaudeText(response: unknown): string {
  const content = getRecord(response).content;

  if (!Array.isArray(content)) {
    throw new FigmaParserError("Claude response did not include content.");
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
    throw new FigmaParserError("Claude JSON is missing required token arrays.");
  }

  return record as DesignTokens;
}

/** Narrows an unknown value to a string-keyed record. */
function getRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null) {
    throw new FigmaParserError("Expected a JSON object.");
  }

  return value as Record<string, unknown>;
}

/** Clamps a numeric value into a minimum and maximum range. */
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
