import { Player } from "./scan";

export function getScanningDistance(player: Player) {
  return player.research_levels.scanning + 2;
}
