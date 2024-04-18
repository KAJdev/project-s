import { useUser } from "@/lib/users";
import { Message, usePreviousMessage } from "@/lib/messages";
import { Avatar } from "./Avatar";
import { showUser } from "../Modals/User";

/* eslint-disable @next/next/no-img-element */
export function Message({ message }: { message: Message }) {
  const user = useUser(message.owner);
  const prev = usePreviousMessage(message);

  const doGrouping = useMemo(() => {
    if (!prev) return false;
    if (prev.owner !== message.owner) return false;
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
        "px-8 flex gap-2 w-full first:pb-4 hover:bg-black/10",
        message.id ? "opacity-100" : "opacity-50",
        doGrouping ? "" : "pt-4"
      )}
    >
      {doGrouping ? (
        <div className="w-12 invisible" />
      ) : (
        <Avatar user={user} onClick={() => showUser(message.owner)} />
      )}
      <div className="flex flex-col justify-between shrink">
        {!doGrouping && (
          <div className="flex gap-2 items-center">
            <p
              className="hovber:underline cursor-pointer"
              onClick={() => showUser(message.owner)}
            >
              {user?.display_name || user?.username}
            </p>
            <p className="text-xs opacity-50 select-none">
              {new Date(message.created_at).toLocaleTimeString()}
            </p>
          </div>
        )}
        <div className="whitespace-pre-wrap">{message.content}</div>
      </div>
    </div>
  );
}
