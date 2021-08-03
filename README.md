# leafx

> WebSocket Client

## Installation

```bash
npm add leafx
# or
yarn add leafx
```

## Usage

```ts
import {leaf} from "leafx";

const ws = leaf("wss://echo.websocket.org", {
  // debug: true,
  onOpen: () => {
    console.log("WebSocket connected...");
  },
  onMessage: (data) => {
    console.log("New message:", data);
  },
});

ws.send({
  type: "test",
  numbers: [1, 2, 4, 8, 16],
});

ws.on("test", (data) => {
  console.log(data.numbers);
});

setTimeout(() => {
  ws.handleNotSent();
}, 5000);
```
