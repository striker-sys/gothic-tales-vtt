/**
 * Validierungsskript für npm run check. Es liest alle mitgelieferten
 * JSON-Datendateien ein und prüft, ob das Foundry-Manifest die Felder enthält,
 * die ein installierbares v14-Systempaket benötigt.
 */
import {readFile} from "node:fs/promises";

const files = [
  "system.json",
  "template.json",
  "lang/de.json",
  "data/gt-monsters.json",
  "data/gt-nscs.json",
  "data/gt-rulebook-sections.json",
  "data/gt-rumpelkammer-items.json",
  "data/gt-rumpelkammer-sections.json",
  "data/gt-scenes.json",
  "data/gt-sources.json",
  "data/gt-talent-tree-scaffold.json",
  "data/gt-talents.json"
];

for (const file of files) {
  JSON.parse(await readFile(file, "utf8"));
}

const manifest = JSON.parse(await readFile("system.json", "utf8"));
const required = ["id", "title", "version", "compatibility", "esmodules", "styles", "languages", "manifest", "download"];
const missing = required.filter(key => manifest[key] === undefined || manifest[key] === "");
if (missing.length) throw new Error(`Manifest missing required fields: ${missing.join(", ")}`);
if (manifest.compatibility?.minimum !== "14") throw new Error("Gothic Tales is expected to target Foundry VTT v14 minimum compatibility.");
console.log(`Validated ${files.length} JSON files and manifest metadata.`);
