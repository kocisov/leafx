import type { Operation } from "fast-json-patch";
import patcher from "fast-json-patch";

export function comparePayloads(a: any, b: any) {
  return patcher.compare(a, b);
}

export function getPatchResult(on: any, patch: Operation[]) {
  const result = patcher.applyPatch(on, patch);
  return result.newDocument;
}
