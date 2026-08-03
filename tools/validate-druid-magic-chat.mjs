import fs from "node:fs";
import assert from "node:assert/strict";

const js = fs.readFileSync(new URL("../scripts/gothic-tales.mjs", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../styles/gothic-tales.css", import.meta.url), "utf8");

assert.match(js, /gt-magic-die-used-chat-card gt-magic-talent-chat-card/, "Magiekreis-Talente müssen die Magiewürfel-Kartenstruktur verwenden.");
assert.match(js, /GT\.revealDruidChatMessage/, "Druidenkarten benötigen die Vordergrund-/Scroll-Hilfe.");
assert.match(js, /onRoll: message => GT\.revealDruidChatMessage\(message\)/, "Druidenwürfe müssen ihre neue Chatkarte sichtbar machen.");
assert.match(js, /gt-druid-card-front/, "Druidenkarten im Actorbogen benötigen einen aktiven Vordergrundzustand.");
assert.match(css, /\.gothic-tales\.gt-magic-talent-chat-card/, "Magiekreis-Talentkarte benötigt eigenes Styling.");
assert.match(css, /\.gt-druid-spell-roll-card/, "Druiden-Würfelkarte benötigt eigenes Styling.");
assert.match(css, /gt-druid-message-front/, "Chatnachrichten benötigen einen Vordergrundzustand.");
console.log("Druidenkunst- und Magiekreis-Chatkarten validiert.");
