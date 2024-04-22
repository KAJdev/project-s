import { Player } from "./scan";

export function getScanningDistance(player: Player) {
  return player.research_levels.scanning + 2;
}

export function getHyperSpaceDistance(player: Player) {
  return player.research_levels.hyperspace + 3;
}
