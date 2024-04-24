import { mapState } from "@/lib/map";
import { StarInspect } from "./StarInspect";
import { SelfInspect } from "./SelfInspect";
import { CarrierInspect } from "./CarrierInspect";

export function LeftInspector() {
  const { selected } = mapState();

  const firstStar = selected.find((s) => s.type === "star");
  const carriers = selected.filter((s) => s.type === "carrier");

  return (
    <div className="flex flex-col sm:gap-4 w-full">
      <SelfInspect />
      {carriers.length > 0 && (
        <CarrierInspect carrierIds={carriers.map((c) => c.id)} />
      )}
      {firstStar?.type === "star" && <StarInspect starId={firstStar.id} />}
    </div>
  );
}
