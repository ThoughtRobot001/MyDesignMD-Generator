export interface DownloadButtonProps {
  markdown: string;
  filename?: string;
}

/** Renders a control for downloading generated DESIGN.md output. */
export function DownloadButton(_props: DownloadButtonProps): JSX.Element {
  return <button type="button">Download DESIGN.md</button>;
}
