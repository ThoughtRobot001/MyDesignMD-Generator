export interface ImageInputProps {
  acceptedTypes?: string[];
  onSubmit?: (file: File) => void;
}

/** Renders the image upload input form. */
export function ImageInput(_props: ImageInputProps): JSX.Element {
  return (
    <form>
      <label htmlFor="design-image">Design image</label>
      <input id="design-image" name="design-image" type="file" accept="image/*" />
      <button type="submit">Generate</button>
    </form>
  );
}
