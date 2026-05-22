import type { DesignMdDocument, LintResult } from "./design-md";
import type { DesignTokens, InputSource } from "./design-tokens";

/** Represents the standard response envelope returned by all API routes. */
export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  warnings?: string[];
};

/** Represents the request body for the main DESIGN.md generation endpoint. */
export type GenerateRequest = {
  inputType: InputSource;
  figmaUrl?: string;
  figmaToken?: string;
  imageBase64?: string;
  imageMimeType?: string;
  websiteUrl?: string;
};

/** Represents the response body for the main DESIGN.md generation endpoint. */
export type GenerateResponse = ApiResponse<DesignMdDocument>;

/** Represents Figma-specific parser input. */
export type FigmaParseInput = {
  figmaUrl: string;
  figmaToken: string;
};

/** Represents image-specific parser input. */
export type ImageParseInput = {
  imageBase64: string;
  mimeType: string;
};

/** Represents URL-specific parser input. */
export type UrlParseInput = {
  websiteUrl: string;
};

/** Represents the request body for parser endpoints. */
export type ParseRequest = { inputType: InputSource } & (
  | FigmaParseInput
  | ImageParseInput
  | UrlParseInput
);

/** Represents the response body for parser endpoints. */
export type ParseResponse = ApiResponse<DesignTokens>;

/** Represents the request body for the DESIGN.md validation endpoint. */
export type ValidateRequest = {
  content: string;
};

/** Represents the response body for the DESIGN.md validation endpoint. */
export type ValidateResponse = ApiResponse<LintResult>;
