import { create } from "zustand";
import { request } from "./api";
import { stat } from "fs";

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

export type Star = (BaseStar & StarScanData) | BaseStar;

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

  research_queue: Technology[] | null;
  research: Record<Technology, number>;
};

export type Scan = {
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
  useEffect(() => {
    if (!gameId) return;
    fetchScan(gameId);
    const interval = setInterval(() => fetchScan(gameId), 60000);
    return () => clearInterval(interval);
  }, [gameId]);

  return scanStore((state) => state.scan);
}
