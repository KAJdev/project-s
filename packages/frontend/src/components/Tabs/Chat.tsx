import {
  Message,
  getMessageChannel,
  messageStore,
  useChannelMessages,
  useGetEarliestMessage,
  useLastMessage,
} from "@/lib/messages";
import { Player, scanStore, usePlayer, useSpecificPlayer } from "@/lib/scan";
import { ChatBar } from "../Theme/ChatBar";
import { Message as MessageComponent } from "../Theme/Message";
import { request } from "@/lib/api";
import { Button } from "../Theme/Button";
import { ArrowLeft } from "lucide-react";

function ChatChannel({
  player,
  onClick,
}: {
  player: Player | null;
  onClick: () => void;
}) {
  const name = player?.name ?? "global";
  const self = usePlayer();
  const recipient = useSpecificPlayer(player?.id);

  const lastMessage = useLastMessage(
    getMessageChannel({
      author: self.id,
      recipient: player?.id ?? null,
    })
  );

  const color = recipient?.color ?? "#eeeeee";
  const opacity = 0.07;
  const opacityHex = Math.floor(opacity * 255).toString(16);

  return (
    <div
      className={classes(
        "flex flex-col gap-1 cursor-pointer duration-200 hover:duration-0 p-2 bg-white/10 hover:bg-white/20"
      )}
      onClick={onClick}
    >
      <div className="flex justify-between items-center">
        <h3
          className="text-lg truncate w-fit"
          style={{
            color,
            backgroundColor: `${color}${opacityHex}`,
          }}
        >
          {name}
        </h3>
        {lastMessage && (
          <p className="opacity-30 text-xs">
            {lastMessage?.created_at
              ? new Date(lastMessage.created_at).toLocaleTimeString()
              : "N/A"}
          </p>
        )}
      </div>
      <p className="text-xs opacity-50 truncate">
        {lastMessage?.content || "..."}
      </p>
    </div>
  );
}

function ChannelLayout({
  playerId,
  onBack,
}: {
  playerId: ID | null;
  onBack: () => void;
}) {
  const player = usePlayer();
  const recipient = useSpecificPlayer(playerId);
  const scan = scanStore((state) => state.scan);
  const channelId = getMessageChannel({
    author: player.id,
    recipient: playerId,
  });
  const messages = useChannelMessages(channelId);
  const getEarliestMessage = useGetEarliestMessage(channelId);
  const parentRef = useRef<HTMLDivElement>(null);
  const noMore = useRef(false);
  const loading = useRef(false);

  const fetchMoreMessages = useCallback(async () => {
    if (loading.current || !channelId || noMore.current || !scan?.game) return;

    const earliestMessage = getEarliestMessage();

    loading.current = true;
    const newMessages = await request<Message[]>(
      `/games/${scan.game}/messages/${channelId}`,
      {
        method: "GET",
        params: earliestMessage?.created_at
          ? { before: earliestMessage.created_at }
          : {},
      }
    );

    if (!newMessages || newMessages.length === 0) {
      noMore.current = true;
      return;
    }

    messageStore.getState().bulkAddContext(newMessages);

    loading.current = false;
  }, [channelId, getEarliestMessage, scan?.game]);

  useEffect(() => {
    fetchMoreMessages();
  }, [fetchMoreMessages]);

  if (!channelId) {
    return null;
  }

  return (
    <div className="h-full w-full flex flex-col-reverse max-h-[30rem] overflow-y-auto">
      <ChatBar channelId={playerId ?? "global"} />
      <div
        ref={parentRef}
        className="flex flex-col-reverse overflow-y-auto relative min-h-[20rem]"
        onScroll={(e) => {
          const el = e.target as HTMLDivElement;
          const scrollTopMax = el.scrollHeight - el.clientHeight;
          // want to fetch more messages when the user scrolls close to the top of the element, but because its a reverse list, everything is negative
          if (el.scrollTop <= -scrollTopMax + 100) {
            console.log("fetching more messages");
            fetchMoreMessages();
          }
        }}
      >
        {[...messages].reverse().map((message) => (
          <MessageComponent
            key={message.id ?? message.nonce}
            message={message}
          />
        ))}
      </div>
      <div className="w-full flex justify-between p-2 bg-white/[3%] items-center">
        <Button
          variant="transparent"
          icon={<ArrowLeft size={14} />}
          onClick={onBack}
        >
          Back
        </Button>

        <h2
          className="mr-2"
          style={{
            color: recipient?.color ?? "white",
          }}
        >
          {recipient?.name ?? "global"}
        </h2>
      </div>
    </div>
  );
}

export function Chat() {
  const scan = scanStore((state) => state.scan);
  const [player, setPlayer] = useState<ID | "global" | null>(null);

  if (player) {
    return <ChannelLayout playerId={player} onBack={() => setPlayer(null)} />;
  }

  return (
    <div className="flex flex-col gap-2 p-4 max-h-[30rem] overflow-y-auto">
      <ChatChannel player={null} onClick={() => setPlayer("global")} />
      {scan?.players.map((p, i) => (
        <>
          <ChatChannel key={p.id} player={p} onClick={() => setPlayer(p.id)} />
        </>
      ))}
    </div>
  );
}
