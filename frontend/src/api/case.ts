/** snake_case <-> camelCase 변환은 이 파일에서만 한다. */

type Json = unknown;

const toCamel = (key: string) => key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
const toSnake = (key: string) => key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);

function convertKeys(value: Json, transform: (key: string) => string): Json {
  if (Array.isArray(value)) return value.map((item) => convertKeys(item, transform));
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, Json>).map(([key, val]) => [
        transform(key),
        convertKeys(val, transform),
      ]),
    );
  }
  return value;
}

export const camelizeKeys = (value: Json) => convertKeys(value, toCamel);
export const snakeizeKeys = (value: Json) => convertKeys(value, toSnake);
