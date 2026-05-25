import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const clientDir = resolve("dist/client");
const serverEntry = resolve("dist/server/index.js");
const siteUrl = process.env.SITE_URL || "https://plataformaleiloesagro.site/";

const serverModule = await import(pathToFileURL(serverEntry).href);
const server = serverModule.default ?? serverModule;

const handler =
  typeof server === "function"
    ? server
    : server.fetch?.bind(server) ?? serverModule.fetch?.bind(serverModule);

if (typeof handler !== "function") {
  throw new Error("Could not find a TanStack Start server handler in dist/server/index.js");
}

const context = {
  waitUntil() {},
  passThroughOnException() {},
};

const response = await handler(new Request(siteUrl), {}, context);

if (!response?.ok) {
  throw new Error(`Failed to render static index: ${response?.status} ${response?.statusText}`);
}

const html = await response.text();

await mkdir(clientDir, { recursive: true });
await writeFile(resolve(clientDir, "index.html"), html);

console.log("Generated dist/client/index.html");
