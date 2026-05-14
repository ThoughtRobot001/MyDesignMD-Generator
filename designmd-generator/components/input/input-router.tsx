import { FigmaInput } from "./figma-input";
import { ImageInput } from "./image-input";
import { UrlInput } from "./url-input";

export type InputRouterMode = "figma" | "image" | "url";

export interface InputRouterProps {
  mode: InputRouterMode;
}

/** Detects the input type and renders the matching input flow. */
export function InputRouter({ mode }: InputRouterProps): JSX.Element {
  if (mode === "figma") {
    return <FigmaInput />;
  }

  if (mode === "image") {
    return <ImageInput />;
  }

  return <UrlInput />;
}
