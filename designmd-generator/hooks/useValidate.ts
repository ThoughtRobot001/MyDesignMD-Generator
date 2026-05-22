"use client";

import { useCallback, useState } from "react";
import type { ValidateResponse } from "../lib/types/api";
import type { LintResult } from "../lib/types/design-md";

export interface UseValidateReturn {
  validate: (content: string) => Promise<LintResult | null>;
  lintResult: LintResult | null;
  isValidating: boolean;
  hasError: boolean;
  errorMessage: string | null;
  reset: () => void;
}

/** Manages standalone DESIGN.md validation state. */
export default function useValidate(): UseValidateReturn {
  const [lintResult, setLintResult] = useState<LintResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const reset = useCallback((): void => {
    setLintResult(null);
    setIsValidating(false);
    setHasError(false);
    setErrorMessage(null);
  }, []);

  const validate = useCallback(async (content: string): Promise<LintResult | null> => {
    try {
      setIsValidating(true);
      setHasError(false);
      setErrorMessage(null);
      const result = (await (await fetch("/api/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      })).json()) as ValidateResponse;

      if (!result.success) {
        setHasError(true);
        setErrorMessage(result.error ?? "Validation failed.");
        setIsValidating(false);
        return null;
      }

      setLintResult(result.data ?? null);
      setIsValidating(false);
      return result.data ?? null;
    } catch (error) {
      setHasError(true);
      setErrorMessage(error instanceof Error ? error.message : "Validation failed unexpectedly.");
      setIsValidating(false);
      return null;
    }
  }, []);

  return { validate, lintResult, isValidating, hasError, errorMessage, reset };
}
