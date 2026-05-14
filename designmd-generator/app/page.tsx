import { InputRouter } from "../components/input/input-router";

/** Renders the landing page and input entry point. */
export default function HomePage(): JSX.Element {
  return (
    <main>
      <h1>DesignMD Generator</h1>
      <InputRouter mode="url" />
    </main>
  );
}
