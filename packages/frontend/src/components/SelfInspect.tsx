import { useGame } from "@/lib/games";
import { scanStore, usePlayer } from "@/lib/scan";
import { TickIndicator } from "./TickIndicator";

export function SelfInspect() {
  const self = usePlayer();
  const scan = scanStore((state) => state.scan);
  const game = useGame(scan?.game);

  if (!self) {
    return null;
  }

  const ownedStars = scan?.stars.filter((s) => s.occupier === self.id);
  const totalEconomy =
    ownedStars?.reduce((acc, s) => acc + (s.economy ?? 0), 0) ?? 0;
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
