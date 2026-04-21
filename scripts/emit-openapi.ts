#!/usr/bin/env -S npx tsx
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { getOpenApiDocument } from "../src/lib/openapi";

const out = resolve(process.cwd(), "docs/openapi.json");
mkdirSync(dirname(out), { recursive: true });

const doc = getOpenApiDocument();
writeFileSync(out, JSON.stringify(doc, null, 2) + "\n", "utf8");

console.log(`Wrote ${out}`);
console.log(`  ${Object.keys(doc.paths ?? {}).length} paths`);
