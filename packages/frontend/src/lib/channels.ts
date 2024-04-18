import { create } from "zustand";
import { request } from "./api";
import { stat } from "fs";

export type Channel = {
  id: ID;
  name: string;
  description: string;
  owner: ID;
  members: ID[];
  icon_url: string | null;
  created_at: string;
  updated_at: string;
  public: boolean;
};

export const channelStore = create<{
  channels: Channel[];
  setChannels: (channels: Channel[]) => void;
  addChannel: (channel: Channel) => void;
  removeChannel: (channel: ID) => void;
  clearChannels: () => void;
}>((set) => ({
  channels: [],
  setChannels: (channels) => set({ channels }),
  addChannel: (channel) => {
    // make sure not to add duplicate channels
    const exists = channelStore
      .getState()
      .channels.find((c) => c.id === channel.id);
    if (!exists) {
      set((state) => ({ channels: [...state.channels, channel] }));
    } else {
      set((state) => ({
        channels: state.channels.map((c) =>
          c.id === channel.id ? channel : c
        ),
      }));
    }
  },
  removeChannel: (channel) =>
    set((state) => ({
      channels: state.channels.filter((c) => c.id !== channel),
    })),
  clearChannels: () => set({ channels: [] }),
}));

export async function createChannel(name: string, description: string) {
  const channel: Partial<Channel> = {
    name,
    description,
  };

  await request<Channel>("/channels", {
    method: "POST",
    body: channel,
  });
}
