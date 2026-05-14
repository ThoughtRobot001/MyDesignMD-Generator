import { DesignMdPreview } from "../../components/output/design-md-preview";
import { DownloadButton } from "../../components/output/download-button";
import { TokenVisualizer } from "../../components/output/token-visualizer";
import type { DesignTokens } from "../../lib/types/design-tokens";

const EMPTY_TOKENS: DesignTokens = {
  source: {
    type: "url",
    value: "",
    capturedAt: "",
  },
  overview: null,
  colors: [],
  typography: [],
  spacing: [],
  shapes: [],
  elevation: [],
  layout: {
    gridStrategy: null,
    maxWidth: null,
    safeArea: null,
    breakpoints: [],
  },
  components: [],
  motion: [],
  warnings: [],
};

/** Renders the generation result page. */
export default function GeneratePage(): JSX.Element {
  const markdown = "# DesignMD Generator\n\nTODO: Generate DESIGN.md output.";

  return (
    <main>
      <h1>Generated DESIGN.md</h1>
      <TokenVisualizer tokens={EMPTY_TOKENS} />
      <DesignMdPreview markdown={markdown} />
      <DownloadButton markdown={markdown} />
    </main>
  );
}
