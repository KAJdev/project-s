import { ChatBar } from "@/components/Theme/ChatBar";
import { Message as MessageComponent } from "@/components/Theme/Message";
import { request } from "@/lib/api";
import {
  Message,
  messageStore,
  useChannelMessages,
  useGetEarliestMessage,
} from "@/lib/messages";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useParams } from "react-router-dom";

export function ChannelLayout() {
  const { channelId } = useParams();
  const messages = useChannelMessages(channelId);
  const getEarliestMessage = useGetEarliestMessage(channelId);
  const heightsRef = useRef<{ [index: number]: number }>({});
  const parentRef = useRef<HTMLDivElement>(null);
  const noMore = useRef(false);
  const loading = useRef(false);

  const fetchMoreMessages = useCallback(async () => {
    if (loading.current || !channelId || noMore.current) return;

    const earliestMessage = getEarliestMessage();

    loading.current = true;
    const newMessages = await request<Message[]>(
      `/channels/${channelId}/messages`,
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
  }, [channelId, getEarliestMessage]);

  useEffect(() => {
    fetchMoreMessages();
  }, [fetchMoreMessages]);

  // The virtualizer
  // const virtualizer = useVirtualizer({
  //   count: messages.length,
  //   getScrollElement: () => parentRef.current,
  //   estimateSize: (index: number) => heightsRef.current[index] ?? 100,
  //   paddingEnd: 40,
  //   overscan: 10,
  //   paddingStart: 0,
  // });

  // const virtualItems = virtualizer.getVirtualItems();

  if (!channelId) {
    return null;
  }

  // const rows = virtualItems.map((virtualItem) => (
  //   <div
  //     key={virtualItem.key}
  //     style={{
  //       position: "absolute",
  //       top: 0,
  //       left: 0,
  //       width: "100%",
  //       height: `${virtualItem.size}px`,
  //       transform: `translateY(${virtualItem.start}px)`,
  //     }}
  //   >
  //     <div
  //       ref={(element: any) => {
  //         virtualizer.measureElement(element);
  //         if (element)
  //           heightsRef.current[virtualItem.index] =
  //             element.getBoundingClientRect().height;
  //       }}
  //       data-index={virtualItem.index}
  //     >
  //       <Message message={messages[virtualItem.index]} />
  //     </div>
  //   </div>
  // ));

  return (
    <div className="h-full w-full flex flex-col-reverse">
      <ChatBar channelId={channelId} />
      <div
        ref={parentRef}
        className="flex flex-col-reverse overflow-y-auto relative"
        onScroll={(e) => {
          const el = e.target as HTMLDivElement;
          const scrollTopMax = el.scrollHeight - el.clientHeight;
          // want to fetch more messages when the user scrolls close to the top of the element, but because its a reverse list, everything is negative
          if (el.scrollTop <= -scrollTopMax + 100) {
            console.log("fetching more messages");
            fetchMoreMessages();
          }
        }}
        // style={{
        //   height: `${virtualizer.getTotalSize()}px`,
        // }}
      >
        {/* {rows} */}

        {[...messages].reverse().map((message) => (
          <MessageComponent
            key={message.id ?? message.nonce}
            message={message}
          />
        ))}
      </div>
    </div>
  );
}
