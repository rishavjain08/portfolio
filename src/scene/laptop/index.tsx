import { stage } from "../../config/stage";
import { ModelLaptop } from "./ModelLaptop";
import { ProceduralLaptop } from "./ProceduralLaptop";

/**
 * One entry point. `stage.variant` picks the CC0 Poly Haven model or the
 * procedural aluminium chassis; both read the same timeline functions, so the
 * camera path does not care which is mounted.
 */
export function Laptop({ progress }: { progress: React.RefObject<number> }) {
  return stage.variant === "model" ? (
    <ModelLaptop progress={progress} />
  ) : (
    <ProceduralLaptop progress={progress} />
  );
}
