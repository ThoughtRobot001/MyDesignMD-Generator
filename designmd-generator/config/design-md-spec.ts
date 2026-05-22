export const DESIGN_MD_VERSION = "1.0.0";

export type SectionId =
  | "overview"
  | "colors"
  | "typography"
  | "spacing"
  | "shapes"
  | "elevation"
  | "layout"
  | "components"
  | "motion";

export const DESIGN_MD_SECTIONS: readonly {
  id: SectionId;
  title: string;
  hasYaml: boolean;
  required: boolean;
  description: string;
}[] = [
  { id: "overview", title: "Overview", hasYaml: false, required: true, description: "Brand personality and visual tone." },
  { id: "colors", title: "Colors", hasYaml: true, required: true, description: "Color tokens and semantic roles." },
  { id: "typography", title: "Typography", hasYaml: true, required: true, description: "Type styles and hierarchy." },
  { id: "spacing", title: "Spacing", hasYaml: true, required: true, description: "Spacing scale and grid rhythm." },
  { id: "shapes", title: "Shapes", hasYaml: true, required: false, description: "Radius tokens and shape language." },
  { id: "elevation", title: "Elevation & Depth", hasYaml: true, required: false, description: "Shadow tokens or flat hierarchy." },
  { id: "layout", title: "Layout", hasYaml: false, required: true, description: "Grid model, max-width, and breakpoints." },
  { id: "components", title: "Components", hasYaml: false, required: false, description: "Component variants and states." },
  { id: "motion", title: "Motion", hasYaml: true, required: false, description: "Durations, easing, and animation principles." },
];

export const REQUIRED_TOKEN_FIELDS: Record<SectionId, string[]> = {
  overview: [],
  colors: ["hex", "role"],
  typography: ["fontFamily", "fontSize", "fontWeight"],
  spacing: ["tokens"],
  shapes: ["value"],
  elevation: [],
  layout: [],
  components: [],
  motion: ["duration", "easing"],
};

export const CONFIDENCE_THRESHOLDS: { low: number; medium: number; high: number } = {
  low: 0.5,
  medium: 0.7,
  high: 0.9,
};

/** Finds a DESIGN.md section definition by its identifier. */
export function getSectionById(id: SectionId): (typeof DESIGN_MD_SECTIONS)[number] | undefined {
  return DESIGN_MD_SECTIONS.find((section) => section.id === id);
}
