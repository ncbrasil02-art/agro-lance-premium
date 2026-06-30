#!/usr/bin/env node
/**
 * Roda Lighthouse contra a URL alvo e salva relatórios em ./lighthouse-reports/
 * Uso:
 *   node scripts/run-lighthouse.mjs                    # http://localhost:8080
 *   node scripts/run-lighthouse.mjs https://meusite    # custom
 *   LIGHTHOUSE_URL=... node scripts/run-lighthouse.mjs
 *
 * Dependências (instalar uma vez):
 *   bun add -d lighthouse chrome-launcher
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const URL = process.argv[2] || process.env.LIGHTHOUSE_URL || "http://localhost:8080";
const OUT = resolve("lighthouse-reports");
mkdirSync(OUT, { recursive: true });

const { default: lighthouse } = await import("lighthouse");
const chromeLauncher = await import("chrome-launcher");

const chrome = await chromeLauncher.launch({
  chromeFlags: ["--headless=new", "--no-sandbox", "--disable-gpu"],
});

try {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  for (const formFactor of ["mobile", "desktop"]) {
    console.log(`▶ Lighthouse (${formFactor}) → ${URL}`);
    const result = await lighthouse(
      URL,
      { port: chrome.port, output: ["html", "json"], logLevel: "error" },
      {
        extends: "lighthouse:default",
        settings: { formFactor, screenEmulation: { disabled: formFactor === "desktop" } },
      },
    );
    const base = `${OUT}/${stamp}-${formFactor}`;
    writeFileSync(`${base}.html`, result.report[0]);
    writeFileSync(`${base}.json`, result.report[1]);
    const c = result.lhr.categories;
    console.log(
      `  perf=${Math.round(c.performance.score * 100)} ` +
        `a11y=${Math.round(c.accessibility.score * 100)} ` +
        `bp=${Math.round(c["best-practices"].score * 100)} ` +
        `seo=${Math.round(c.seo.score * 100)}`,
    );
    console.log(`  → ${base}.html`);
  }
} finally {
  await chrome.kill();
}