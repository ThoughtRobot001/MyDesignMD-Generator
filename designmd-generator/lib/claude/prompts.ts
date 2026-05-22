import type { ColorToken, DesignTokens, TypographyToken } from "../types/design-tokens";

// Higher quality but higher token cost:
// export const OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-5.5";
// Requested downgrade, but gpt-5.3 is not listed as an OpenAI API model:
// export const OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-5.3";
export const OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-5-mini";
export const OPENAI_FALLBACK_MODEL = "gpt-4.1-mini";

export const OPENAI_MAX_TOKENS = 16384;

export const CLAUDE_MODEL = OPENAI_MODEL;

export const CLAUDE_MAX_TOKENS = OPENAI_MAX_TOKENS;

export const DESIGN_MD_SPEC = `DESIGN.md is a comprehensive markdown design system document. It must be richly detailed, deeply structured, and written at the quality of a senior design systems engineer at Stripe, Vercel, or Linear. The document combines YAML front matter (pre-calculated design tokens) with deeply written markdown prose. There is no fixed section count — structure the document to best serve the design system being documented. Write as many sections and sub-sections as necessary to fully capture the design language. Every section must justify the design decisions, not merely describe them.`;

export const DESIGN_TOKENS_JSON_SCHEMA = `{
  "colors": [
    // RETURN ALL COLORS FOUND — minimum 8, no upper limit. Never stop at 4 or 5.
    // If multiple colors share a role, number them: text, text2, text3, primary, primary2, etc.
    {
      "hex": "string | null // normalized HEX value such as #111827",
      "role": "primary | secondary | surface | background | error | accent | text | muted | border | text2 | text3 | primary2 | surface2 | etc",
      "wcagAA": "boolean // true when normal text contrast reaches 4.5:1",
      "wcagAAA": "boolean // true when normal text contrast reaches 7:1"
    }
    // ... all remaining colors — do not truncate this array
  ],
  "typography": [
    // RETURN ALL DISTINCT TEXT STYLES FOUND — minimum 6, no upper limit. Never stop at 4 or 5.
    // h1 through h6, body-lg, body-md, body-sm, label, caption, overline are all distinct roles.
    {
      "fontFamily": "string | null",
      "fontSize": "string | null // px string preferred, such as 16px",
      "fontWeight": "number | null",
      "lineHeight": "string | null",
      "letterSpacing": "string | null",
      "role": "h1 | h2 | h3 | h4 | h5 | h6 | body-lg | body-md | body-sm | label | caption | overline | unknown"
    }
    // ... all remaining typography roles — do not truncate this array
  ],
  "spacing": {
    "baseUnit": "number | null // px base unit",
    "tokens": [
      {
        "name": "string",
        "value": "string | null // include px and rem when available",
        "px": "number | null"
      }
    ]
  },
  "shapes": [
    {
      "name": "string",
      "value": "string | null",
      "px": "number | null"
    }
  ],
  "elevation": [
    {
      "name": "string",
      "value": "string | null",
      "isFlat": "boolean"
    }
  ],
  "breakpoints": [
    {
      "name": "string",
      "minWidth": "string | null"
    }
  ],
  "motion": [
    {
      "name": "string",
      "duration": "string | null",
      "easing": "string | null"
    }
  ],
  "components": [
    {
      "name": "string",
      "variants": [
        {
          "name": "string",
          "description": "string | null",
          "states": "string[]"
        }
      ],
      "notes": "string | null"
    }
  ]
}`;



const JSON_OUTPUT_RULES = `Return ONLY valid JSON matching the schema provided.
Never hallucinate values; return null for anything not confidently found.
Never add markdown code fences around JSON output.
Be explicit about what you see, not what you assume.`;

const MARKDOWN_OUTPUT_RULES = `Return ONLY raw markdown. No JSON. No code fences wrapping the entire document.
Use fenced code blocks only for YAML token blocks (\`\`\`yaml ... \`\`\`).
Do not add any preamble, explanation, or trailing commentary outside the document itself.`;

/** Builds the Claude vision prompt for image-based design token extraction. */
export const buildImageAnalysisPrompt = (options: { mimeType: string }): { system: string; user: string } => ({
  system: `CRITICAL RULE — ZERO HALLUCINATION POLICY:
Only return values you can SEE in the screenshot.
If a color, font size, spacing value, or component is NOT VISIBLE in the provided image, return null for that field.
Do NOT infer, assume, or use domain knowledge to fill gaps.

Specific rules:
- Do NOT return semantic colors (success, error, warning) unless you can see a visible green success message, red error state, or yellow warning banner IN THE SCREENSHOT
- Do NOT return colors from Material Design, Tailwind, or any design system — only return hex values you can visually sample from the actual pixels
- Do NOT return generic colors like #4CAF50, #F44336, #FFD700, #2196F3 — these are hallucinated system colors, not extracted colors
- If you are uncertain about an exact hex value, use your best visual estimate from the screenshot — but never invent a color that isn't present
- It is better to return 4 accurate colors than 8 colors where half are hallucinated

For this screenshot specifically:
- If it is a dark UI with black/gray surfaces, expect 3-5 colors maximum
- If no warning/error states are visible, do not include them
- Only include a color if you can point to a specific pixel in the image where that color appears

You are a senior design systems engineer analyzing a UI screenshot or design image.
${DESIGN_MD_SPEC}

Only extract values that are CLEARLY visible in the image.
Return null for any token that cannot be confidently determined.
For color extraction from UI screenshots — apply strict filtering:
- Extract ONLY colors that belong to the UI SHELL and design system
- EXCLUDE colors that come from:
    User-generated content (avatars, logos, thumbnails, icons uploaded by users, project artwork)
    Data visualization colors (chart bars, pie slices, graph lines)
    Third-party brand logos or favicons
    Photography or illustration content
- INCLUDE only colors used in:
    Navigation backgrounds and text
    Button backgrounds and labels
    Card and panel backgrounds
    Border and divider lines
    Status indicators that are part of the design system
    Typography colors
    Form element colors
- If you are unsure whether a color belongs to the UI shell or to content, exclude it
- For a dark theme dashboard like this, expect: dark backgrounds, white/light text, one or two accent colors maximum — not a rainbow of colors from content
For color role assignment — this is critical for downstream usage:

Assign roles with STRICT semantic meaning:
  'primary'    — the main brand/action color used for PRIMARY buttons 
                 and key CTAs only. There should be ONE primary.
  'secondary'  — secondary actions, secondary buttons only
  'background' — page/app background only
  'surface'    — card, panel, modal backgrounds only
  'surface2'   — elevated surface, nested panels only
  'text'       — primary body text color only
  'text2'      — secondary/muted text, captions only
  'muted'      — placeholder text, disabled text only
  'border'     — dividers, input borders, hairlines only
  'accent'     — decorative highlights, NOT for buttons or text
  'error'      — error states only, NOT for general use
  'warning'    — warning states only, NOT for buttons or headings
  'success'    — success states only, NOT for buttons or headings
  'link'       — inline text links only, NOT for buttons

For semantic colors (warning, error, success, link):
  These MUST be documented with explicit restrictions.
  They are NEVER valid as button backgrounds or heading colors.

If a color is used ONLY for warnings in the UI, assign role 'warning'.
If a color is used ONLY for links in the UI, assign role 'link'.
Never assign 'primary' to a color that is only used for links or warnings.
- If multiple colors share a role, number them: text, text2, text3, primary, primary2, etc.
For typography extraction — this is the most important section:
- Extract EVERY distinct text style visible in the screenshot.
- Return ALL typography roles you find. Do not limit the array. It is better to return 15 roles than to miss any. Never stop at 4 or 5.
- You must identify and return ALL of these roles if visible: h1, h2, h3, h4, h5, h6; body-lg, body-md, body-sm; label, caption, overline; button-md, button-sm; any tabular or monospace styles.
- For each role extract: fontFamily as the actual rendered font name, never sans-serif, serif, or monospace; fontSize in px; fontWeight as a number such as 300, 400, 500, 600, or 700; lineHeight as a decimal ratio such as 1.2, 1.4, or 1.5, not px; letterSpacing in px, including negative values on display sizes.
- Look at letterforms carefully. Common web fonts: Inter, Söhne, Helvetica Neue, GT Walsheim, Circular, Graphik, DM Sans, Plus Jakarta Sans, SF Pro.
- Look specifically for negative letter-spacing on large headings, different weights between display and body, and monospace or tabular styles used for numbers or code.
- Return at minimum 6 typography roles for any real website.
- If you see the same font at different sizes, they are DIFFERENT roles.
For component extraction — scan the ENTIRE screenshot carefully:
- Identify every distinct UI component visible, not just buttons
- Look for: navigation sidebars, top bars, search inputs, data tables,
  cards, badges, avatars, dropdowns, tabs, breadcrumbs, modals,
  progress bars, tooltips, empty states, notification toasts
- CRITICAL ABSTRACTION RULE: You are building a reusable Design System, NOT documenting a specific page.
  - Group literal UI elements into canonical design system components.
  - Instead of "Search Projects input", output a single "Input" component with variants.
  - Instead of "Add New button" and "Upgrade to Pro button", output a single "Button" component with variants (e.g., primary, secondary).
  - Instead of "Ship banner", output "Banner" or "Alert".
- For each canonical component found:
    name: the generic design system name (e.g., 'Button', 'Input', 'Card', 'Badge', 'Navigation', 'Modal')
    variants: the visual variants extracted from all instances (e.g., 'primary', 'secondary', 'ghost', 'destructive')
    states: interaction states shown or implied across all instances (e.g., 'default', 'hover', 'active', 'disabled')
    notes: one sentence on its general role in the design system
- Return a minimum of 4 components for any real UI screenshot
- Never return fewer components than you can clearly see
Image MIME type: ${options.mimeType}

${JSON_OUTPUT_RULES}

Return this DesignTokens JSON shape without the meta field:
${DESIGN_TOKENS_JSON_SCHEMA}`,
  user: `Analyze this UI design and extract all design tokens you can confidently identify.
Return ONLY a JSON object. No explanation. No markdown fences. No extra text.
Return ALL colors found — minimum 8, no upper limit. Never stop at 4 or 5 colors.
Return ALL typography roles found — minimum 6, no upper limit. Never stop at 4 or 5 roles.

Schema reminder:
${DESIGN_TOKENS_JSON_SCHEMA}`,
});

/** Builds the Claude prompt for website CSS and HTML token extraction. */
export const buildUrlAnalysisPrompt = (options: {
  scrapedCSS: string;
  scrapedHTML: string;
  behavioralData: string;
}): { system: string; user: string } => ({
  system: `You are a senior design systems engineer reading a codebase.
You will receive a BEHAVIORAL DESIGN INTELLIGENCE section before the CSS. This contains structural and behavioral signals extracted from the live DOM. Use these signals to:
- Infer design philosophy (not just appearance)
- Write component descriptions that explain WHY, not just WHAT
- Derive Do's and Don'ts from the avoidance signals
- Ground every prose statement in the behavioral evidence provided
- Never use generic adjectives like 'modern', 'clean', 'vibrant' without tying them to a specific behavioral signal

${DESIGN_MD_SPEC}

Prefer computed CSS values over variable references.
If a CSS variable is referenced but not defined in the provided CSS, return null.
Normalize all colors to HEX. Normalize all spacing to px and rem both.
You are receiving a condensed CSS extract. Focus on the SEMANTIC COLORS and BEHAVIORAL INTELLIGENCE sections at the top — these are pre-processed ground truth. Use the raw CSS only to fill gaps.
For color extraction:
- The CSS begins with a SEMANTIC COLORS BY ELEMENT ROLE section. This maps element types to their actual computed color values. Use this to assign accurate ColorRoles:
  - heading-text colors → assign role 'text'
  - body-text colors → assign role 'text2' or 'muted'
  - link colors → assign role 'primary' or 'accent'
  - button-bg colors → assign role 'primary' or 'secondary'
  - nav-bg colors → assign role 'surface'
  - footer-bg colors → assign role 'surface2'
  - input-bg colors → assign role 'surface'
  - card-bg colors → assign role 'surface2'
  - badge-bg colors → assign role 'accent'
  - error colors → assign role 'error'
  - success colors → assign role 'success'
  - muted-text colors → assign role 'muted'
  - border colors → assign role 'border'
- Use these mappings to assign semantic roles confidently instead of defaulting to 'unknown' or generic names.
- If both a neutral background and a saturated button/link/CTA color are present, the saturated interactive color takes precedence as 'primary'.
- Only assign black, white, gray, or near-neutral colors to 'primary' when the source design is genuinely monochrome and no saturated interactive or brand color is present.
- Return ALL colors you find. Do not limit the array. It is better to return 20 colors than to miss any. Never stop at 4 or 5.
- Include ALL of the following categories if present: primary brand colors from buttons, links, and CTAs; text colors including primary text, secondary, muted, and disabled variants; surface colors from backgrounds, cards, and panels; border and hairline colors; semantic colors including error, success, warning, and info; accent and gradient colors.
- For each color assign the most specific ColorRole possible.
- Do not assign 'unknown' unless truly unidentifiable.
- If multiple colors share a role, number them in the role name such as text, text2, text3.
- Prefer semantic naming such as ink over text when it is clearly a dark navy.
- Return a minimum of 8 colors for any real website. More is always better.
- Never deduplicate colors that are visually distinct even if similar.
For typography extraction:
- Return ALL distinct text styles found. Do not limit the array. It is better to return 15 roles than to miss any. Never stop at 4 or 5.
- Return a minimum of 6 typography roles for any real website.
For component extraction:
- The HTML ends with a DETECTED COMPONENTS section showing component types found on the page with their variants and counts.
- Use this to populate the components array in your response.
- For each detected component write a ComponentToken with:
  - name: the component type, e.g. Button, Navigation, Card, Form, Badge, Modal
  - variants: accurate variant names inferred from the sample_classes field (e.g. primary, secondary, outline, ghost, danger, small, large)
  - states: always include at minimum ["default", "hover", "focus", "disabled"]
  - notes: one sentence describing the component's visual role in the design system

${JSON_OUTPUT_RULES}

Return this DesignTokens JSON shape without the meta field:
${DESIGN_TOKENS_JSON_SCHEMA}`,
  user: `${options.behavioralData}

Scraped CSS (starts with SEMANTIC COLORS BY ELEMENT ROLE — use those mappings to assign ColorRoles):
${options.scrapedCSS}

Scraped HTML:
${options.scrapedHTML}

Extract all design tokens present. Return ALL colors found — minimum 8, no upper limit. Return ALL typography roles found — minimum 6, no upper limit. Return ONLY valid JSON. No fences. No explanation.`,
});

/** Builds the Claude prompt for Figma REST API token extraction. */
export const buildFigmaAnalysisPrompt = (options: { figmaJson: string }): { system: string; user: string } => ({
  system: `You are a senior design systems engineer analyzing a Figma REST API response.
${DESIGN_MD_SPEC}

The input is a compact Figma REST API extract, not the full file JSON.
If the extract has "scope": "selected-node", analyze ONLY the selected node subtree. Do not let file-level style names override colors, typography, or components actually present in that selected node.
Figma colors are in RGBA 0-1 float format; convert them to HEX in output.
Figma font sizes are in px; keep them as px strings.
Extract only styles that appear to be design system tokens, such as styles used more than once or named systematically like "color/primary".

${JSON_OUTPUT_RULES}

Return this DesignTokens JSON shape without the meta field:
${DESIGN_TOKENS_JSON_SCHEMA}`,
  user: `Figma compact JSON extract:
${options.figmaJson}

Map this Figma data to design tokens. Return ONLY valid JSON. No fences.`,
});

/** Builds the prompt for generating a rich, free-form DESIGN.md markdown document. */
export const buildDesignMdGeneratorPrompt = (options: {
  tokens: DesignTokens;
  renderedYaml: RenderedYamlBlocks;
  behavioralIntelligence?: string;
}): { system: string; user: string } => ({
  system: `You are an elite senior design systems writer and brand strategist — the caliber of engineers who wrote the Vercel, Linear, or Stripe design systems.

${options.behavioralIntelligence ? `You have been provided with BEHAVIORAL DESIGN INTELLIGENCE data extracted directly from the live DOM. This is ground truth. Use it to:
- Ground the opening sections in specific behavioral signals, not aesthetics
- Derive Do's from dominant patterns (e.g. sparse CTAs → 'Use one primary CTA per section')
- Derive Don'ts from avoidance signals
- Write component descriptions based on actual component dominance data
- The BEHAVIORAL DESIGN INTELLIGENCE section includes a FONT DETECTION REPORT. ALWAYS use @font-face family names when present. Never return 'sans-serif', 'serif', 'system-ui', or 'Helvetica Neue' as a fontFamily if a named font was detected.` : ""}

${DESIGN_MD_SPEC}

You will be given:
1. Pre-calculated YAML token blocks — embed these VERBATIM into the document inside \`\`\`yaml fences.
2. Raw token data for reference.

Document writing rules:
- Write a richly detailed, deeply opinionated Markdown document. No JSON. No rigid section count.
- Structure the document with as many sections and sub-sections as the design system demands.
- Every heading level is fair game: #, ##, ###, ####.
- Use markdown tables wherever comparative data exists (e.g. typography scale, elevation levels, spacing rhythm, component states).
- Use bullet lists, numbered lists, blockquotes, and bold text to build hierarchy within prose.
- Every section must explain the WHY, not just the WHAT. Justify every design decision.
- For the System Philosophy / Overview section: describe the design intent, UX psychology the interface creates, and the operational context it serves.
- For Colors: write explicit USE FOR / NEVER USE FOR rules per token. Group into Surface Hierarchy, Accent Usage Strategy, Semantic Colors.
- For Typography: embed a full markdown table (Role | Font | Size | Weight | Line Height | Letter Spacing). Describe the typographic DNA.
- For Spacing: include a rhythm pattern table (token | px | usage context).
- For Components: write each canonical component with a Color Bindings table, Variants list, States list, Sizing guide, and one practical implementation snippet in a fenced code block.
- Component implementation snippets must be real code fences using \`\`\`tsx or \`\`\`html. Bind each snippet to the detected colors, spacing, radius, and type tokens. Never output placeholder component stubs.
- ONLY use canonical design system names (Button, Input, Card, Badge, Navigation) — never literal page element names.
- For Elevation: if flat design, write a detailed flat philosophy section. If shadows, include a levels table.
- For Do's and Don'ts: use ### Do and ### Don't sub-headers with bullet points. Be strict and specific.
- For Responsive Behavior: explain specific collapse strategies per component type.
- For an Iteration Guide: give concrete numbered steps for a developer maintaining this system.

Forbidden words and phrases: modern, clean, vibrant, elegant, sophisticated, seamless, dynamic, robust, powerful, stunning.

${MARKDOWN_OUTPUT_RULES}`,
  user: `${options.behavioralIntelligence ? `## BEHAVIORAL DESIGN INTELLIGENCE\n\n${options.behavioralIntelligence}\n\n` : ""}## Pre-Calculated Token YAML Blocks

Embed these VERBATIM in their respective sections:

### Colors
\`\`\`yaml
${options.renderedYaml.colors ?? "# No colors detected"}
\`\`\`

### Typography
\`\`\`yaml
${options.renderedYaml.typography ?? "# No typography detected"}
\`\`\`

### Spacing
\`\`\`yaml
${options.renderedYaml.spacing ?? "# No spacing detected"}
\`\`\`

### Shapes
\`\`\`yaml
${options.renderedYaml.shapes ?? "# No shapes detected"}
\`\`\`

### Elevation
\`\`\`yaml
${options.renderedYaml.elevation ?? "# No elevation tokens detected"}
\`\`\`

### Motion
\`\`\`yaml
${options.renderedYaml.motion ?? "# No motion tokens detected"}
\`\`\`

## Raw Design Tokens (for reference)
${JSON.stringify(options.tokens, null, 2)}

Write the complete DESIGN.md document now. Raw markdown only. No JSON wrapper. Start with the front matter block (---).`,
});

/** Describes the pre-calculated YAML string for each token section. */
export type RenderedYamlBlocks = {
  colors: string | null;
  typography: string | null;
  spacing: string | null;
  shapes: string | null;
  elevation: string | null;
  motion: string | null;
};

/** Builds the Claude prompt for focused Overview section prose generation. */
export const buildOverviewProsePrompt = (options: {
  colors: ColorToken[];
  typography: TypographyToken[];
}): { system: string; user: string } => ({
  system: `You are a brand strategist and design writer.
Write 2-4 sentences only. Be evocative, specific, and professional.
Derive personality from the actual colors and fonts provided.
Avoid generic phrases like "modern and clean" or "user-friendly".
Return format: { "overview": "prose string here" }
Return JSON only, with no markdown fences or extra text.`,
  user: `Colors:
${JSON.stringify(options.colors, null, 2)}

Typography:
${JSON.stringify(options.typography, null, 2)}

Write the Overview section prose for this design system.`,
});
