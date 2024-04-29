import { useCensus } from "@/lib/census";
import { scanStore } from "@/lib/scan";

export function Census() {
  const scan = scanStore((state) => state.scan);
  const censusPoints = useCensus(scan?.game);

  if (!scan) return <div className="p-4">No game selected...</div>;

  if (censusPoints.length < 1)
    return <div className="p-4">No census data yet...</div>;

  return (
    <div className="flex flex-col gap-5 p-4 max-h-[40rem] overflow-y-auto"></div>
  );
}
