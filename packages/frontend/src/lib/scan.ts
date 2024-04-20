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

export type Star = {
  id: ID;
  game: ID;
  position: { x: number; y: number };
  name: string;
  occupier: ID | null;
  ships: number;
  ship_accum: number;
  economy: number | null;
  industry: number | null;
  science: number | null;
  resources: number | null;
  warp_gate: boolean | null;
};

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
  game: ID;
  user: ID;

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

export function useScan(gameId: ID) {
  useEffect(() => {
    fetchScan(gameId);
    const interval = setInterval(() => fetchScan(gameId), 60000);
    return () => clearInterval(interval);
  }, [gameId]);

  return scanStore((state) => state.scan);
}
