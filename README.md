# leafx [![NPM](https://badgen.net/npm/v/leafx)](https://www.npmjs.com/package/leafx)

> WebSocket Client

## Installation

```bash
npm add leafx
# or
yarn add leafx
```

## Usage

```ts
import { create } from "leafx";

const leaf = create("wss://echo.websocket.org", {
  // debug: true,
  onOpen: () => {
    console.log("WebSocket connected...");
  },
  onMessage: (data) => {
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

setTimeout(() => {
  leaf.handleNotSent();
}, 5000);
```
