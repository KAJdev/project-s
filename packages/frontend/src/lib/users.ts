import { create } from "zustand";
import { authFetch } from "./authenticatedFetch";
import { request } from "./api";

export type User = {
  id: ID;
  username: string;
  display_name: string;
  avatar_url: string;
  banner_url: string;
  bio: string;
  email?: string;
};

export const userStore = create<{
  users: Map<ID, User>;
  user: User | null;
  setUser: (user: User) => void;
  setUsers: (users: Map<ID, User>) => void;
  addUser: (user: User) => void;
  removeUser: (user: ID) => void;
  clearUsers: () => void;
}>((set) => ({
  users: new Map(),
  user: null,
  setUser: (user) => set({ user }),
  setUsers: (users) => set({ users }),
  addUser: (user) =>
    set((state) => {
      state.users.set(user.id, user);
      return {
        users: state.users,
      };
    }),
  removeUser: (user) =>
    set((state) => {
      state.users.delete(user);
      return {
        users: state.users,
      };
    }),
  clearUsers: () => set({ users: new Map() }),
}));

export function useFetchUser() {
  useEffect(() => {
    async function fetchUser() {
      const user = await request<User>("/users/@me");
      if (!user) return;
      userStore.getState().setUser(user);
      userStore.getState().addUser(user);
    }

    fetchUser();
  }, []);
}

export function useUser(id: ID) {
  const user = userStore((state) => state.users.get(id));

  useEffect(() => {
    async function fetchUser() {
      const user = await request<User>(`/users/${id}`);
      if (!user) return;
      userStore.getState().addUser(user);
    }

    if (!user) {
      fetchUser();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return user;
}

export function useSelf() {
  return userStore((state) => state.user);
}

export async function updateSelf(user: Partial<User>) {
  const updatedUser = await request<User>("/users/@me", {
    method: "PATCH",
    body: user,
  });
  if (!updatedUser) return;
  userStore.getState().setUser(updatedUser);
  userStore.getState().addUser(updatedUser);
}
