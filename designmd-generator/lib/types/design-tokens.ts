/** Represents the input source used for token extraction. */
export type InputSource = "figma" | "image" | "url";

/** Represents the semantic role assigned to a color token. */
export type ColorRole =
  | "primary"
  | "secondary"
  | "surface"
  | "background"
  | "error"
  | "accent"
  | "text"
  | "muted"
  | "border"
  | "unknown"
  | string; // allows numbered variants such as text2, text3, primary2 produced by the AI

/** Represents a normalized color token and its accessibility status. */
export type ColorToken = {
  hex: string | null;
  role: ColorRole;
  wcagAA: boolean;
  wcagAAA: boolean;
};

/** Represents the semantic role assigned to a typography token. */
export type TypographyRole =
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "h5"
  | "h6"
  | "body-lg"
  | "body-md"
  | "body-sm"
  | "label"
  | "caption"
  | "overline"
  | "unknown";

/** Represents a normalized typography token. */
export type TypographyToken = {
  fontFamily: string | null;
  fontSize: string | null;
  fontWeight: number | null;
  lineHeight: string | null;
  letterSpacing: string | null;
  role: TypographyRole;
};

/** Represents one named spacing value. */
export type SpacingToken = {
  name: string;
  value: string | null;
  px: number | null;
};

/** Represents the inferred spacing scale for a design system. */
export type SpacingScale = {
  baseUnit: number | null;
  tokens: SpacingToken[];
};

/** Represents one named shape or radius token. */
export type ShapeToken = {
  name: string;
  value: string | null;
  px: number | null;
};

/** Represents one named elevation or shadow token. */
export type ShadowToken = {
  name: string;
  value: string | null;
  isFlat: boolean;
};

/** Represents one responsive breakpoint token. */
export type BreakpointToken = {
  name: string;
  minWidth: string | null;
};

/** Represents one motion timing token. */
export type MotionToken = {
  name: string;
  duration: string | null;
  easing: string | null;
};

/** Represents one variant of a component token. */
export type ComponentVariant = {
  name: string;
  description: string | null;
  states: string[];
};

/** Represents a normalized component token with variants and notes. */
export type ComponentToken = {
  name: string;
  variants: ComponentVariant[];
  notes: string | null;
};

/** Represents metadata about the token extraction result. */
export type TokenMeta = {
  source: InputSource;
  extractedAt: string;
  confidence: number;
  warnings: string[];
  behavioralIntelligence?: string;
};

/** Represents the complete normalized token object consumed by generators. */
export type DesignTokens = {
  colors: ColorToken[];
  typography: TypographyToken[];
  spacing: SpacingScale;
  shapes: ShapeToken[];
  elevation: ShadowToken[];
  breakpoints: BreakpointToken[];
  motion: MotionToken[];
  components: ComponentToken[];
  meta: TokenMeta;
};
