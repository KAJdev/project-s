import { create } from "zustand";
import { request } from "./api";
import { stat } from "fs";
import { useSelf, userStore } from "./users";
import { gameStore, useGame } from "./games";
import { mapState } from "./map";
import { getHyperSpaceDistance } from "./players";
import { distance } from "./utils";
import { shallow } from "zustand/shallow";
import { useShallow } from "zustand/react/shallow";

export type Technology =
  | "scanning"
  | "hyperspace"
  | "terraforming"
  | "experimentation"
  | "weapons"
  | "banking"
  | "manufacturing";

export type PlanetAspect = "economy" | "industry" | "science";

type BasePlanet = {
  id: ID;
  game: ID;
  orbits: ID;
  distance: number;
  theta: number;
  position: { x: number; y: number };
  name: string;
  occupier: ID | null;
};

type PlanetScanData = {
  ships: number;
  ship_accum: number;
  economy: number | null;
  industry: number | null;
  science: number | null;
  resources: number | null;
  warp_gate: boolean | null;
};

export type Planet = BasePlanet & Partial<PlanetScanData>;

export type Star = {
  id: ID;
  game: ID;
  position: { x: number; y: number };
  name: string;
};

export type Destination = { planet: ID; action: "collect" | "drop" | null };

export type Carrier = {
  id: ID;
  game: ID;
  owner: ID;
  name: string;
  position: { x: number; y: number };
  destination_queue: Destination[];
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
  planets: Planet[];
  carriers: Carrier[];
  players: Player[];
};

export const scanStore = create<{
  scan: Scan | null;
  setScan: (scan: Scan | null) => void;
  lastTick: number | null;
  setLastTick: (tick: number | null) => void;
}>((set) => ({
  scan: null,
  setScan: (scan) => set({ scan }),
  lastTick: null,
  setLastTick: (lastTick) => set({ lastTick }),
}));

export async function fetchScan(gameId: ID) {
  const scan = await request<Scan>(`/games/${gameId}/scan`);
  scanStore.getState().setScan(scan || null);
}

export async function buildCarrier(
  planetId: ID,
  ships: number = 1,
  name?: string
) {
  const scan = scanStore.getState().scan;
  if (!scan) return;
  const newcarrier = await request<Carrier>(`/games/${scan.game}/carriers`, {
    method: "POST",
    body: { planet_id: planetId, ships, name },
  });

  if (!newcarrier) return;

  scanStore.getState().setScan({
    ...scan,
    carriers: [...scan.carriers, newcarrier],
    // subtract ships from star
    planets: scan.planets.map((p) =>
      p.id === planetId && exists(p.ships)
        ? { ...p, ships: p.ships! - ships }
        : p
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
      planets: scan.planets.map((p) =>
        [fromEntity, toEntity].includes(p.id) && exists(p.ships)
          ? {
              ...p,
              ships: p.ships! + (p.id === fromEntity ? -amount : amount),
            }
          : p
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
    destinations?: Destination[];
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

export async function addToCarrierDestination(planetId: ID) {
  const scan = scanStore.getState().scan;
  if (!scan) return;

  const planningFor = mapState.getState().flightPlanningFor;
  if (!planningFor) return;

  const carrier = scan.carriers.find((c) => c.id === planningFor);
  if (!carrier) return;

  const lastDestination =
    carrier.destination_queue[carrier.destination_queue.length - 1];
  const lastPosition =
    scan.planets.find((s) => s.id === lastDestination?.planet)?.position ??
    carrier.position;
  const newDestination = scan.planets.find((s) => s.id === planetId)?.position!;
  const owner = scan.players.find((p) => p.id === carrier.owner);
  if (!owner) return;

  if (distance(lastPosition, newDestination) > getHyperSpaceDistance(owner))
    return;

  const newCarrier = await updateCarrier(carrier.id, {
    destinations: carrier.destination_queue.concat({
      planet: planetId,
      action: "collect",
    }),
  });

  return newCarrier;
}

export function editDestinationAction(
  carrierId: ID,
  index: number,
  action: "collect" | "drop" | null
) {
  const scan = scanStore.getState().scan;
  if (!scan) return;

  const carrier = scan.carriers.find((c) => c.id === carrierId);
  if (!carrier) return;

  const newDestinations = carrier.destination_queue.map((d, i) =>
    i === index ? { ...d, action } : d
  );

  updateCarrier(carrierId, { destinations: newDestinations });
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

export async function upgradePlanet(planetId: ID, type: PlanetAspect) {
  const scan = scanStore.getState().scan;
  if (!scan) return;

  const planet = scan.planets.find((p) => p.id === planetId);
  if (!planet) return;

  const player = scan.players.find((p) => p.id === planet.occupier);
  if (!player) return;

  const cost = getPlanetCosts(planet, player);

  if (player.cash! < cost[type]) return;

  const newPlanet = await request<Planet>(
    `/games/${scan.game}/planets/${planetId}/upgrade`,
    {
      method: "PATCH",
      body: { aspect: type },
    }
  );

  if (!newPlanet) return;

  scanStore.getState().setScan({
    ...scan,
    planets: scan.planets.map((p) => (p.id === planetId ? newPlanet : p)),
    players: scan.players.map((p) =>
      p.id === player.id ? { ...p, cash: p.cash! - cost[type] } : p
    ),
  });

  return newPlanet;
}

export function useGameScan(gameId: ID | undefined) {
  const scan = scanStore(useShallow((state) => state.scan));
  useEffect(() => {
    if (!gameId || scan?.game === gameId) return;
    fetchScan(gameId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId]);

  return scan;
}

export function useScan() {
  return scanStore(useShallow((state) => state.scan));
}

export function usePlayer() {
  const scan = useScan();
  const user = useSelf();
  return useMemo(
    () => scan?.players.find((p) => p.user === user?.id),
    [scan, user]
  );
}

export function useSpecificPlayer(playerId: ID | undefined | null) {
  const scan = useScan();
  return scan?.players.find((p) => p.id === playerId);
}

export function usePlayers(ids: ID[]) {
  const scan = useScan();
  return scan?.players.filter((p) => ids.includes(p.id)) || ([] as Player[]);
}

export function useStar(starId: ID) {
  const scan = useScan();
  return scan?.stars.find((s) => s.id === starId);
}

export function useStars(ids: ID[]) {
  const scan = useScan();
  return ids
    .map((id) => scan?.stars.find((s) => s.id === id))
    .filter(exists) as Star[];
}

export function usePlanet(planetId: ID | undefined | null) {
  const scan = useScan();
  return scan?.planets.find((p) => p.id === planetId) as Planet | null;
}

export function usePlanets(ids: ID[]) {
  const scan = useScan();
  return ids
    .map((id) => scan?.planets.find((p) => p.id === id))
    .filter(exists) as Planet[];
}

export function useCarrier(carrierId: ID | undefined | null) {
  const scan = useScan();
  return useMemo(
    () => scan?.carriers.find((c) => c.id === carrierId),
    [scan, carrierId]
  );
}

export function useCarriers(ids: ID[]) {
  const scan = useScan();
  return scan?.carriers.filter((c) => ids.includes(c.id)) || ([] as Carrier[]);
}

export function useCarriersAround(
  position: { x: number; y: number } | undefined,
  d: number = 0.2
): Carrier[] {
  const carriers = useScan()?.carriers;
  return useMemo(() => {
    if (!position) return [];
    return (
      carriers?.filter((c) => distance(c.position, position) <= d) ||
      ([] as Carrier[])
    );
  }, [carriers, position, d]);
}

export function useStarsAround(
  position: { x: number; y: number } | undefined,
  d: number = 0.2
): Star[] {
  const stars = useScan()?.stars;
  return useMemo(() => {
    if (!position) return [];
    return (
      stars?.filter((s) => distance(s.position, position) <= d) ||
      ([] as Star[])
    );
  }, [stars, position, d]);
}

export function usePlanetsAround(
  position: { x: number; y: number } | undefined,
  d: number = 0.2
): Planet[] {
  const planets = useScan()?.planets;
  return useMemo(() => {
    if (!position) return [];
    return (
      planets?.filter((p) => distance(p.position, position) <= d) ||
      ([] as Planet[])
    );
  }, [planets, position, d]);
}

export function useOrbitingPlanets(starId: ID) {
  const scan = useScan();
  return scan?.planets.filter((p) => p.orbits === starId) || ([] as Planet[]);
}

export function getPlanetCosts(planet: Planet, player: Player) {
  const terraforming_level = player.research_levels.terraforming;
  const resources = planet?.resources || 0;

  const economy =
    (2.5 * 2 * (planet?.economy! + 1)) /
    ((resources + 5 * terraforming_level) / 100);
  const industry =
    (5 * 2 * (planet?.industry! + 1)) /
    ((resources + 5 * terraforming_level) / 100);
  const science =
    (20 * 2 * (planet?.science! + 1)) /
    ((resources + 5 * terraforming_level) / 100);
  const warp_gate = (50 * 2 * 100) / (resources + 5 * terraforming_level);

  return { economy, industry, science, warp_gate };
}

export function usePlanetCosts(planetId: ID | undefined): {
  economy: number;
  industry: number;
  science: number;
  warp_gate: number;
} {
  const scan = useScan();
  const game = useGame(scan?.game);
  const planet = scan?.planets.find((p) => p.id === planetId);
  const player = scan?.players.find((p) => p.id === planet?.occupier);

  if (!game || !player || !planet)
    return { economy: 0, industry: 0, science: 0, warp_gate: 0 };

  return getPlanetCosts(planet!, player);
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
    const toPlanet = scan.planets.find((p) => p.id === to);
    if (toPlanet?.warp_gate) {
      speed = game.settings.warp_speed;
    }
    to = toPlanet?.position!;
  }

  if (typeof from === "string") {
    from = scan.planets.find((p) => p.id === from)?.position!;
  }

  return distance(from, to) / speed;
}
