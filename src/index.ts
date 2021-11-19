import WebSocket from "isomorphic-ws";
import mitt from "mitt";
import type { CloseEvent, ErrorEvent, Event, MessageEvent } from "ws";
import { j } from "./utils/j";

function log<T>(...things: T[]) {
  console.log("[LEAF]", ...things);
}

export type LeafOptions = {
  debug?: boolean;
  onMessage?: <T>(event: T) => void;
  onClose?: (event: CloseEvent) => void;
  onOpen?: (event: Event) => void;
  matchTypeOn?: string;
};

type DefaultEvents = {
  open?: Event;
  close?: CloseEvent;
  message: unknown;
  error?: ErrorEvent;
};

export function create<Events extends DefaultEvents = any>(url: string, options: LeafOptions) {
  const raw = new WebSocket(url);
  const notSent: string[] = [];
  const emitter = mitt<Events>();
  const matchTypeOn = options.matchTypeOn ?? "type";

  function getDataFromEvent(event: MessageEvent) {
    try {
      return JSON.parse(event.data.toString());
    } catch (error) {
      if (options.debug) {
        console.error(error);
      }
      return {
        [matchTypeOn]: "unrecognized",
      };
    }
  }

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
    const data = getDataFromEvent(event);
    messageCount++;
    options.debug && log(`New message.`);
    options.onMessage?.(data);
    if (data[matchTypeOn]) {
      emitter.emit(data[matchTypeOn], data);
    }
    emitter.emit("message", data);
  });

  raw.addEventListener("error", (event) => {
    options.debug && log(`Error: ${event.message}.`);
    emitter.emit("error", event);
  });

  return {
    raw,
    on: emitter.on,
    off: emitter.off,
    clear: emitter.all.clear,
    isConnected() {
      return isConnected;
    },
    messageCount() {
      return messageCount;
    },
    close() {
      raw.close();
    },
    handleNotSent() {
      while (notSent.length) {
        const data = notSent.shift();
        raw.send(data);
      }
    },
    send<T>(data: T) {
      const toSend = j(data);
      if (raw.readyState === 1) {
        raw.send(toSend);
      } else {
        notSent.push(toSend);
      }
    },
  };
}
