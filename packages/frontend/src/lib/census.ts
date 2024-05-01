import { create } from "zustand";
import { request } from "./api";
import { Technology, scanStore, useScan } from "./scan";
import { persist } from "zustand/middleware";

export type CensusPlayerPoint = {
  player: string;
  stars: number;
  carriers: number;
  ships: number;
  industry: number;
  economy: number;
  science: number;
  research_levels: Record<Technology, number>;
};

export type CensusPoint = {
  id: ID;
  created_at: string;
  game: ID;
  players: CensusPlayerPoint[];
};

export async function fetchCensus(gameId: ID) {
  return await request<CensusPoint[]>(`/games/${gameId}/census`);
}

export function useCensus(gameId: ID | null | undefined): CensusPoint[] {
  const [census, setCensus] = useState<CensusPoint[]>([]);
  const scan = useScan();

  useEffect(() => {
    if (!gameId) return;
    fetchCensus(gameId).then((data) => setCensus(data));
  }, [gameId, scan]);

  return census;
}
