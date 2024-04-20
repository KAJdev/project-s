import { create } from "zustand";
import { Button } from "./Button";
import { Send } from "lucide-react";
import { createMessage } from "@/lib/messages";
import TextareaAutosize from "react-textarea-autosize";

const draftStore = create<{
  drafts: Map<ID, string>;
  setDraft: (channel: ID, draft: string) => void;
  clearDraft: (channel: ID) => void;
  clearDrafts: () => void;
}>((set) => ({
  drafts: new Map(),
  setDraft: (channel, draft) =>
    set((state) => ({
      drafts: state.drafts.set(channel, draft),
    })),
  clearDraft: (channel) =>
    set((state) => {
      state.drafts.delete(channel);
      return state;
    }),
  clearDrafts: () => set({ drafts: new Map() }),
}));

export function useChannelDraft(channel: ID | undefined) {
  if (!channel) {
    return ["", () => {}] as const;
  }
  return [
    draftStore((state) => state.drafts.get(channel) ?? ""),
    (draft: string) => draftStore.getState().setDraft(channel, draft),
  ] as const;
}

export function ChatBar({ channelId }: { channelId: ID }) {
  const [draft, setDraft] = useChannelDraft(channelId);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const send = useCallback(async () => {
    const message = draft.trim();
    if (!message) return;
    setDraft("");

    await createMessage(message, channelId);
  }, [draft, channelId, setDraft]);

  return (
    <div className="w-full px-8 pb-8">
      <div
        className="w-full bg-white/[3%] p-4 flex cursor-text"
        onClick={() => textAreaRef.current?.focus()}
      >
        <TextareaAutosize
          ref={textAreaRef}
          className="border-none w-full resize-none focus:outline-none bg-transparent"
          value={draft}
          maxLength={1000}
          autoFocus
          minRows={1}
          maxRows={5}
          placeholder="Type a message"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
              return;
            }
          }}
          onChange={(e) => {
            if (e.target.value.length > 1000) return;
            setDraft(e.target.value);
          }}
        />
        <Button
          variant="nobg"
          className="ml-2 cursor-pointer p-0"
          onClick={send}
          icon={<Send size={20} />}
        />
      </div>
    </div>
  );
}
