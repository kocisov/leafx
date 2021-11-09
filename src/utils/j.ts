export function j<T>(data: T) {
  return typeof data === "string" ? data : JSON.stringify(data);
}
