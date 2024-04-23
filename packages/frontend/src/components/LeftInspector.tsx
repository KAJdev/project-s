import { mapState } from "@/lib/map";
import { StarInspect } from "./StarInspect";
import { SelfInspect } from "./SelfInspect";

export function LeftInspector() {
  const { selected } = mapState();

  return (
    <div className="flex flex-col sm:gap-4 w-full">
      <SelfInspect />
      {selected?.type === "star" && <StarInspect starId={selected.id} />}
    </div>
  );
}
