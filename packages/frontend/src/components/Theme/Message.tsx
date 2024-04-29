import { useUser } from "@/lib/users";
import { usePreviousMessage, type Message } from "@/lib/messages";
import { Avatar } from "./Avatar";
import { showUser } from "../Modals/User";
import { useSpecificPlayer } from "@/lib/scan";

/* eslint-disable @next/next/no-img-element */
export function Message({ message }: { message: Message }) {
  const player = useSpecificPlayer(message.author);
  const prev = usePreviousMessage(message);

  const doGrouping = useMemo(() => {
    if (!prev) return false;
    if (prev.author !== message.author) return false;
    if (
      new Date(message.created_at).getTime() -
        new Date(prev.created_at).getTime() >
      60000
    )
      return false;
    return true;
  }, [message, prev]);

  return (
    <div
      className={classes(
        "px-4 flex gap-2 w-full first:pb-4 hover:bg-black/10",
        message.id ? "opacity-100" : "opacity-50",
        doGrouping ? "" : "pt-4"
      )}
    >
      <div className="flex flex-col justify-between shrink">
        {!doGrouping && (
          <div className="flex gap-2 items-center">
            <p
              style={{
                color: player?.color,
              }}
            >
              {player?.name}
            </p>
            <p className="text-xs opacity-50 select-none">
              {new Date(message.created_at).toLocaleTimeString()}
            </p>
          </div>
        )}
        <div className="whitespace-pre-wrap text-sm">{message.content}</div>
      </div>
    </div>
  );
}
