import { create } from "zustand";
import { request } from "./api";
import { stat } from "fs";
import { useSelf } from "./users";
import { gameStore, useGame } from "./games";
import { mapState } from "./map";
import { getHyperSpaceDistance } from "./players";

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

function distance(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
}

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

export async function buildCarrier(
  starId: ID,
  ships: number = 1,
  name?: string
) {
  const scan = scanStore.getState().scan;
  if (!scan) return;
  const newcarrier = await request<Carrier>(`/games/${scan.game}/carriers`, {
    method: "POST",
    body: { star_id: starId, ships, name },
  });

  if (!newcarrier) return;

  scanStore.getState().setScan({
    ...scan,
    carriers: [...scan.carriers, newcarrier],
    // subtract ships from star
    stars: scan.stars.map((s) =>
      s.id === starId && exists(s.ships) ? { ...s, ships: s.ships! - ships } : s
    ),
    // subtract $25
    players: scan.players.map((p) =>
      p.id === newcarrier.owner && exists(p.cash)
        ? { ...p, cash: p.cash! - 25 }
        : p
    ),
  });

  return newcarrier;
}

export async function transferShips(
  fromEntity: ID,
  toEntity: ID,
  amount: number
) {
  const scan = scanStore.getState().scan;
  if (!scan) return;

  const resp = await request<{ success: boolean }>(
    `/games/${scan.game}/transfer`,
    {
      method: "PATCH",
      body: { from_id: fromEntity, to_id: toEntity, amount },
    }
  );

  if (!resp) return;

  if (resp.success) {
    scanStore.getState().setScan({
      ...scan,
      carriers: scan.carriers.map((c) =>
        [fromEntity, toEntity].includes(c.id)
          ? { ...c, ships: c.ships + (c.id === fromEntity ? -amount : amount) }
          : c
      ),
      stars: scan.stars.map((s) =>
        [fromEntity, toEntity].includes(s.id) && exists(s.ships)
          ? {
              ...s,
              ships: s.ships! + (s.id === fromEntity ? -amount : amount),
            }
          : s
      ),
    });
  }
}

export async function updateCarrier(
  carrierId: ID,
  {
    name,
    destinations,
  }: {
    name?: string;
    destinations?: ID[];
  }
) {
  const scan = scanStore.getState().scan;
  if (!scan) return;

  const carrier = scan.carriers.find((c) => c.id === carrierId);
  if (!carrier) return;

  // speculative update
  const saveIncaseOfError = { ...carrier };
  carrier.name = name ?? carrier.name;
  carrier.destination_queue = destinations ?? carrier.destination_queue;

  scanStore.getState().setScan({
    ...scan,
    carriers: scan.carriers.map((c) => (c.id === carrierId ? carrier : c)),
  });

  const updatedCarrier = await request<Carrier>(
    `/games/${scan.game}/carriers/${carrierId}`,
    {
      method: "PATCH",
      body: { name, destinations },
    }
  );

  if (!updatedCarrier) {
    // well, fuck
    scanStore.getState().setScan({
      ...scan,
      carriers: scan.carriers.map((c) =>
        c.id === carrierId ? saveIncaseOfError : c
      ),
    });
    return;
  }

  scanStore.getState().setScan({
    ...scan,
    carriers: scan.carriers.map((c) =>
      c.id === carrierId ? updatedCarrier : c
    ),
  });

  return updatedCarrier;
}

export async function addToCarrierDestination(starId: ID) {
  const scan = scanStore.getState().scan;
  if (!scan) return;

  const planningFor = mapState.getState().flightPlanningFor;
  if (!planningFor) return;

  const carrier = scan.carriers.find((c) => c.id === planningFor);
  if (!carrier) return;

  const lastDestination =
    carrier.destination_queue[carrier.destination_queue.length - 1];
  const lastPosition =
    scan.stars.find((s) => s.id === lastDestination)?.position ??
    carrier.position;
  const newDestination = scan.stars.find((s) => s.id === starId)?.position!;
  const owner = scan.players.find((p) => p.id === carrier.owner);
  if (!owner) return;

  if (distance(lastPosition, newDestination) > getHyperSpaceDistance(owner))
    return;

  const newCarrier = await updateCarrier(carrier.id, {
    destinations: carrier.destination_queue.concat(starId),
  });

  return newCarrier;
}

export async function removeCarrierDestination(carrierId: ID) {
  const scan = scanStore.getState().scan;
  if (!scan) return;

  const carrier = scan.carriers.find((c) => c.id === carrierId);
  if (!carrier) return;

  const newDestinations = carrier.destination_queue.slice(0, -1);

  const newCarrier = await updateCarrier(carrier.id, {
    destinations: newDestinations,
  });

  return newCarrier;
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

export function useSpecificPlayer(playerId: ID | undefined | null) {
  const scan = scanStore((state) => state.scan);
  return scan?.players.find((p) => p.id === playerId);
}

export function usePlayers(ids: ID[]) {
  const scan = scanStore((state) => state.scan);
  return scan?.players.filter((p) => ids.includes(p.id)) || ([] as Player[]);
}

export function useStar(starId: ID) {
  const scan = scanStore((state) => state.scan);
  return scan?.stars.find((s) => s.id === starId);
}

export function useStars(ids: ID[]) {
  const scan = scanStore((state) => state.scan);
  return ids
    .map((id) => scan?.stars.find((s) => s.id === id))
    .filter(exists) as Star[];
}

export function useCarrier(carrierId: ID) {
  const scan = scanStore((state) => state.scan);
  return scan?.carriers.find((c) => c.id === carrierId);
}

export function useCarriers(ids: ID[]) {
  const scan = scanStore((state) => state.scan);
  return scan?.carriers.filter((c) => ids.includes(c.id)) || ([] as Carrier[]);
}

export function useCarriersAround(
  position: { x: number; y: number } | undefined,
  d: number = 0.2
) {
  const scan = scanStore((state) => state.scan);
  if (!position) return [];
  return (
    scan?.carriers.filter((c) => distance(c.position, position) <= d) ||
    ([] as Carrier[])
  );
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

// returns the time it takes to travel from one point/Star to another in hours
export function getETA(
  from: { x: number; y: number } | ID,
  to: { x: number; y: number } | ID
) {
  // grab the game settings
  const scan = scanStore.getState().scan;
  if (!scan) return 0;
  const game = gameStore.getState().games[scan.game];
  if (!game) return 0;

  let speed = game.settings.carrier_speed;
  // check if the two are stars with warp gates
  if (typeof to === "string") {
    const toStar = scan.stars.find((s) => s.id === to);
    if (toStar?.warp_gate) {
      speed = game.settings.warp_speed;
    }
    to = toStar?.position!;
  }

  if (typeof from === "string") {
    from = scan.stars.find((s) => s.id === from)?.position!;
  }

  return distance(from, to) / speed;
}
