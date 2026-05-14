export interface UrlInputProps {
  defaultValue?: string;
  onSubmit?: (websiteUrl: string) => void;
}

/** Renders the website URL input form. */
export function UrlInput(_props: UrlInputProps): JSX.Element {
  return (
    <form>
      <label htmlFor="website-url">Website URL</label>
      <input id="website-url" name="website-url" type="url" placeholder="https://example.com" />
      <button type="submit">Generate</button>
    </form>
  );
}
