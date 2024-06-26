import { useGame } from "@/lib/games";
import { scanStore, usePlayer, useScan } from "@/lib/scan";
import { TickIndicator } from "./TickIndicator";

export function SelfInspect() {
  const self = usePlayer();
  const scan = useScan();
  const game = useGame(scan?.game);

  if (!self) {
    return null;
  }

  const ownedPlanets = scan?.planets?.filter((p) => p.occupier === self.id);
  const totalEconomy =
    ownedPlanets?.reduce((acc, p) => acc + (p.economy ?? 0), 0) ?? 0;
  const cashPerHour =
    totalEconomy / game?.settings.production_cycle_length! / 0.25;

  return (
    <div className="flex justify-between p-4">
      <p style={{ color: self.color }}>{self.name}</p>
      <div className="flex gap-2 items-center">
        <p>
          ${self.cash?.toFixed(0)}
          <span className="text-green-500/75 ml-2 bg-white/10">
            +${cashPerHour.toFixed(2)}/hr
          </span>
        </p>
        <TickIndicator />
      </div>
    </div>
  );
}
