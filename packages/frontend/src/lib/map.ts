import { create } from "zustand";

type SelectionObject = {
  type: "star" | "carrier";
  id: ID;
};

export type MapState = {
  zoom: number;
  camera: { x: number; y: number };
  selected: SelectionObject[];
  panning: boolean;
  flightPlanningFor: ID | null;

  setZoom: (zoom: number) => void;
  setCamera: (camera: { x: number; y: number }) => void;
  setSelected: (selected: SelectionObject[]) => void;
  setPanning: (panning: boolean) => void;
  setFlightPlanningFor: (id: ID | null) => void;

  addSelected: (selected: SelectionObject) => void;
  removeSelected: (selected: SelectionObject) => void;
};

export const mapState = create<MapState>((set) => ({
  zoom: 100,
  camera: { x: 0, y: 0 },
  selected: [],
  panning: false,
  flightPlanningFor: null,

  setZoom: (zoom) => set({ zoom }),
  setCamera: (camera) => set({ camera }),
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

export function useZoom() {
  return mapState((s) => s.zoom);
}
