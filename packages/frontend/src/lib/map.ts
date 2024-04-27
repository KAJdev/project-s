import { create } from "zustand";
import { scanStore, useCarrier, usePlayer } from "./scan";
import { getHyperSpaceDistance } from "./players";
import { distance } from "./utils";

export type SelectionObject = {
  type: "star" | "carrier";
  id: ID;
};

export type MapState = {
  selected: SelectionObject[];
  panning: boolean;
  flightPlanningFor: ID | null;

  setSelected: (selected: SelectionObject[]) => void;
  setPanning: (panning: boolean) => void;
  setFlightPlanningFor: (id: ID | null) => void;

  addSelected: (selected: SelectionObject) => void;
  removeSelected: (selected: SelectionObject) => void;
};

export const mapState = create<MapState>((set) => ({
  selected: [],
  panning: false,
  flightPlanningFor: null,

  setSelected: (selected) => set({ selected }),
  setPanning: (panning) => set({ panning }),
  setFlightPlanningFor: (id) => set({ flightPlanningFor: id }),

  addSelected: (selected) =>
    set((state) => {
      if (state.selected.some((s) => s.id === selected.id)) return state;
      return { selected: [...state.selected, selected] };
    }),
  removeSelected: (selected) =>
    set((state) => ({
      selected: state.selected.filter((s) => s.id !== selected.id),
    })),
}));

export const zoomState = create<{
  zoom: number;
  setZoom: (zoom: number) => void;
}>((set) => ({
  zoom: 100,
  setZoom: (zoom: number) => set({ zoom }),
}));

export function useZoom() {
  return zoomState((s) => s.zoom);
}

export function useFlightPlanningInfo(starId: ID): {
  outsideRange: boolean;
  isTarget: boolean;
  isLastTarget: boolean;
} {
  const flightPlanningFor = mapState((s) => s.flightPlanningFor);
  const carrier = useCarrier(flightPlanningFor);
  const player = usePlayer();

  return useMemo(() => {
    if (!flightPlanningFor || !carrier || !player)
      return {
        outsideRange: false,
        isTarget: false,
        isLastTarget: false,
      };

    const latestDestination =
      carrier.destination_queue[carrier.destination_queue.length - 1];
    const lastDestinationStar = scanStore
      .getState()
      .scan?.stars.find((s) => s.id === latestDestination?.star);
    const thisStar = scanStore
      .getState()
      .scan?.stars.find((s) => s.id === starId);
    if (!thisStar)
      return {
        outsideRange: false,
        isTarget: false,
        isLastTarget: false,
      };

    return {
      outsideRange:
        distance(thisStar.position, (lastDestinationStar ?? carrier).position) >
        getHyperSpaceDistance(player),
      isTarget: carrier.destination_queue.some((d: any) => d.star === starId),
      isLastTarget: latestDestination?.star === starId,
    };
  }, [flightPlanningFor, carrier, player, starId]);
}
