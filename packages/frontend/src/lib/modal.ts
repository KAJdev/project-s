import { create } from "zustand";

export type ModalState = boolean;

export const modalStore = create<{
  modals: Map<string, ModalState>;
  openModal: (modal: string) => void;
  closeModal: (modal: string) => void;
  clearModals: () => void;
}>((set) => ({
  modals: new Map(),
  openModal: (modal) =>
    set((state) => ({ ...state, modals: state.modals.set(modal, true) })),
  closeModal: (modal) =>
    set((state) => ({ ...state, modals: state.modals.set(modal, false) })),
  clearModals: () => set({ modals: new Map() }),
}));

export function useModal(modal: string) {
  const modalState = modalStore((state) => state.modals.get(modal)) ?? false;
  const openModal = () => modalStore.getState().openModal(modal);
  const closeModal = () => modalStore.getState().closeModal(modal);

  return [modalState, openModal, closeModal] as const;
}

export function openModal(modal: string) {
  modalStore.getState().openModal(modal);
}

export function closeModal(modal: string) {
  modalStore.getState().closeModal(modal);
}
