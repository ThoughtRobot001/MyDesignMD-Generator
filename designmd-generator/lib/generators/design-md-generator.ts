import type { DesignTokens } from "../types/design-tokens";

export interface DesignMdGeneratorOptions {
  title: string;
  includeWarnings: boolean;
}

/** Builds a DESIGN.md document from normalized design tokens. */
export function generateDesignMd(tokens: DesignTokens, options: DesignMdGeneratorOptions): string {
  return [
    `# ${options.title}`,
    renderOverviewSection(tokens),
    renderColorsSection(tokens),
    renderTypographySection(tokens),
    renderSpacingSection(tokens),
    renderShapesSection(tokens),
    renderElevationSection(tokens),
    renderLayoutSection(tokens),
    renderComponentsSection(tokens),
    renderMotionSection(tokens),
    renderWarningsSection(tokens, options),
  ]
    .filter(Boolean)
    .join("\n\n");
}

/** Renders the DESIGN.md overview section. */
export function renderOverviewSection(_tokens: DesignTokens): string {
  return "## Overview\n\nTODO: Render visual tone and brand aesthetic from tokens.";
}

/** Renders the DESIGN.md colors section. */
export function renderColorsSection(_tokens: DesignTokens): string {
  return "## Colors\n\nTODO: Render color tokens and semantic roles.";
}

/** Renders the DESIGN.md typography section. */
export function renderTypographySection(_tokens: DesignTokens): string {
  return "## Typography\n\nTODO: Render font families, scale, weights, and line-heights.";
}

/** Renders the DESIGN.md spacing section. */
export function renderSpacingSection(_tokens: DesignTokens): string {
  return "## Spacing\n\nTODO: Render spacing scale and grid strategy.";
}

/** Renders the DESIGN.md shapes section. */
export function renderShapesSection(_tokens: DesignTokens): string {
  return "## Shapes\n\nTODO: Render radius tokens and shape language.";
}

/** Renders the DESIGN.md elevation section. */
export function renderElevationSection(_tokens: DesignTokens): string {
  return "## Elevation & Depth\n\nTODO: Render shadow tokens or flat design rationale.";
}

/** Renders the DESIGN.md layout section. */
export function renderLayoutSection(_tokens: DesignTokens): string {
  return "## Layout\n\nTODO: Render grid model, max-width, breakpoints, and safe areas.";
}

/** Renders the DESIGN.md components section. */
export function renderComponentsSection(_tokens: DesignTokens): string {
  return "## Components\n\nTODO: Render buttons, cards, inputs, and nav variants.";
}

/** Renders the DESIGN.md motion section. */
export function renderMotionSection(_tokens: DesignTokens): string {
  return "## Motion\n\nTODO: Render transition durations, easing, and animation principles.";
}

/** Renders optional generation warnings. */
export function renderWarningsSection(
  tokens: DesignTokens,
  options: DesignMdGeneratorOptions,
): string | null {
  if (!options.includeWarnings || tokens.warnings.length === 0) {
    return null;
  }

  return "## Warnings\n\nTODO: Render extraction warnings.";
}
