import WebSocket from "isomorphic-ws";
import mitt from "mitt";
import { CloseEvent, ErrorEvent, Event, MessageEvent } from "ws";
import { j } from "./utils/j";

function log<T>(...things: T[]) {
  console.log("[LEAF]", ...things);
}

export type LeafOptions = {
  debug?: boolean;
  onMessage?: <T>(event: T) => void;
  onClose?: (event: CloseEvent) => void;
  onOpen?: (event: Event) => void;
  matchTypeOn: string;
};

type Events = {
  open?: Event;
  close?: CloseEvent;
  message: unknown;
  error?: ErrorEvent;
};

export function create<E extends Events = any>(url: string, options: LeafOptions = { matchTypeOn: "type" }) {
  const raw = new WebSocket(url);
  const notSent: string[] = [];
  const emitter = mitt<E>();

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

  raw.addEventListener("open", (event) => {
    isConnected = true;
    options.debug && log(`Connection opened.`);
    options.onOpen?.(event);
    emitter.emit("open", event);
  });

  raw.addEventListener("close", (event) => {
    isConnected = false;
    options.debug && log(`Connection closed.`);
    options.onClose?.(event);
    emitter.emit("close", event);
  });

  raw.addEventListener("message", (event) => {
    const data = getDataFromEvent(event, options.debug);
    messageCount++;
    options.debug && log(`New message.`);
    options.onMessage?.(data);
    if (data[options.matchTypeOn]) {
      emitter.emit(data[options.matchTypeOn], data);
    }
    emitter.emit("message", data);
  });

  raw.addEventListener("error", (event) => {
    options.debug && log(`Error: ${event.message}.`);
    emitter.emit("error", event);
  });

  return {
    raw,
    isConnected() {
      return isConnected;
    },
    messageCount() {
      return messageCount;
    },
    close() {
      raw.close();
    },
    on: emitter.on,
    off: emitter.off,
    clear: emitter.all.clear,
    handleNotSent() {
      while (notSent.length) {
        const data = notSent.shift();
        raw.send(data);
      }
    },
    send<T>(data: T) {
      if (raw.readyState === 1) {
        raw.send(j(data));
      } else {
        notSent.push(j(data));
      }
    },
  };
}
