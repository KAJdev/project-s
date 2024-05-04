import { useStar } from "@/lib/scan";
import { Field, Inspector } from "./Inspector";

export function StarInspect({ starId }: { starId: ID }) {
  const star = useStar(starId);
  if (!star)
    return <Inspector title="unknown" nothingMessage="No star found." />;

  return (
    <Inspector
      title={star.name}
      nothingMessage="No star selected"
      draggable={false}
      dividerText="Star Information"
    >
      <Field label="Coordinates">
        ({star.position.x.toFixed(4)} LY, {star.position.y.toFixed(4)} LY)
      </Field>
    </Inspector>
  );
}
