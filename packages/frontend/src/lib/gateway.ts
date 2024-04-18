import { Channel, channelStore } from "./channels";
import { Message, messageStore } from "./messages";
import { useToken } from "./token";
import { User, userStore } from "./users";
import useWebSocket, { ReadyState } from "react-use-websocket";

export enum GatewayOpcode {
  INVALID = 0,
  READY = 1,
  PING = 2,
  PONG = 3,
  MESSAGE_CREATE = 4,
  MESSAGE_UPDATE = 5,
  MESSAGE_DELETE = 6,
  CHANNEL_CREATE = 7,
  CHANNEL_UPDATE = 8,
  CHANNEL_DELETE = 9,
  USER_JOIN = 10,
  USER_LEAVE = 11,
  USER_UPDATE = 12,
  REQUEST_CHANNELS = 13,
}

const connectionStatus = {
  [ReadyState.CONNECTING]: "Connecting",
  [ReadyState.OPEN]: "Open",
  [ReadyState.CLOSING]: "Closing",
  [ReadyState.CLOSED]: "Closed",
  [ReadyState.UNINSTANTIATED]: "Uninstantiated",
};

export type GatewayMessage =
  | {
      op:
        | GatewayOpcode.INVALID
        | GatewayOpcode.READY
        | GatewayOpcode.PING
        | GatewayOpcode.PONG
        | GatewayOpcode.REQUEST_CHANNELS;
      d: unknown;
    }
  | {
      op: GatewayOpcode.MESSAGE_CREATE;
      d: Message;
    }
  | {
      op: GatewayOpcode.MESSAGE_DELETE;
      d: {
        id: string;
        channel: string;
      };
    }
  | {
      op: GatewayOpcode.MESSAGE_UPDATE;
      d: Message;
    }
  | {
      op: GatewayOpcode.CHANNEL_CREATE;
      d: Channel;
    }
  | {
      op: GatewayOpcode.CHANNEL_DELETE;
      d: {
        id: string;
      };
    }
  | {
      op: GatewayOpcode.CHANNEL_UPDATE;
      d: Channel;
    }
  | {
      op: GatewayOpcode.USER_JOIN;
      d: {
        channel: string;
        user: User;
      };
    }
  | {
      op: GatewayOpcode.USER_LEAVE;
      d: {
        channel: string;
        user: string;
      };
    }
  | {
      op: GatewayOpcode.USER_UPDATE;
      d: User;
    };

function prettyPrint(...args: any[]) {
  return console.log("[GATEWAY]", ...args);
}

export function useGateway() {
  const token = useToken();
  const [isReady, setIsReady] = useState(false);

  const { sendJsonMessage, lastMessage, readyState } = useWebSocket(
    `${
      process.env.NEXT_PUBLIC_GATEWAY_URL
    }/v1/gateway?token=${encodeURIComponent(token ?? "")}`,
    {
      shouldReconnect: (closeEvent) => true,
      reconnectAttempts: 10,
      reconnectInterval: (attemptNumber) => {
        const wait = Math.min(Math.pow(2, attemptNumber) * 1000, 10000);
        prettyPrint("Reconnecting in", wait, "ms");
        return wait;
      },
    }
  );

  useEffect(() => {
    if (lastMessage !== null) {
      let data: GatewayMessage;
      try {
        data = JSON.parse(lastMessage.data) as GatewayMessage;
      } catch (e) {
        prettyPrint("Failed to parse message:", lastMessage.data);
        return;
      }
      prettyPrint(data);

      switch (data.op) {
        case GatewayOpcode.READY: {
          prettyPrint("I'm ready senpai UwU");
          setIsReady(true);
          break;
        }
        case GatewayOpcode.MESSAGE_CREATE: {
          if (data.d.owner === userStore.getState().user?.id) {
            return;
          }

          messageStore.getState().addMessage(data.d);
          break;
        }
        case GatewayOpcode.MESSAGE_DELETE: {
          messageStore.getState().removeMessage(data.d.id, data.d.channel);
          break;
        }
        case GatewayOpcode.MESSAGE_UPDATE: {
          messageStore.getState().addMessage(data.d);
          break;
        }
        case GatewayOpcode.CHANNEL_CREATE: {
          channelStore.getState().addChannel(data.d);
          break;
        }
        case GatewayOpcode.CHANNEL_DELETE: {
          channelStore.getState().removeChannel(data.d.id);
          break;
        }
        case GatewayOpcode.CHANNEL_UPDATE: {
          channelStore.getState().addChannel(data.d);
          break;
        }
        default: {
          prettyPrint("Unhandled opcode:", data.op);
        }
      }
    }
  }, [lastMessage, sendJsonMessage]);

  useEffect(() => {
    prettyPrint("STATE:", connectionStatus[readyState]);

    if (readyState === ReadyState.OPEN) {
      sendJsonMessage({ op: GatewayOpcode.REQUEST_CHANNELS });
    } else {
      setIsReady(false);
    }
  }, [readyState, sendJsonMessage]);

  return isReady;
}
