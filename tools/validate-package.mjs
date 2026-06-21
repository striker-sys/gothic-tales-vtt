/**
 * Validierungsskript für npm run check. Es liest alle mitgelieferten
 * JSON-Datendateien ein und prüft, ob das Foundry-Manifest die Felder enthält,
 * die ein installierbares v14-Systempaket benötigt.
 */
import {access, readFile, readdir} from "node:fs/promises";

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

const iconFiles = [
  "assets/icons/allgemein.svg",
  "assets/icons/charakter.svg",
  "assets/icons/nsc.svg",
  "assets/icons/monster.svg",
  "assets/icons/waffe.svg",
  "assets/icons/ruestung.svg",
  "assets/icons/schild.svg",
  "assets/icons/zauber.svg",
  "assets/icons/talent.svg",
  "assets/icons/eigenschaft.svg",
  "assets/icons/ausruestung.svg",
  "assets/icons/verbrauchbar.svg"
];

for (const file of iconFiles) {
  await access(file);
}

async function findTemplates(dir) {
  const entries = await readdir(dir, {withFileTypes: true});
  const found = [];
  for (const entry of entries) {
    const path = `${dir}/${entry.name}`;
    if (entry.isDirectory()) found.push(...await findTemplates(path));
    else if (entry.isFile() && path.endsWith(".hbs")) found.push(path);
  }
  return found;
}

for (const file of await findTemplates("templates")) {
  const firstLine = (await readFile(file, "utf8")).split(/\r?\n/, 1)[0].trim();
  if (firstLine.startsWith("<!--")) throw new Error(`${file} beginnt mit einem gerenderten HTML-Kommentar. Nutze einen Handlebars-Kommentar, damit Foundry saubere Sheet-Wurzelelemente erhält.`);
}

const manifest = JSON.parse(await readFile("system.json", "utf8"));
const required = ["id", "title", "version", "compatibility", "esmodules", "styles", "languages", "manifest", "download"];
const missing = required.filter(key => manifest[key] === undefined || manifest[key] === "");
if (missing.length) throw new Error(`Manifest missing required fields: ${missing.join(", ")}`);
if (manifest.compatibility?.minimum !== "14") throw new Error("Gothic Tales is expected to target Foundry VTT v14 minimum compatibility.");
console.log(`Validated ${files.length} JSON files, ${iconFiles.length} icon files and manifest metadata.`);
