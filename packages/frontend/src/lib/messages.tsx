/* eslint-disable @next/next/no-img-element */
import { create } from "zustand";
import { request } from "./api";
import { useUser, userStore } from "./users";

export type Message = {
  id?: ID;
  content: string;
  owner: ID;
  channel: ID;
  created_at: string; // ISO 8601
  updated_at: string;
  nonce?: string;
};

export const messageStore = create<{
  messages: Record<ID, Message[]>;
  setMessages: (messages: Record<ID, Message[]>) => void;
  addMessage: (message: Message) => void;
  bulkAddContext: (messages: Message[]) => void;
  removeMessage: (message: ID, channel: ID) => void;
  clearMessages: () => void;
}>((set) => ({
  messages: {},
  setMessages: (messages) => set({ messages }),
  addMessage: (message) =>
    set((state) => {
      // dudpe by ID and nonce
      const messages = state.messages[message.channel] ?? [];
      const dupes = messages.filter(
        (m) =>
          (message.id && m.id === message.id) ||
          (message.nonce && m.nonce === message.nonce)
      );

      const filtered = messages.filter((m) => !dupes.includes(m));
      filtered.push(message);

      filtered.sort((a, b) => {
        const aDate = new Date(a.created_at).getTime();
        const bDate = new Date(b.created_at).getTime();
        return aDate - bDate;
      });

      return {
        messages: {
          ...state.messages,
          [message.channel]: filtered,
        },
      };
    }),
  bulkAddContext: (messages) =>
    set((state) => {
      const channel = messages[0].channel;
      const current = state.messages[channel] ?? [];
      const newMessages = messages.filter(
        (m) => !current.find((c) => c.id === m.id)
      );

      const allMessages = [...current, ...newMessages].sort((a, b) => {
        const aDate = new Date(a.created_at).getTime();
        const bDate = new Date(b.created_at).getTime();
        return aDate - bDate;
      });

      return {
        messages: {
          ...state.messages,
          [channel]: allMessages,
        },
      };
    }),
  removeMessage: (message, channel) =>
    set((state) => {
      state.messages[channel] = state.messages[channel].filter(
        (m) => m.id !== message && m.nonce !== message
      );
      return {
        ...state,
      };
    }),
  clearMessages: () => set({ messages: {} }),
}));

export function useChannelMessages(channel: ID | undefined) {
  if (!channel) {
    return [] as const;
  }
  return messageStore((state) => state.messages[channel]) ?? [];
}

export function useGetEarliestMessage(channel: ID | undefined) {
  const getEarliestMessage = useCallback(() => {
    if (!channel) return undefined;
    const messages = messageStore.getState().messages[channel] ?? [];
    return messages[0];
  }, [channel]);

  return getEarliestMessage;
}

export function usePreviousMessage(message: Message) {
  const messages = useChannelMessages(message.channel);
  const index = messages.findIndex((m) => m.id === message.id);
  return messages[index - 1];
}

export async function createMessage(content: string, channel: ID) {
  const message: Partial<Message> = {
    content,
  };

  const nonce = Math.random().toString(36).substring(7);

  messageStore.getState().addMessage({
    content,
    owner: userStore.getState().user?.id ?? "",
    channel,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    nonce,
  });

  const msg = await request<Message>(`/channels/${channel}/messages`, {
    method: "POST",
    body: message,
  });

  if (!msg) {
    return messageStore.getState().removeMessage(nonce, channel);
  }

  messageStore.getState().addMessage({
    ...msg,
    nonce,
  });
}
