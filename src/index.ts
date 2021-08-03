import WebSocket, {CloseEvent, MessageEvent, OpenEvent} from "isomorphic-ws";
import mitt from "mitt";

const log = (...things: any[]) => console.log("[LEAF]", ...things);

export type Options = {
  debug?: boolean;
  onMessage?: <T>(event: T) => void;
  onClose?: (event: CloseEvent) => void;
  onOpen?: (event: OpenEvent) => void;
  on?: <T>(event: string, handler: (data: T) => void) => void;
  off?: <T>(event: string, handler: (data: T) => void) => void;
};

const getDataFromEvent = (event: MessageEvent, debug = false) => {
  try {
    return JSON.parse(event.data.toString());
  } catch (error) {
    if (debug) {
      console.error(error);
    }
    return {type: "unrecognized"};
  }
};

export const leaf = (url: string, options: Options = {}) => {
  const ws = new WebSocket(url);
  const notSent: string[] = [];
  const emitter = mitt();

  let isConnected = false;
  let messageCount = 0;

  ws.onopen = (event) => {
    isConnected = true;
    options.debug && log(`Connection opened.`);
    options.onOpen?.(event);
    emitter.emit("open", event);
  };

  ws.onclose = (event) => {
    isConnected = false;
    options.debug && log(`Connection closed.`);
    options.onClose?.(event);
    emitter.emit("close", event);
  };

  ws.onmessage = (event) => {
    const data = getDataFromEvent(event, options.debug);
    messageCount++;
    options.debug && log(`New message.`);
    options.onMessage?.(data);
    emitter.emit(data.type ? data.type : "message", data);
  };

  ws.onerror = (error) => {
    options.debug && log(`Error: ${error.message}.`);
  };

  return {
    raw: ws,
    isConnected: () => isConnected,
    messageCount: () => messageCount,
    close: () => ws.close(),
    on: emitter.on,
    off: emitter.off,
    handleNotSent: () => {
      while (notSent.length) {
        const data = notSent.shift();
        ws.send(data);
      }
    },
    send: <T>(data: T) => {
      const toSend = typeof data !== "string" ? JSON.stringify(data) : data;
      if (ws.readyState === 1) {
        ws.send(toSend);
      } else {
        notSent.push(toSend);
      }
    },
  };
};
