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

type Events = {
  "bts:subscription_succeeded": {
    channel: string;
  };

  trade: {
    data: {
      price: number;
    };
  };

  open: any;
  message: {
    event: string;
  };
};

const leaf = create<Events>("wss://ws.bitstamp.net", {
  debug: true,
  matchTypeOn: "event",
  onOpen() {
    console.log("Opened connection");

    leaf.handleNotSent();

    setInterval(() => {
      leaf.send({ event: "bts:heartbeat" });
    }, 25_000);
  },
});

leaf.send({
  event: "bts:subscribe",
  data: {
    channel: "live_trades_btcusd",
  },
});

leaf.on("bts:subscription_succeeded", (data) => {
  console.log("Subscribed on", data.channel);
});

leaf.on("trade", (event) => {
  console.log("New trade @", event.data.price);
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
