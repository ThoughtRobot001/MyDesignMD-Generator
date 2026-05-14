import type { DesignMdDocument } from "./design-md";
import type { DesignTokens, TokenSourceType } from "./design-tokens";

export type ApiSuccessResponse<TData> = {
  success: true;
  data: TData;
  warnings?: string[];
};

export type ApiErrorResponse = {
  success: false;
  error: string;
  warnings?: string[];
};

export type ApiResponse<TData> = ApiSuccessResponse<TData> | ApiErrorResponse;

export type GenerateInputType = TokenSourceType;

export type ValidationSeverity = "error" | "warning" | "info";

export interface GenerateRequest {
  inputType: GenerateInputType;
  value: string;
}

export interface GenerateResponseData {
  tokens: DesignTokens;
  document: DesignMdDocument;
  markdown: string;
  validation: ValidationResponseData;
}

export interface ParserRequest {
  inputType: GenerateInputType;
  value: string;
}

export interface ParserResponseData {
  tokens: DesignTokens;
}

export interface ValidateRequest {
  markdown: string;
}

export interface ValidationMessage {
  severity: ValidationSeverity;
  message: string;
  line: number | null;
  column: number | null;
  ruleId: string | null;
}

export interface ValidationResponseData {
  valid: boolean;
  messages: ValidationMessage[];
}

export interface RouteContext<TParams extends Record<string, string> = Record<string, string>> {
  params: TParams;
}

export type LegacyApiResponse<TData> = {
  success: boolean;
  data?: TData;
  error?: string;
  warnings?: string[];
};
