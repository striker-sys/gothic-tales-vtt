/**
 * Leichter Laufzeittest ohne Foundry-Server. Die wichtigsten v0.8.0-Helfer
 * werden mit einer minimalen Foundry-v14-Umgebung geladen und geprüft.
 */
import assert from "node:assert/strict";

const hooks = {once: new Map(), on: new Map()};
globalThis.Hooks = {
  once(name, fn) { hooks.once.set(name, fn); },
  on(name, fn) { const list = hooks.on.get(name) ?? []; list.push(fn); hooks.on.set(name, list); }
};

function getProperty(obj, path) {
  return String(path).split(".").reduce((value, key) => value?.[key], obj);
}
function setProperty(obj, path, value) {
  const keys = String(path).split(".");
  let target = obj;
  for (const key of keys.slice(0, -1)) target = target[key] ??= {};
  target[keys.at(-1)] = value;
  return true;
}
function flattenObject(obj, prefix = "", out = {}) {
  for (const [key, value] of Object.entries(obj ?? {})) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) flattenObject(value, path, out);
    else out[path] = value;
  }
  return out;
}
class MockApplication {
  static get defaultOptions() { return {}; }
  constructor(...args) { this.options = args.at(-1) ?? {}; }
  render() { return this; }
}
class MockSheet extends MockApplication {
  constructor(document = {}, options = {}) {
    super(options);
    this.document = document;
    this.actor = document;
    this.item = document;
    this.isEditable = true;
  }
  getData() { return {actor: this.actor, item: this.item, system: this.document.system ?? {}, items: this.actor.items ?? []}; }
  activateListeners() {}
}
class MockCombatant {
  constructor(actor = null) { this.actor = actor; }
}
const collections = {unregisterSheet() {}, registerSheet() {}};

class MockField { constructor(options = {}) { Object.assign(this, options); } }
class MockSchemaField extends MockField { constructor(schema = {}) { super(); this.schema = schema; } }
class MockTypeDataModel { static defineSchema() { return {}; } prepareDerivedData() {} toObject() { return structuredClone(this); } }
const mockFields = {
  StringField: MockField,
  NumberField: MockField,
  BooleanField: MockField,
  HTMLField: MockField,
  ObjectField: MockField,
  SchemaField: MockSchemaField
};
class MockApplicationV2 extends MockApplication {}
const HandlebarsApplicationMixin = Base => class extends Base {};
class MockActorSheetV2 extends MockSheet {}
class MockItemSheetV2 extends MockSheet {}

class MockActor {}
class MockItem {}
globalThis.Actor = MockActor;
globalThis.Item = MockItem;

globalThis.foundry = {
  data: {fields: mockFields},
  abstract: {TypeDataModel: MockTypeDataModel},
  utils: {
    mergeObject: (a, b) => ({...(a ?? {}), ...(b ?? {})}),
    deepClone: value => structuredClone(value ?? {}),
    setProperty,
    getProperty,
    flattenObject,
    randomID: () => "test-request"
  },
  appv1: {
    sheets: {ActorSheet: MockSheet, ItemSheet: MockSheet},
    api: {FormApplication: MockApplication, Application: MockApplication}
  },
  applications: {
    api: {ApplicationV2: MockApplicationV2, HandlebarsApplicationMixin},
    sheets: {ActorSheetV2: MockActorSheetV2, ItemSheetV2: MockItemSheetV2},
    ux: {},
    apps: {DocumentSheetConfig: {unregisterSheet() {}, registerSheet() {}}},
    handlebars: {loadTemplates: async () => {}}
  },
  documents: {collections: {Actors: collections, Items: collections}}
};

globalThis.CONFIG = {
  Actor: {},
  Item: {},
  Combatant: {documentClass: MockCombatant},
  Combat: {initiative: {formula: null, decimals: 0}}
};
globalThis.CONST = {DOCUMENT_OWNERSHIP_LEVELS: {OWNER: 3}};
globalThis.Handlebars = {registerHelper() {}};
const registeredSettings = new Map();
const settingValues = new Map();
globalThis.game = {
  gothicTales: null,
  i18n: {localize: key => key, format: key => key},
  settings: {
    register(namespace, key, data) { registeredSettings.set(`${namespace}.${key}`, data); },
    get(namespace, key) { return settingValues.get(`${namespace}.${key}`) ?? registeredSettings.get(`${namespace}.${key}`)?.default ?? ""; },
    async set(namespace, key, value) { settingValues.set(`${namespace}.${key}`, value); return value; }
  },
  user: {id: "gm", isGM: true},
  users: [],
  actors: [],
  items: []
};
globalThis.canvas = {tokens: {controlled: []}};
globalThis.document = {
  addEventListener() {},
  querySelectorAll: () => [],
  createElement() {
    let text = "";
    let html = "";
    const escapeHtml = value => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
    return {
      set textContent(next) { text = String(next ?? ""); html = escapeHtml(text); },
      get textContent() { return text; },
      set innerText(next) { text = String(next ?? ""); html = escapeHtml(text); },
      get innerText() { return text; },
      set innerHTML(next) { html = String(next ?? ""); text = html.replace(/<[^>]*>/g, ""); },
      get innerHTML() { return html; }
    };
  },
  documentElement: {style: {setProperty() {}}, classList: {add() {}, remove() {}}},
  body: {classList: {add() {}, remove() {}}}
};
globalThis.HTMLElement = class {};
globalThis.ChatMessage = {getSpeaker: () => ({}), create: async data => data, getWhisperRecipients: () => []};
globalThis.Roll = class { constructor(formula) { this.formula = formula; this.dice = []; } async evaluate() { return this; } };
globalThis.ui = {notifications: {warn() {}, info() {}, error() {}}};

await import(new URL("../scripts/gothic-tales.mjs", import.meta.url));
assert.ok(hooks.once.has("init"), "init hook registered");
await hooks.once.get("init")();
const GT = game.gothicTales;
assert.equal(GT.SYSTEM_VERSION, "0.8.0");
assert.equal(registeredSettings.get("gothic-tales.actorSheetTheme")?.scope, "client");
assert.equal(GT.actorSheetTheme(), "light");
settingValues.set("gothic-tales.actorSheetTheme", "dark");
assert.equal(GT.actorSheetTheme(), "dark");

const attributes = {
  st: {value: 10}, ge: {value: 20}, ausd: {value: 10}, konz: {value: 30}, intu: {value: 20}, erf: {value: 20}
};
const character = GT.recalculateSystem({attributes, initiative: {value: 0, die: "w20", bonus: 99}}, "character");
assert.notEqual(character.initiative.die, "w20");
assert.equal(character.initiative.fixed, false);
assert.ok(!GT.initiativeFormula({system: character}).toLowerCase().includes("w20"));
assert.ok(GT.initiativeFormula({system: character}).startsWith(String(character.initiative.value)), "initiative formula includes base value");

const npc = GT.recalculateSystem({attributes, initiative: {value: 7, die: "", bonus: 7}}, "npc");
assert.equal(npc.initiative.value, 7);
assert.equal(npc.initiative.fixed, true);
const combatant = new CONFIG.Combatant.documentClass();
combatant.actor = {type: "npc", system: npc};
assert.equal(combatant._getInitiativeFormula(), "7");
combatant.actor = {type: "character", system: character};
assert.ok(!combatant._getInitiativeFormula().toLowerCase().includes("w20"));
assert.equal(GT.initiativeChoiceResult({system: character}, {method: "yield"}).total, character.initiative.bonus);

const originalRandom = Math.random;
Math.random = () => 0;
const advantage = GT.initiativeChoiceResult({system: {initiative: {value: 13, die: "w4", bonus: 1}}}, {mode: "advantage", level: 2});
Math.random = originalRandom;
assert.equal(advantage.formula, "13 + w4 + 1");
assert.equal(advantage.result.dice.some(d => d.advantageModifier && d.sides === 6 && d.sign === 1), true);

GT.manualDiceState = {2: 0, 4: 2, 6: 0, 8: 0, 10: 0, 12: 0, 20: 1};
GT.manualDiceBonus = -2;
assert.equal(GT.buildManualDiceFormula(), "2w4 + w20 - 2");
GT.removeManualDie(4);
assert.equal(GT.manualDiceState[4], 1);
const trayMarkup = GT.manualDiceTrayMarkup();
assert.ok(trayMarkup.includes("gt-dice-tray-v2"));
assert.ok(trayMarkup.includes("data-die=\"2\""));
assert.ok(trayMarkup.includes("gt-chat-modifier-control"));
assert.ok(trayMarkup.includes("gt-chat-roll-button"));
assert.ok(GT.magicCircleChatContent({name: "Held"}, {name: "Kreis I", circleText: "Kreis 1", diceText: "W4: 3", descriptionHtml: "<p>Test</p>"}).includes("W4: 3"));
assert.ok(GT.druidChatCard({title: "Tierform", body: "<p>Test</p>"}).includes("Tierform"));
const combatCard = GT.initiativeChatContent({name: "Held", system: {initiative: {value: 13, die: "w4", bonus: 1}}}, {method: "roll", mode: "normal", level: 0, formula: "13 + w4 + 1", total: 16});
assert.ok(combatCard.includes("gt-roll-card gt-combat-roll-card"));
assert.ok(combatCard.includes("gt-combat-card-total"));
assert.ok(combatCard.includes("13 + w4 + 1"));

console.log("Runtime smoke test passed.");
