import type { WebSocket } from "ws";

type Client = {
  id: string;
  ws: WebSocket;
};

function j<T>(data: T) {
  return typeof data === "string" ? data : JSON.stringify(data);
}

const channels = new Map<string, Map<string, WebSocket>>();

function subscribe(channel: string, client: Client) {
  const instance = channels.get(channel);
  if (instance) {
    if (instance.has(client.id)) {
      return false;
    }
    instance.set(client.id, client.ws);
  } else {
    const newMap = new Map();
    newMap.set(client.id, client.ws);
    channels.set(channel, newMap);
  }
  return true;
}

function unsubscribe(channel: string, id: string) {
  const instance = channels.get(channel);
  if (instance && instance.get(id)) {
    if (instance.size === 1) {
      channels.delete(channel);
    } else {
      instance.delete(id);
    }
  }
}

function broadcastToChannel<T>(channel: string, data: T) {
  channels.get(channel)?.forEach((client) => {
    client.send(j(data));
  });
}

function sendToSpecificSubscriber<T>(channel: string, id: string, data: T) {
  channels.get(channel)?.get(id)?.send(j(data));
}

export const lobby = {
  subscribe,
  unsubscribe,
  broadcastToChannel,
  sendToSpecificSubscriber,
};
