import { scanStore, usePlayer, useScan } from "@/lib/scan";
import { Inspector } from "./Inspector";
import { useGame } from "@/lib/games";

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
    <Inspector>
      <div className="flex justify-between">
        <p style={{ color: self.color }}>{self.name}</p>
        <p>
          ${self.cash}
          <span className="text-green-500/75 ml-2 bg-white/10">
            +${cashPerHour.toFixed(2)}/hr
          </span>
        </p>
      </div>
    </Inspector>
  );
}
