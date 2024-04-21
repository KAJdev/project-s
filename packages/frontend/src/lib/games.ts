import { create } from "zustand";
import { request } from "./api";
import { Player } from "./scan";
import { useSelf } from "./users";

export enum GameState {
  Waiting, // Waiting for players to join
  Ready, // Ready to start
  Running, // Game is running
  Finished, // Game is finished
}

export type GameSettings = {
  max_players: number;
  star_victory_percentage: number;
  stars_per_player: number;
  production_cycle_length: number;
  trading_level_cost: number;
  carrier_speed: number;
  warp_speed: number;

  starting_stars: number;
  starting_cash: number;
  starting_ships: number;
  starting_economy: number;
  starting_industry: number;
  starting_science: number;

  starting_terraforming: number;
  starting_experimentation: number;
  starting_scanning: number;
  starting_hyperspace: number;
  starting_manufacturing: number;
  starting_banking: number;
  starting_weapons: number;

  terraforming_cost: number;
  experimentation_cost: number;
  scanning_cost: number;
  hyperspace_cost: number;
  manufacturing_cost: number;
  banking_cost: number;
  weapons_cost: number;
};

export type Game = {
  id: ID;
  name: string;
  owner: ID;
  members: Player[];
  created_at: string;
  started_at: string;
  winner: ID | null;
  settings: GameSettings;
};

export const defaultGameSettings: () => GameSettings = () => ({
  max_players: 8,
  star_victory_percentage: 50,
  stars_per_player: 24,
  production_cycle_length: 24,
  trading_level_cost: 15,
  carrier_speed: 0.3333,
  warp_speed: 1,

  starting_stars: 6,
  starting_cash: 500,
  starting_ships: 10,
  starting_economy: 5,
  starting_industry: 5,
  starting_science: 1,

  starting_terraforming: 1,
  starting_experimentation: 1,
  starting_scanning: 1,
  starting_hyperspace: 1,
  starting_manufacturing: 1,
  starting_banking: 1,
  starting_weapons: 1,

  terraforming_cost: 144,
  experimentation_cost: 144,
  scanning_cost: 144,
  hyperspace_cost: 144,
  manufacturing_cost: 144,
  banking_cost: 144,
  weapons_cost: 144,
});

export const gameStore = create<{
  games: Game[];
  setGames: (games: Game[]) => void;
}>((set) => ({
  games: [],
  setGames: (games) => set({ games }),
}));

export async function fetchGames() {
  const games = await request<Game[]>("/games");
  gameStore.getState().setGames(games || []);
}

export function useGames() {
  const games = gameStore((state) => state.games);

  useEffect(() => {
    if (games.length === 0) {
      fetchGames();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return games;
}

export function useGame(gameId: ID | undefined) {
  const games = gameStore((state) => state.games);

  useEffect(() => {
    if (games.length === 0) {
      fetchGames();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return games.find((game) => game.id === gameId) || null;
}

export async function createGame(name: string, settings: GameSettings) {
  return await request<Game>("/games", {
    method: "POST",
    body: { name, settings },
  });
}

export async function joinGame(
  gameId: ID,
  name: string,
  color: string,
  password: string | null
) {
  return await request<Player>(`/games/${gameId}/join`, {
    method: "POST",
    body: { name, color },
    params: password ? { p: password } : undefined,
  });
}

export async function startGame(gameId: ID) {
  return await request<Game>(`/games/${gameId}/start`, {
    method: "POST",
  });
}

export function getGameState(game: Game | null) {
  if (!game) return null;
  if (game.winner) return GameState.Finished;
  if (game.started_at) return GameState.Running;
  if (game.members.length >= game.settings.max_players) return GameState.Ready;
  else return GameState.Waiting;
}

export function useIsGameJoinable(game: Game | null) {
  const user = useSelf();
  if (!game || !user) return false;
  return (
    getGameState(game) === GameState.Waiting &&
    !game.members.find((m) => m.user === user?.id)
  );
}