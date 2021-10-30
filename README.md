# leafx [![NPM](https://badgen.net/npm/v/leafx)](https://www.npmjs.com/package/leafx)

> WebSocket Client & Utilities

## Installation

```bash
npm add leafx
# or
yarn add leafx
```

## Usage

### Base client

```ts
import { create } from "leafx";

const leaf = create("wss://echo.websocket.org", {
  // debug: true,
  onOpen() {
    console.log("WebSocket connected...");
  },
  onMessage(data) {
    console.log("New message:", data);
  },
});

leaf.send({
  type: "test",
  numbers: [1, 2, 4, 8, 16],
});

leaf.on("test", (data) => {
  console.log(data.numbers);
});

leaf.on("open", () => {
  leaf.handleNotSent();
});
```

### Server

```ts
import { lobby } from "leafx/server";
import { randomUUID } from "crypto";
import { Server } from "ws";
import type { WebSocket } from "ws";

interface ExtendedWebSocket extends WebSocket {
  id: string;
}

let message = 0;

const server = new Server({
  clientTracking: false,
  port: 3000,
});

server.on("connection", (ws: ExtendedWebSocket, req) => {
  ws.id = randomUUID();

  ws.on("message", (message) => {
    const data = message.toString();

    if (data === "subscribe") {
      const status = lobby.subscribe("testing", { id: ws.id, ws });
      ws.send(status ? "subscribed/testing" : "not subscribed");
    }

    if (data === "unsubscribe") {
      lobby.unsubscribe("testing", ws.id);
      ws.send("unsubscribed/testing");
    }
  });

  ws.on("close", () => {
    lobby.unsubscribe("testing", ws.id);
  });
});

setInterval(() => {
  lobby.broadcastToChannel("testing", message);
  message++;
}, 5000);
```
