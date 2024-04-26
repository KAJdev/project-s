import { request } from "./api";
import { Player, Technology, scanStore } from "./scan";
import { userStore } from "./users";

export function getScanningDistance(player: Player) {
  return player.research_levels.scanning + 2;
}

export function getHyperSpaceDistance(player: Player) {
  return player.research_levels.hyperspace + 3;
}

export async function switchActiveResearch(newTech: Technology) {
  const scan = scanStore.getState().scan;
  const user = userStore.getState().user;
  if (!scan || !user) return;

  const player = scan.players.find((p) => p.user === user.id);
  if (!player) return;

  const newPlayer = await request<Player>(`/games/${scan.game}/players/@me`, {
    method: "PATCH",
    body: { research_queue: [newTech] },
  });

  if (!newPlayer) return;

  scanStore.getState().setScan({
    ...scan,
    players: scan.players.map((p) => (p.id === player.id ? newPlayer : p)),
  });

  return newPlayer;
}
