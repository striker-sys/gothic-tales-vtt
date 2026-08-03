import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const html = fs.readFileSync(new URL("./actor-layout-workshop.html", import.meta.url), "utf8");
const systemScript = fs.readFileSync(new URL("../scripts/gothic-tales.mjs", import.meta.url), "utf8");

assert.match(html, /Actorbogen-Baukasten/);
assert.match(html, /draggable="true"/);
assert.match(html, /addEventListener\("drop"/);
assert.match(html, /Tabellenlayout/);
assert.match(html, /columnEditor/);
assert.match(html, /layouts:\{character:/);
assert.match(html, /window:\{width:850,height:800\}/);
assert.match(html, /gothic-tales\.actor-layout-builder/);
assert.match(systemScript, /position:\s*\{width:\s*850,\s*height:\s*800\}/);

const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
assert.ok(scripts.length, "builder script found");
for (const script of scripts) new vm.Script(script, {filename: "actor-layout-workshop.inline.js"});

const requiredTypes = ["portrait", "identity", "defense", "initiative", "resources", "attributes", "skills", "equipment", "inventory", "spells", "attacks", "resistances", "abilities", "loot", "notes", "table", "panel"];
for (const type of requiredTypes) assert.match(html, new RegExp(`${type}: \\{title:`));

console.log("Actor layout builder validation passed (850x800, drag/drop, grids, tables, actor presets).");
