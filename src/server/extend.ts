import { randomUUID } from "crypto";
import type { WebSocket } from "ws";
import { j } from "../utils/j";

export function extendSocket(socket: WebSocket) {
  return Object.assign(socket, {
    id: randomUUID(),
    commit<T>(data: T) {
      socket.send(j(data));
    },
  });
}
