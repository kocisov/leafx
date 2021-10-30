import WebSocket, { CloseEvent, Event, MessageEvent } from "isomorphic-ws";
import mitt from "mitt";

const log = <T>(...things: T[]) => console.log("[LEAF]", ...things);

export type LeafOptions = {
  debug?: boolean;
  onMessage?: <T>(event: T) => void;
  onClose?: (event: CloseEvent) => void;
  onOpen?: (event: Event) => void;
  matchTypeOn: string;
};

export const create = (url: string, options: LeafOptions = { matchTypeOn: "type" }) => {
  const raw = new WebSocket(url);
  const notSent: string[] = [];
  const emitter = mitt();

  const getDataFromEvent = (event: MessageEvent, debug = false) => {
    try {
      return JSON.parse(event.data.toString());
    } catch (error) {
      if (debug) {
        console.error(error);
      }
      return {
        [options.matchTypeOn]: "unrecognized",
      };
    }
  };

  let isConnected = false;
  let messageCount = 0;

  raw.onopen = (event) => {
    isConnected = true;
    options.debug && log(`Connection opened.`);
    options.onOpen?.(event);
    emitter.emit("open", event);
  };

  raw.onclose = (event) => {
    isConnected = false;
    options.debug && log(`Connection closed.`);
    options.onClose?.(event);
    emitter.emit("close", event);
  };

  raw.onmessage = (event) => {
    const data = getDataFromEvent(event, options.debug);
    messageCount++;
    options.debug && log(`New message.`);
    options.onMessage?.(data);
    if (data[options.matchTypeOn]) {
      emitter.emit(options.matchTypeOn, data);
    }
    emitter.emit("message", data);
  };

  raw.onerror = (event) => {
    options.debug && log(`Error: ${event.message}.`);
    emitter.emit("error", event);
  };

  return {
    raw,
    isConnected: () => isConnected,
    messageCount: () => messageCount,
    close: () => raw.close(),
    on: emitter.on,
    off: emitter.off,
    clear: emitter.all.clear,
    handleNotSent: () => {
      while (notSent.length) {
        const data = notSent.shift();
        raw.send(data);
      }
    },
    send: <T>(data: T) => {
      const toSend = typeof data !== "string" ? JSON.stringify(data) : data;
      if (raw.readyState === 1) {
        raw.send(toSend);
      } else {
        notSent.push(toSend);
      }
    },
  };
};
