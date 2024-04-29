/* eslint-disable @next/next/no-img-element */
import { create } from "zustand";
import { request } from "./api";
import { userStore } from "./users";
import { scanStore } from "./scan";

export type Message = {
  id?: ID;
  game: ID;
  author: ID;
  recipient: ID | null;
  content: string;
  created_at: string; // ISO 8601
  nonce?: string;
};

export function getMessageChannel({ author, recipient }: Partial<Message>) {
  // make recipient/author pairs but make it deterministic (so if A sends to B, it's the same as B sending to A)
  if (!recipient) {
    return "global";
  }

  if (author === recipient) {
    return author;
  }

  return [author, recipient].sort().join("-");
}

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
      const channel = getMessageChannel(message);
      const messages = state.messages[channel] ?? [];
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
          [channel]: filtered,
        },
      };
    }),
  bulkAddContext: (messages) =>
    set((state) => {
      const channel = getMessageChannel(messages[0]);
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
      if (!state.messages[channel]) return state;
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
  if (!channel) return [];
  return messageStore((state) => state.messages[channel] ?? []);
}

export function useGetEarliestMessage(channel: ID | undefined) {
  const getEarliestMessage = useCallback(() => {
    if (!channel) return undefined;
    const messages = messageStore.getState().messages[channel] ?? [];
    return messages[0];
  }, [channel]);

  return getEarliestMessage;
}

export function useLastMessage(channel: ID) {
  const messages = useChannelMessages(channel);
  return messages[messages.length - 1];
}

export function usePreviousMessage(message: Message) {
  const messages = useChannelMessages(getMessageChannel(message));
  const index = messages.findIndex((m) => m.id === message.id);
  return messages[index - 1];
}

export async function createMessage(recipient: ID | null, content: string) {
  const message: Partial<Message> = {
    content,
  };

  const nonce = Math.random().toString(36).substring(7);

  const user = userStore.getState().user;
  if (!user) return;

  const scan = scanStore.getState().scan;
  const player = scan?.players.find((p) => p.user === user.id);
  const game = scan?.game;
  if (!player || !game) return;

  messageStore.getState().addMessage({
    content,
    author: player.id,
    recipient,
    created_at: new Date().toISOString(),
    nonce,
    game,
  });

  const msg = await request<Message>(
    `/games/${game}/messages/${recipient || "global"}`,
    {
      method: "POST",
      body: message,
    }
  );

  if (!msg) {
    return messageStore
      .getState()
      .removeMessage(nonce, getMessageChannel(message));
  }

  messageStore.getState().addMessage({
    ...msg,
    nonce,
  });
}
