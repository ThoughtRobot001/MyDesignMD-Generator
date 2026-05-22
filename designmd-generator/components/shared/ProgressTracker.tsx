import { Check, X } from "lucide-react";

export type ProgressStep = {
  id: number;
  label: string;
  description: string;
};

export interface ProgressTrackerProps {
  steps: ProgressStep[];
  currentStep: number;
  isComplete: boolean;
  hasError: boolean;
}

export const GENERATION_STEPS: ProgressStep[] = [
  { id: 0, label: "Receiving Input", description: "Validating your design source" },
  { id: 1, label: "Extracting Tokens", description: "Analyzing colors, typography, and spacing" },
  { id: 2, label: "Generating DESIGN.md", description: "Assembling your design system file" },
  { id: 3, label: "Validating Output", description: "Running the DESIGN.md linter" },
  { id: 4, label: "Complete", description: "Your DESIGN.md is ready" },
];

/** Renders generation progress as a vertical stepper. */
export function ProgressTracker({ steps, currentStep, isComplete, hasError }: ProgressTrackerProps): JSX.Element {
  return (
    <ol className="space-y-0">
      {steps.map((step, index) => {
        const completed = isComplete || index < currentStep;
        const current = !isComplete && index === currentStep;
        const error = hasError && current;

        return (
          <li className="relative flex gap-4 pb-8 last:pb-0" key={step.id}>
            {index < steps.length - 1 ? <span className="absolute left-4 top-8 h-full w-px bg-border" /> : null}
            <span className={getIndicatorClass(completed, current, error)}>
              {error ? <X className="h-4 w-4" /> : completed ? <Check className="h-4 w-4" /> : null}
            </span>
            <span className="min-w-0">
              <span className="block font-semibold text-foreground">{step.label}</span>
              <span className="block text-sm text-muted-foreground">{step.description}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/** Builds the indicator class for a progress step state. */
function getIndicatorClass(completed: boolean, current: boolean, error: boolean): string {
  if (error) {
    return "z-10 flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-white";
  }

  if (completed) {
    return "z-10 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground";
  }

  if (current) {
    return "z-10 flex h-8 w-8 animate-pulse items-center justify-center rounded-full border-2 border-primary bg-background";
  }

  return "z-10 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background";
}
