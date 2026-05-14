export type ProgressStepStatus = "pending" | "active" | "complete" | "error";

export interface ProgressStep {
  id: string;
  label: string;
  status: ProgressStepStatus;
}

export interface ProgressTrackerProps {
  steps: ProgressStep[];
}

/** Renders generation progress across parser, generator, and validator steps. */
export function ProgressTracker({ steps }: ProgressTrackerProps): JSX.Element {
  return (
    <section>
      <ol>
        {steps.map((step) => (
          <li key={step.id} data-status={step.status}>
            {step.label}
          </li>
        ))}
      </ol>
    </section>
  );
}
