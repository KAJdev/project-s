import { create } from "zustand";

type SelectionObject = {
  type: "star" | "carrier";
  id: ID;
};

export type MapState = {
  zoom: number;
  camera: { x: number; y: number };
  selected: SelectionObject | null;
  panning: boolean;

  setZoom: (zoom: number) => void;
  setCamera: (camera: { x: number; y: number }) => void;
  setSelected: (selected: SelectionObject | null) => void;
  setPanning: (panning: boolean) => void;
};

export const mapState = create<MapState>((set) => ({
  zoom: 10,
  camera: { x: 0, y: 0 },
  selected: null,
  panning: false,

  setZoom: (zoom) => set({ zoom }),
  setCamera: (camera) => set({ camera }),
  setSelected: (selected) => set({ selected }),
  setPanning: (panning) => set({ panning }),
}));
