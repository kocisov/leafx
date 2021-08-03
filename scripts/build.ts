import {build} from "esbuild";

const external = ["ws", "isomorphic-ws"];
const isProd = process.env.NODE_ENV === "production";

build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  platform: "node",
  outfile: "dist/index.cjs.js",
  external,
  minify: isProd,
});

build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  outfile: "dist/index.esm.js",
  format: "esm",
  target: ["esnext"],
  external,
  minify: isProd,
});
