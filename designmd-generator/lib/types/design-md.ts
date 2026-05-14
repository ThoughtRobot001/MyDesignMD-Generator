import type {
  ColorToken,
  ComponentVariantToken,
  LayoutTokens,
  MotionToken,
  ShadowToken,
  ShapeToken,
  SpacingToken,
  TypographyToken,
} from "./design-tokens";

export type DesignMdSectionName =
  | "Overview"
  | "Colors"
  | "Typography"
  | "Spacing"
  | "Shapes"
  | "Elevation & Depth"
  | "Layout"
  | "Components"
  | "Motion";

export type DesignMdSectionStatus = "complete" | "partial" | "missing";

export interface DesignMdSection<TContent> {
  name: DesignMdSectionName;
  status: DesignMdSectionStatus;
  content: TContent;
  warnings: string[];
}

export interface DesignMdOverviewContent {
  summary: string | null;
  tone: string | null;
  brandAesthetic: string | null;
}

export interface DesignMdColorContent {
  tokens: ColorToken[];
  semanticRoles: Record<string, string | null>;
}

export interface DesignMdTypographyContent {
  tokens: TypographyToken[];
  scaleDescription: string | null;
}

export interface DesignMdSpacingContent {
  tokens: SpacingToken[];
  gridStrategy: string | null;
}

export interface DesignMdShapeContent {
  tokens: ShapeToken[];
  shapeLanguage: string | null;
}

export interface DesignMdElevationContent {
  tokens: ShadowToken[];
  rationale: string | null;
}

export interface DesignMdLayoutContent {
  tokens: LayoutTokens;
}

export interface DesignMdComponentContent {
  tokens: ComponentVariantToken[];
}

export interface DesignMdMotionContent {
  tokens: MotionToken[];
  principles: string | null;
}

export interface DesignMdSections {
  overview: DesignMdSection<DesignMdOverviewContent>;
  colors: DesignMdSection<DesignMdColorContent>;
  typography: DesignMdSection<DesignMdTypographyContent>;
  spacing: DesignMdSection<DesignMdSpacingContent>;
  shapes: DesignMdSection<DesignMdShapeContent>;
  elevation: DesignMdSection<DesignMdElevationContent>;
  layout: DesignMdSection<DesignMdLayoutContent>;
  components: DesignMdSection<DesignMdComponentContent>;
  motion: DesignMdSection<DesignMdMotionContent>;
}

export interface DesignMdDocument {
  title: string;
  version: string;
  sections: DesignMdSections;
  warnings: string[];
}
