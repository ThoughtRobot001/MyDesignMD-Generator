/** Represents one lint issue emitted by DESIGN.md validation. */
export type LintIssue = {
  rule: string;
  message: string;
  severity: "error" | "warning";
};

/** Represents the full lint result for a rendered DESIGN.md document. */
export type LintResult = {
  passed: boolean;
  errors: LintIssue[];
  warnings: LintIssue[];
};

/** Represents one rendered DESIGN.md section. */
export type DesignMdSection = {
  title: string;
  yaml: string | null;
  prose: string;
};

/** Represents the complete structured and rendered DESIGN.md document. */
export type DesignMdDocument = {
  name: string;
  version: string;
  sections: {
    overview: DesignMdSection;
    colors: DesignMdSection;
    typography: DesignMdSection;
    spacing: DesignMdSection;
    shapes: DesignMdSection;
    elevation: DesignMdSection;
    layout: DesignMdSection;
    components: DesignMdSection;
    motion: DesignMdSection;
    guidelines: DesignMdSection;
    responsive: DesignMdSection;
    iteration: DesignMdSection;
  };
  raw: string;
  isValid: boolean;
  lintResult: LintResult | null;
};
