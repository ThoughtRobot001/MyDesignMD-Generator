export type TokenConfidence = "high" | "medium" | "low" | "unknown";

export type TokenSourceType = "figma" | "image" | "url";

export type ColorFormat = "hex" | "rgb" | "hsl";

export type ColorRole =
  | "primary"
  | "secondary"
  | "accent"
  | "surface"
  | "background"
  | "text"
  | "muted"
  | "border"
  | "error"
  | "warning"
  | "success";

export type FontOrigin = "google-font" | "system" | "custom" | "unknown";

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
  | "caption";

export type SpacingUnit = "px" | "rem" | "em";

export type SpacingRole = "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";

export type RadiusRole = "sm" | "md" | "lg" | "full";

export type ShadowRole = "sm" | "md" | "lg" | "xl";

export type BreakpointRole = "sm" | "md" | "lg" | "xl" | "2xl";

export type ComponentState =
  | "default"
  | "hover"
  | "focus"
  | "active"
  | "disabled"
  | "loading"
  | "error";

export type ComponentCategory = "button" | "card" | "input" | "nav";

export type MotionRole = "fast" | "base" | "slow" | "enter" | "exit";

export type ContrastStatus = "pass" | "fail" | "unknown";

export interface TokenSource {
  type: TokenSourceType;
  value: string;
  capturedAt: string;
}

export interface TokenMetadata {
  confidence: TokenConfidence;
  source?: string;
  notes?: string[];
}

export interface ContrastCheck {
  foreground: string;
  background: string;
  ratio: number | null;
  status: ContrastStatus;
  requiredRatio: number;
}

export interface ColorToken {
  name: string;
  value: string | null;
  format: ColorFormat | null;
  role: ColorRole | null;
  luminance: number | null;
  contrastChecks: ContrastCheck[];
  metadata: TokenMetadata;
}

export interface TypographyToken {
  role: TypographyRole;
  fontFamily: string | null;
  fontOrigin: FontOrigin;
  fontSize: string | null;
  fontWeight: number | string | null;
  lineHeight: string | null;
  letterSpacing: string | null;
  metadata: TokenMetadata;
}

export interface SpacingToken {
  role: SpacingRole;
  value: string | null;
  unit: SpacingUnit | null;
  pixelValue: number | null;
  metadata: TokenMetadata;
}

export interface ShapeToken {
  role: RadiusRole;
  borderRadius: string | null;
  metadata: TokenMetadata;
}

export interface ShadowToken {
  role: ShadowRole;
  value: string | null;
  metadata: TokenMetadata;
}

export interface BreakpointToken {
  role: BreakpointRole;
  minWidth: string | null;
  metadata: TokenMetadata;
}

export interface LayoutTokens {
  gridStrategy: string | null;
  maxWidth: string | null;
  safeArea: string | null;
  breakpoints: BreakpointToken[];
}

export interface ComponentVariantToken {
  name: string;
  category: ComponentCategory;
  states: ComponentState[];
  description: string | null;
  metadata: TokenMetadata;
}

export interface MotionToken {
  role: MotionRole;
  duration: string | null;
  easing: string | null;
  description: string | null;
  metadata: TokenMetadata;
}

export interface DesignTokens {
  source: TokenSource;
  overview: string | null;
  colors: ColorToken[];
  typography: TypographyToken[];
  spacing: SpacingToken[];
  shapes: ShapeToken[];
  elevation: ShadowToken[];
  layout: LayoutTokens;
  components: ComponentVariantToken[];
  motion: MotionToken[];
  warnings: string[];
}
