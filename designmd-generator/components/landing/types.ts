export type InputTabType = 'URL' | 'SCREENSHOT' | 'FIGMA';

export type ProcessingStatus = 'IDLE' | 'PROGRESS_UPLOAD' | 'PROGRESS_ANALYZE' | 'COMPLETED';

export interface DesignToken {
  name: string;
  value: string;
  category: 'color' | 'typography' | 'spacing' | 'corner';
  description?: string;
  cssVar?: string;
}

export interface TypographyRow {
  role: string;
  font: string;
  size: string;
  weight: string;
  lineHeight: string;
  spacing?: string;
}

export interface ColorSwatch {
  name: string;
  hex: string;
  useCase: string;
}

export interface ComponentBreakdown {
  name: string;
  description: string;
  variants: {
    name: string;
    details: string;
  }[];
  tokensUsed: string[];
  codeSnippet: string;
}

export interface GeneratedDocument {
  title: string;
  createdAt: string;
  confidence: number;
  overview: string;
  colors: ColorSwatch[];
  typography: TypographyRow[];
  spacing: { token: string; px: string; context: string }[];
  components: ComponentBreakdown[];
  markdown: string;
}

export interface SamplePreset {
  id: string;
  tabType: InputTabType;
  title: string;
  inputValue: string;
  description: string;
  promptHint: string;
  doc: GeneratedDocument;
}
