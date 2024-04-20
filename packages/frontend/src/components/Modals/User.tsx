/* eslint-disable @next/next/no-img-element */
import { Body, Modal, Panel } from "../Theme/Modal";
import { useUser } from "@/lib/users";
import { create } from "zustand";
import { Avatar } from "../Theme/Avatar";

export const userModalState = create<{
  openUsers: ID[];
  setOpenUsers: (openUsers: ID[]) => void;
  showUser: (id: ID) => void;
  hideUser: (id: ID) => void;
}>((set) => ({
  openUsers: [],
  setOpenUsers: (openUsers) => set({ openUsers }),
  showUser: (id) =>
    set((state) => {
      state.openUsers.push(id);
      return {
        openUsers: [...state.openUsers],
      };
    }),
  hideUser: (id) =>
    set((state) => {
      state.openUsers = state.openUsers.filter((i) => i !== id);
      return {
        openUsers: [...state.openUsers],
      };
    }),
}));

export function UserModals() {
  const openUsers = userModalState((state) => state.openUsers);

  return (
    <>
      {openUsers.map((id) => (
        <User key={id} id={id} />
      ))}
    </>
  );
}

export function showUser(id: ID) {
  userModalState.getState().showUser(id);
}

export function User({ id }: { id: ID }) {
  const user = useUser(id);
  const openUsers = userModalState((state) => state.openUsers);

  const open = openUsers.includes(id);
  const setClosed = () => userModalState.getState().hideUser(id);

  return (
    <Modal onClose={setClosed} open={open}>
      <Panel>
        {user?.banner_url && (
          <img
            src={user.banner_url}
            alt="Banner"
            className="w-full h-32 object-cover border border-white/5"
          />
        )}
        <Body
          className={classes("flex flex-col gap-4", user?.banner_url && "pt-0")}
        >
          <Avatar user={user} variant="border" />

          <div
            className={classes(
              "flex flex-col gap-1",
              user?.banner_url && "-mt-8"
            )}
          >
            <h1 className="text-2xl font-bold">
              {user?.display_name || user?.username}
            </h1>
            <p className="text-sm text-white/50">@{user?.username}</p>
          </div>

          {/* bio */}
          <p className="text-white/70">{user?.bio}</p>
        </Body>
      </Panel>
    </Modal>
  );
}
