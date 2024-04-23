import { create } from "zustand";
import { request } from "./api";
import { stat } from "fs";
import { useSelf } from "./users";
import { useGame } from "./games";

export type Technology =
  | "scanning"
  | "hyperspace"
  | "terraforming"
  | "experimentation"
  | "weapons"
  | "banking"
  | "manufacturing";

type BaseStar = {
  id: ID;
  game: ID;
  position: { x: number; y: number };
  name: string;
  occupier: ID | null;
};

type StarScanData = {
  ships: number;
  ship_accum: number;
  economy: number | null;
  industry: number | null;
  science: number | null;
  resources: number | null;
  warp_gate: boolean | null;
};

export type Star = BaseStar & Partial<StarScanData>;

export type Carrier = {
  id: ID;
  game: ID;
  owner: ID;
  name: string;
  position: { x: number; y: number };
  destination_queue: ID[];
  ships: number;
};

export type Player = {
  id: ID;
  name: string;
  game: ID;
  user: ID;
  color: string;
  cash?: number;

  research_queue?: Technology[] | null;
  research_levels: Record<Technology, number>;
  research_points?: Record<Technology, number>;
};

export type Scan = {
  game: ID;
  stars: Star[];
  carriers: Carrier[];
  players: Player[];
};

export const scanStore = create<{
  scan: Scan | null;
  setScan: (scan: Scan | null) => void;
}>((set) => ({
  scan: null,
  setScan: (scan) => set({ scan }),
}));

export async function fetchScan(gameId: ID) {
  const scan = await request<Scan>(`/games/${gameId}/scan`);
  scanStore.getState().setScan(scan || null);
}

export function useScan(gameId: ID | undefined) {
  const scan = scanStore((state) => state.scan);
  useEffect(() => {
    if (!gameId || scan?.game === gameId) return;
    fetchScan(gameId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId]);

  return scan;
}

export function usePlayer() {
  const scan = scanStore((state) => state.scan);
  const user = useSelf();
  return scan?.players.find((p) => p.user === user?.id);
}

export function useSpecificPlayer(playerId: ID | undefined) {
  const scan = scanStore((state) => state.scan);
  return scan?.players.find((p) => p.id === playerId);
}

export function useStar(starId: ID) {
  const scan = scanStore((state) => state.scan);
  return scan?.stars.find((s) => s.id === starId);
}

export function useStarCosts(starId: ID | undefined): {
  economy: number;
  industry: number;
  science: number;
  warp_gate: number;
} {
  const scan = scanStore((state) => state.scan);
  const game = useGame(scan?.game);
  const star = scan?.stars.find((s) => s.id === starId);
  const player = scan?.players.find((p) => p.id === star?.occupier);

  if (!game || !player)
    return { economy: 0, industry: 0, science: 0, warp_gate: 0 };

  const terraforming_level = player.research_levels.terraforming;
  const resources = star?.resources || 0;

  const economy =
    (2.5 * 2 * (star?.economy || 0 + 1)) /
    ((resources + 5 * terraforming_level) / 100);
  const industry =
    (5 * 2 * (star?.industry || 0 + 1)) /
    ((resources + 5 * terraforming_level) / 100);
  const science =
    (20 * 2 * (star?.science || 0 + 1)) /
    ((resources + 5 * terraforming_level) / 100);
  const warp_gate = (50 * 2 * 100) / (resources + 5 * terraforming_level);

  return { economy, industry, science, warp_gate };
}
