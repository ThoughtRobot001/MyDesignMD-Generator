export interface FigmaInputProps {
  defaultValue?: string;
  onSubmit?: (figmaUrl: string) => void;
}

/** Renders the Figma link input form. */
export function FigmaInput(_props: FigmaInputProps): JSX.Element {
  return (
    <form>
      <label htmlFor="figma-url">Figma link</label>
      <input id="figma-url" name="figma-url" type="url" placeholder="https://figma.com/file/..." />
      <button type="submit">Generate</button>
    </form>
  );
}
