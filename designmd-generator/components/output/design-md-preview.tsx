import type { ValidationMessage } from "../../lib/types/api";

export interface DesignMdPreviewProps {
  markdown: string;
  validationMessages?: ValidationMessage[];
}

/** Renders a syntax-highlighted DESIGN.md preview. */
export function DesignMdPreview({ markdown }: DesignMdPreviewProps): JSX.Element {
  return (
    <section>
      <pre>
        <code>{markdown}</code>
      </pre>
    </section>
  );
}
