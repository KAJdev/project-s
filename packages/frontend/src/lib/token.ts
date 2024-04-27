import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Token = string;

export const tokenStore = create<{
  token: Token | null;
  setToken: (token: Token | null) => void;
}>()(
  persist(
    (set, get) => ({
      token: null,
      setToken: (token) => set({ token }),
    }),
    {
      name: "token-storage",
    }
  )
);

export function useToken() {
  return tokenStore((state) => state.token);
}

export function getToken() {
  return tokenStore.getState().token;
}

export function deleteToken() {
  tokenStore.getState().setToken(null);
}
