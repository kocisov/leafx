import WebSocket from "isomorphic-ws";
import mitt from "mitt";

export function create(url: string) {
  const ws = new WebSocket(url);
  const emitter = mitt();

  ws.addEventListener("open", (event) => {
    emitter.emit("open", event);
  });

  ws.addEventListener("close", (event) => {
    emitter.emit("close", event);
  });

  ws.addEventListener("message", (event) => {
    emitter.emit("message", event.data);
  });

  ws.addEventListener("error", (event) => {
    emitter.emit("error", event);
  });

  return {
    on: emitter.on,
    off: emitter.off,
    clear: emitter.all.clear,
    close() {
      ws.close();
    },
    reconnect() {
      return create(url);
    },
    send<T>(data: T) {
      ws.send(typeof data === "string" ? data : JSON.stringify(data));
    },
  };
}
