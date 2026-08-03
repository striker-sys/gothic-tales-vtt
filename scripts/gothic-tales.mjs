/**
 * Gothic-Tales-System-Namespace. Alle Helfer, Konfigurationen, Bögen, Importeure
 * und UI-Anbindungen liegen hier gebündelt, damit Foundry sie während init über
 * game.gothicTales bereitstellen kann.
 */
const GT = {};
GT.SYSTEM_VERSION = "0.8.0";

// Foundry-Utility-Aliase halten den folgenden Code lesbar und bündeln Kompatibilitäts-Fallbacks.
const mergeObject = foundry.utils.mergeObject;
const deepClone = foundry.utils.deepClone ?? (obj => JSON.parse(JSON.stringify(obj ?? {})));
const setProperty = foundry.utils.setProperty;
const getProperty = foundry.utils.getProperty;
const flattenObject = foundry.utils.flattenObject;

GT.sheetTabState = new Map();
GT.sheetTabKey = document => document?.uuid || document?.id || document?.name || "unknown";


GT.SETTINGS_NAMESPACE = "gothic-tales";
GT.SETTING_DEFAULTS = {
  dmToolsSidebar: true,
  chatDiceTrayMode: "compact",
  actorSheetTheme: "light",
  alwaysRollDialog: true,
  autoInventory: true,
  materialConsumptionMode: "ask",
  professionLimitMode: "warn",
  rankAsSingleProfession: true,
  pickpocketGateMode: "cooldown",
  pickpocketSearchNumbers: 8,
  pickpocketCooldownSeconds: 2,
  herbalismCooldownMinutes: 30,
  miningCooldownMinutes: 30,
  bowWoodCooldownMinutes: 60,
  debugMode: false,
  druidLearningMode: "rites",
  druidCreateSpellItems: true
};

GT.setting = function(key) {
  const fallback = GT.SETTING_DEFAULTS?.[key];
  try {
    if (!globalThis.game?.settings) return fallback;
    const value = game.settings.get(GT.SETTINGS_NAMESPACE, key);
    return value ?? fallback;
  } catch (err) {
    return fallback;
  }
};

GT.actorSheetTheme = function() {
  const theme = String(GT.setting("actorSheetTheme") || "light");
  return theme === "dark" ? "dark" : "light";
};

GT.rerenderActorSheets = function() {
  const candidates = [
    ...Object.values(globalThis.ui?.windows ?? {}),
    ...Object.values(globalThis.foundry?.applications?.instances ?? {})
  ];
  const seen = new Set();
  for (const app of candidates) {
    if (!app || seen.has(app)) continue;
    seen.add(app);
    if (app instanceof GothicTalesActorSheet || app?.constructor?.name === "GothicTalesActorSheet") app.render?.(false);
  }
};

GT.debug = function(...args) {
  if (!GT.setting("debugMode")) return;
  console.debug("Gothic Tales |", ...args);
};

GT.cooldownMs = function(settingKey) {
  return Math.max(0, Number(GT.setting(settingKey) ?? 0)) * 60 * 1000;
};

GT.herbalismCooldownMs = () => GT.cooldownMs("herbalismCooldownMinutes");
GT.miningCooldownMs = () => GT.cooldownMs("miningCooldownMinutes");
GT.bowWoodCooldownMinutes = () => Math.max(0, Number(GT.setting("bowWoodCooldownMinutes") ?? 60));
GT.pickpocketGateMode = () => String(GT.setting("pickpocketGateMode") || "cooldown");
GT.pickpocketSearchNumberCount = () => Math.max(6, Math.min(12, Number(GT.setting("pickpocketSearchNumbers") ?? 8)));
GT.pickpocketCooldownMs = () => Math.max(0, Number(GT.setting("pickpocketCooldownSeconds") ?? 2)) * 1000;
GT.pickpocketCooldownSeconds = () => Math.max(0, Number(GT.setting("pickpocketCooldownSeconds") ?? 2));

GT.pickpocketSearchChallenge = function(total, count = GT.pickpocketSearchNumberCount()) {
  const target = Number(total || 0);
  const amount = Math.max(6, Math.min(12, Number(count || 8)));
  const values = new Set([target]);
  const spread = Math.max(12, amount * 3);
  let guard = 0;
  while (values.size < amount && guard < 500) {
    guard += 1;
    const candidate = Math.max(0, target + Math.floor(Math.random() * (spread * 2 + 1)) - spread);
    values.add(candidate);
  }
  while (values.size < amount) values.add(values.size + target + 1);
  const choices = Array.from(values);
  for (let i = choices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [choices[i], choices[j]] = [choices[j], choices[i]];
  }
  return {active: true, target, choices, wrong: 0};
};

GT.registerSystemSettings = function() {
  if (!game.settings) return;
  const ns = GT.SETTINGS_NAMESPACE;
  const register = (key, data) => game.settings.register(ns, key, {
    scope: "world",
    config: true,
    ...data
  });

  game.settings.register(ns, "actorSheetTheme", {
    name: "Gothic Tales | Actorbogen-Darstellung",
    hint: "Persönliche Darstellung für Charakter-, NSC- und Monsterbögen. Die Einstellung gilt nur für diesen Benutzer.",
    scope: "client",
    config: true,
    type: String,
    choices: {light: "Gerahmt & hell", dark: "Klassisch & dunkel"},
    default: GT.SETTING_DEFAULTS.actorSheetTheme,
    onChange: () => GT.rerenderActorSheets?.()
  });

  register("dmToolsSidebar", {
    name: "Gothic Tales | DM-Tools in Sidebar anzeigen",
    hint: "Blendet den Gothic-Tales-DM-Tools-Button in der rechten Foundry-Sidebar ein oder aus.",
    type: Boolean,
    default: GT.SETTING_DEFAULTS.dmToolsSidebar,
    onChange: value => {
      if (value) GT.injectProfessionToolsButton?.();
      else document.querySelector("#gt-dm-sidebar-tab")?.remove();
    }
  });

  register("chatDiceTrayMode", {
    name: "Gothic Tales | Chat-Würfeltabelle",
    hint: "Steuert die kleine GT-Würfeltabelle unter dem Chat.",
    type: String,
    choices: {compact: "Kompakt anzeigen", hidden: "Ausblenden"},
    default: GT.SETTING_DEFAULTS.chatDiceTrayMode,
    onChange: value => {
      document.querySelectorAll(".gt-chat-dice-tray").forEach(element => element.remove());
      if (value !== "hidden") setTimeout(() => GT.injectDiceTray?.(), 50);
    }
  });

  register("alwaysRollDialog", {
    name: "Gothic Tales | Würfeldialog immer öffnen",
    hint: "Wenn deaktiviert, werden normale Würfe direkt ausgeführt. Interne Mini-Spiel-Würfe können den Dialog weiterhin gezielt umgehen.",
    type: Boolean,
    default: GT.SETTING_DEFAULTS.alwaysRollDialog
  });

  register("autoInventory", {
    name: "Gothic Tales | Automatische Inventar-Erstellung",
    hint: "Wenn aktiv, legen Kräuterkunde, Schürfen, Alchemie, Schmiedekunst und Schnitzkunst Funde oder gefertigte Gegenstände automatisch ins Inventar.",
    type: Boolean,
    default: GT.SETTING_DEFAULTS.autoInventory
  });

  register("materialConsumptionMode", {
    name: "Gothic Tales | Automatischer Materialverbrauch",
    hint: "Vorbereitung für Crafting-Berufe. Aktuell wird vorsichtig gearbeitet; voller automatischer Verbrauch wird später gezielt pro Rezept erweitert.",
    type: String,
    choices: {off: "Aus", ask: "Nachfragen", auto: "Automatisch"},
    default: GT.SETTING_DEFAULTS.materialConsumptionMode
  });

  register("professionLimitMode", {
    name: "Gothic Tales | Mehr als 3 Berufe",
    hint: "Legt fest, ob die 3-Berufe-Grenze blockiert, mit Warnung bestätigt oder frei erlaubt wird.",
    type: String,
    choices: {block: "Blockieren", warn: "Warnen", allow: "Erlauben"},
    default: GT.SETTING_DEFAULTS.professionLimitMode
  });

  register("rankAsSingleProfession", {
    name: "Gothic Tales | Berufsränge als ein Beruf zählen",
    hint: "Wenn aktiv, zählen Ränge wie Kräuterkunde: geübt/gelehrt/gemeistert nur als ein Beruf für die 3-Berufe-Grenze.",
    type: Boolean,
    default: GT.SETTING_DEFAULTS.rankAsSingleProfession
  });

  register("pickpocketGateMode", {
    name: "Gothic Tales | Taschendiebstahl Zugreifen-Modus",
    hint: "Timer-Sperre nutzt die klassische Wartezeit. Ergebnis-Suche zeigt nach einem misslungenen Griff mehrere Zahlen; der Spieler muss sein Wurfergebnis finden.",
    type: String,
    choices: {cooldown: "Timer-Sperre", search: "Ergebnis-Suche"},
    default: GT.SETTING_DEFAULTS.pickpocketGateMode
  });

  register("pickpocketSearchNumbers", {
    name: "Gothic Tales | Taschendiebstahl Suchzahlen",
    hint: "Anzahl der Zahlen im Ergebnis-Suche-Modus. Eine Zahl ist das echte Wurfergebnis.",
    type: Number,
    range: {min: 6, max: 12, step: 1},
    default: GT.SETTING_DEFAULTS.pickpocketSearchNumbers
  });

  register("pickpocketCooldownSeconds", {
    name: "Gothic Tales | Taschendiebstahl Zugreifen-Sperre",
    hint: "Sekunden zwischen zwei Zugreifen-Würfen im Taschendiebstahl-Minispiel, wenn der Modus Timer-Sperre aktiv ist.",
    type: Number,
    default: GT.SETTING_DEFAULTS.pickpocketCooldownSeconds
  });

  register("herbalismCooldownMinutes", {
    name: "Gothic Tales | Kräuterkunde-Timer",
    hint: "Minuten bis zur nächsten Kräutersuche.",
    type: Number,
    default: GT.SETTING_DEFAULTS.herbalismCooldownMinutes
  });

  register("miningCooldownMinutes", {
    name: "Gothic Tales | Schürfen-Timer",
    hint: "Minuten bis zur nächsten Erzsuche.",
    type: Number,
    default: GT.SETTING_DEFAULTS.miningCooldownMinutes
  });

  register("bowWoodCooldownMinutes", {
    name: "Gothic Tales | Bogenholz-Suche Timer",
    hint: "Minuten bis zur nächsten Suche nach geeignetem Bogenholz.",
    type: Number,
    default: GT.SETTING_DEFAULTS.bowWoodCooldownMinutes
  });

  register("debugMode", {
    name: "Gothic Tales | Debug-Modus",
    hint: "Aktiviert zusätzliche Konsolenmeldungen für Entwicklung und Fehlersuche.",
    type: Boolean,
    default: GT.SETTING_DEFAULTS.debugMode
  });

  register("druidLearningMode", {
    name: "Gothic Tales | Druidenkunst Lernmodus",
    hint: "Riten erzwingen nutzt die Riten-Reihenfolge. Freie Auswahl erlaubt manuelles Lernen/Steigern von Druidenzaubern, besonders für NSC und Hausregeln.",
    type: String,
    choices: {rites: "Riten erzwingen", free: "Freie Auswahl erlauben"},
    default: GT.SETTING_DEFAULTS.druidLearningMode
  });

  register("druidCreateSpellItems", {
    name: "Gothic Tales | Druidenzauber als Items erzeugen",
    hint: "Wenn aktiv, werden gelernte Druidenzauber als echte Zauber-Items auf dem Actor angelegt oder aktualisiert.",
    type: Boolean,
    default: GT.SETTING_DEFAULTS.druidCreateSpellItems
  });
};

/**
 * Statische Beschriftungen und Typ-Zuordnungen für Bögen, Importeure und Templates.
 * Diese Konfiguration dient der Anzeige und ist keine persistierte Weltdatenstruktur.
 */
GT.CONFIG = {
  attributes: {
    st: "Stärke",
    ge: "Geschick",
    ausd: "Ausdauer",
    konz: "Konzentration",
    intu: "Intuition",
    erf: "Erfahrung"
  },
  skills: {
    durchhalten: "Durchhalten",
    objekteBewegen: "Objekte Bewegen",
    springenKlettern: "Springen & Klettern",
    gewandtheit: "Gewandtheit",
    heimlichkeit: "Heimlichkeit",
    ueberreden: "Überreden",
    einschuechtern: "Einschüchtern",
    betruegen: "Betrügen",
    menschenkenntnis: "Menschenkenntnis",
    wahrnehmen: "Wahrnehmen",
    erinnernErwaegenErforschen: "Erinnern, Erwägen & Erforschen",
    magiegespuer: "Magiegespür"
  },
  skillAttributes: {
    durchhalten: ["ausd", "konz"],
    objekteBewegen: ["st", "ausd"],
    springenKlettern: ["ge", "st"],
    gewandtheit: ["ge", "erf"],
    heimlichkeit: ["ge", "intu"],
    ueberreden: ["konz", "intu"],
    einschuechtern: ["konz", "st"],
    betruegen: ["ge", "intu"],
    menschenkenntnis: ["intu", "erf"],
    wahrnehmen: ["intu", "konz"],
    erinnernErwaegenErforschen: ["intu", "erf"],
    magiegespuer: ["konz", "erf"]
  },
  itemTypes: {
    weapon: "Waffen",
    shield: "Schilde",
    armor: "Rüstungen",
    spell: "Zauber",
    talent: "Talente",
    trait: "Stärken & Schwächen",
    equipment: "Kram",
    consumable: "Verbrauchbares"
  },
  actorTypes: {
    character: "Spielercharakter",
    npc: "NSC",
    monster: "Monster"
  },
  defaultActorImg: "systems/gothic-tales/assets/icons/allgemein.svg",
  defaultItemImg: "systems/gothic-tales/assets/icons/allgemein.svg",
  icons: {
    default: "systems/gothic-tales/assets/icons/allgemein.svg",
    actors: {
      character: "systems/gothic-tales/assets/icons/charakter.svg",
      npc: "systems/gothic-tales/assets/icons/nsc.svg",
      monster: "systems/gothic-tales/assets/icons/monster.svg"
    },
    items: {
      weapon: "systems/gothic-tales/assets/icons/waffe.svg",
      armor: "systems/gothic-tales/assets/icons/ruestung.svg",
      shield: "systems/gothic-tales/assets/icons/schild.svg",
      spell: "systems/gothic-tales/assets/icons/zauber.svg",
      talent: "systems/gothic-tales/assets/icons/talent.svg",
      trait: "systems/gothic-tales/assets/icons/eigenschaft.svg",
      equipment: "systems/gothic-tales/assets/icons/ausruestung.svg",
      consumable: "systems/gothic-tales/assets/icons/verbrauchbar.svg"
    }

  }
};

const dataFields = foundry.data.fields;

GT.dataField = {
  string: (initial = "") => new dataFields.StringField({required: true, blank: true, initial}),
  html: (initial = "") => new dataFields.HTMLField({required: true, blank: true, initial}),
  number: (initial = 0) => new dataFields.NumberField({required: true, nullable: false, initial}),
  boolean: (initial = false) => new dataFields.BooleanField({required: true, nullable: false, initial}),
  object: (initial = {}) => new dataFields.ObjectField({required: true, nullable: false, initial: () => deepClone(initial)})
};

GT.schema = {
  resource: (value = 0, max = 0) => new dataFields.SchemaField({
    value: GT.dataField.number(value),
    max: GT.dataField.number(max)
  }),
  valued: (value = 0) => new dataFields.SchemaField({
    value: GT.dataField.number(value)
  }),
  attribute: label => new dataFields.SchemaField({
    label: GT.dataField.string(label),
    value: GT.dataField.number(10),
    die: GT.dataField.string("w4"),
    bonus: GT.dataField.number(0)
  }),
  skill: label => new dataFields.SchemaField({
    label: GT.dataField.string(label),
    value: GT.dataField.number(10),
    die: GT.dataField.string("w4"),
    bonus: GT.dataField.number(0),
    grade: GT.dataField.number(0),
    gradeDie: GT.dataField.string(""),
    formula: GT.dataField.string("")
  }),
  defense: label => new dataFields.SchemaField({
    label: GT.dataField.string(label),
    value: GT.dataField.number(10),
    bonus: GT.dataField.number(0)
  })
};

/** Gemeinsames Foundry-TypeDataModel für Spielercharaktere, NSCs und Monster. */
class GothicTalesActorDataModel extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      playerName: GT.dataField.string(""),
      faction: GT.dataField.string(""),
      stufe: GT.dataField.number(1),
      lp: GT.schema.resource(10, 10),
      attributes: new dataFields.SchemaField(Object.fromEntries(Object.entries(GT.CONFIG.attributes).map(([key, label]) => [key, GT.schema.attribute(label)]))),
      skills: new dataFields.SchemaField(Object.fromEntries(Object.entries(GT.CONFIG.skills).map(([key, label]) => [key, GT.schema.skill(label)]))),
      defenses: new dataFields.SchemaField({
        rk: GT.schema.defense("RK"),
        ele: GT.schema.defense("Elemente"),
        ma: GT.schema.defense("Mentale Abwehr")
      }),
      hp: GT.schema.resource(36, 36),
      mana: GT.schema.resource(20, 20),
      initiative: new dataFields.SchemaField({
        value: GT.dataField.number(16),
        die: GT.dataField.string("w4"),
        bonus: GT.dataField.number(1),
        fixed: GT.dataField.boolean(false)
      }),
      movement: GT.schema.valued(5),
      exhaustion: GT.schema.resource(0, 6),
      deathCounter: GT.schema.resource(0, 6),
      actions: GT.dataField.number(2),
      biography: GT.dataField.html(""),
      notes: GT.dataField.html(""),
      strengthsWeaknesses: GT.dataField.html(""),
      inventoryText: GT.dataField.html(""),
      sourceText: GT.dataField.html(""),
      sourceImage: GT.dataField.string(""),
      sourceBook: GT.dataField.string(""),
      sourcePage: GT.dataField.string(""),
      armorBonus: new dataFields.SchemaField({
        rk: GT.dataField.number(0),
        ele: GT.dataField.number(0),
        ma: GT.dataField.number(0)
      }),
      talentTree: new dataFields.SchemaField({learned: GT.dataField.object({}), uses: GT.dataField.object({})}),
      magicCircles: new dataFields.SchemaField({learned: GT.dataField.object({}), uses: GT.dataField.object({}), dice: GT.dataField.object({})}),
      druidArts: new dataFields.SchemaField({learned: GT.dataField.object({}), uses: GT.dataField.object({})}),
      professions: new dataFields.SchemaField({learned: GT.dataField.object({}), uses: GT.dataField.object({})}),
      sheetLocked: GT.dataField.boolean(false)
    };
  }

  prepareDerivedData() {
    super.prepareDerivedData();
    if (!GT.recalculateSystem) return;
    const source = this.toObject ? this.toObject() : deepClone(this);
    const prepared = GT.recalculateSystem(source, this.parent?.type ?? "character");
    for (const [key, value] of Object.entries(prepared)) this[key] = value;
  }
}

class GothicTalesCharacterDataModel extends GothicTalesActorDataModel {}

class GothicTalesNPCDataModel extends GothicTalesActorDataModel {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      variant: GT.dataField.string(""),
      attributeTotal: GT.dataField.number(0)
    };
  }
}

class GothicTalesMonsterDataModel extends GothicTalesActorDataModel {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      monsterNumber: GT.dataField.number(0),
      monsterType: GT.dataField.string(""),
      monsterstufe: GT.dataField.string("0"),
      lootText: GT.dataField.html("")
    };
  }
}

class GothicTalesItemDataModel extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      description: GT.dataField.html(""),
      category: GT.dataField.string(""),
      folderCategory: GT.dataField.string(""),
      sourceText: GT.dataField.html(""),
      sourceImage: GT.dataField.string(""),
      sourceBook: GT.dataField.string(""),
      sourcePage: GT.dataField.string(""),
      quantity: GT.dataField.number(1),
      value: GT.dataField.string(""),
      properties: GT.dataField.string(""),
      requirements: GT.dataField.string(""),
      equipped: GT.dataField.boolean(false),
      favorite: GT.dataField.boolean(false)
    };
  }
}

class GothicTalesUsableItemDataModel extends GothicTalesItemDataModel {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      uses: GT.schema.resource(0, 0),
      cost: GT.dataField.string("")
    };
  }
}

class GothicTalesWeaponDataModel extends GothicTalesUsableItemDataModel {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      damage: GT.dataField.string(""),
      attribute: GT.dataField.string("st"),
      range: GT.dataField.string(""),
      targetDefense: GT.dataField.string("rk")
    };
  }
}

class GothicTalesShieldDataModel extends GothicTalesUsableItemDataModel {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      damage: GT.dataField.string(""),
      attribute: GT.dataField.string(""),
      targetDefense: GT.dataField.string("rk")
    };
  }
}

class GothicTalesArmorDataModel extends GothicTalesItemDataModel {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      rk: GT.dataField.number(0),
      ele: GT.dataField.number(0),
      ma: GT.dataField.number(0)
    };
  }
}

class GothicTalesSpellDataModel extends GothicTalesUsableItemDataModel {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      circle: GT.dataField.string(""),
      mana: GT.dataField.string(""),
      targetDefense: GT.dataField.string("ele"),
      damage: GT.dataField.string(""),
      attribute: GT.dataField.string("konz"),
      range: GT.dataField.string(""),
      spellTradition: GT.dataField.string("circle"),
      druidSchool: GT.dataField.string("")
    };
  }
}

class GothicTalesTalentDataModel extends GothicTalesUsableItemDataModel {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      lpCost: GT.dataField.number(0),
      actionType: GT.dataField.string(""),
      effect: GT.dataField.html(""),
      attributeRequirements: GT.dataField.object({}),
      treeId: GT.dataField.string(""),
      nodeId: GT.dataField.string(""),
      usesRecovery: GT.dataField.string("combatEnd"),
      usesPool: GT.dataField.string(""),
      usesPoolLabel: GT.dataField.string(""),
      consumeTalentKey: GT.dataField.string(""),
      consumePoolKey: GT.dataField.string(""),
      consumeAmount: GT.dataField.number(0)
    };
  }
}

class GothicTalesTraitDataModel extends GothicTalesItemDataModel {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      points: GT.dataField.number(0),
      kind: GT.dataField.string("")
    };
  }
}

class GothicTalesEquipmentDataModel extends GothicTalesItemDataModel {}

class GothicTalesConsumableDataModel extends GothicTalesUsableItemDataModel {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      effect: GT.dataField.html("")
    };
  }
}

/** Eigene Document-Klassen bündeln Gothic-Tales-spezifische Ableitungen und Methoden. */
class GothicTalesActor extends Actor {
  prepareDerivedData() {
    super.prepareDerivedData();
    if (!GT.recalculateSystem) return;
    const source = this.system?.toObject ? this.system.toObject() : this.system;
    const prepared = GT.recalculateSystem(source, this.type, {equippedArmorBonus: GT.equippedArmorBonusFromItems?.(this.items)});
    Object.assign(this.system, prepared);
  }
}

class GothicTalesItem extends Item {
  get isEquipped() {
    return !!this.system?.equipped;
  }
}

GT.DataModels = {
  Actor: {
    character: GothicTalesCharacterDataModel,
    npc: GothicTalesNPCDataModel,
    monster: GothicTalesMonsterDataModel
  },
  Item: {
    weapon: GothicTalesWeaponDataModel,
    shield: GothicTalesShieldDataModel,
    armor: GothicTalesArmorDataModel,
    spell: GothicTalesSpellDataModel,
    talent: GothicTalesTalentDataModel,
    trait: GothicTalesTraitDataModel,
    equipment: GothicTalesEquipmentDataModel,
    consumable: GothicTalesConsumableDataModel
  },
  Documents: {
    Actor: GothicTalesActor,
    Item: GothicTalesItem
  }
};

/** Löst einen Lokalisierungsschlüssel auf und behält einen Fallback für frühe Initialisierung oder fehlende Texte. */
GT.localize = function(key, fallback = key) {
  return game?.i18n?.localize?.(key) || fallback;
};

GT.format = function(key, data = {}, fallback = key) {
  return game?.i18n?.format?.(key, data) || fallback;
};

/** Stufentabelle für Lernpunkte und Start-Erz, die in der Charaktererstellung angezeigt wird. */
GT.LEVEL_RESOURCES = {
  1: {lp: 10, erz: 0}, 2: {lp: 20, erz: 50}, 3: {lp: 30, erz: 130}, 4: {lp: 40, erz: 210},
  5: {lp: 50, erz: 300}, 6: {lp: 60, erz: 400}, 7: {lp: 70, erz: 500}, 8: {lp: 80, erz: 600},
  9: {lp: 90, erz: 700}, 10: {lp: 100, erz: 800}, 11: {lp: 110, erz: 940}, 12: {lp: 120, erz: 1080},
  13: {lp: 130, erz: 1220}, 14: {lp: 140, erz: 1360}, 15: {lp: 150, erz: 1500}, 16: {lp: 160, erz: 1700},
  17: {lp: 170, erz: 1900}, 18: {lp: 180, erz: 2100}, 19: {lp: 190, erz: 2300}, 20: {lp: 200, erz: 2500},
  21: {lp: 210, erz: 2800}, 22: {lp: 220, erz: 3100}, 23: {lp: 230, erz: 3400}, 24: {lp: 240, erz: 3700},
  25: {lp: 250, erz: 4000}, 26: {lp: 260, erz: 4400}, 27: {lp: 270, erz: 4800}
};

/** Vordefinierte Startpakete, die der Charakterassistent für neue Figuren verwendet. */
GT.START_PACKAGES = [
  {id: "anwaerter", label: "Der Anwärter", summary: "Kampfstab, Spruchrollen, Manatränke, Rationen & Wasser", items: [
    ["Kampfstab", 1], ["Feuerpfeil", 5, "scroll"], ["Eissplitter", 5, "scroll"], ["Geysir", 3, "scroll"], ["Kleine Heilung", 3, "scroll"], ["Kleiner Manatrank", 3], ["Ration / Nahrung", 3], ["Wasserschlauch", 1, "custom-water-full"]
  ]},
  {id: "dieb", label: "Der Dieb", summary: "Wolfsmesser, Kurzbogen, Pfeile, Dietriche, Fackeln", items: [
    ["Wolfsmesser", 1], ["Kurzbogen", 1], ["Pfeile", 15], ["Dietrich", 3], ["Fackel", 3]
  ]},
  {id: "abwartende", label: "Der Abwartende", summary: "Knüppel, Arbeiterkluft, Licht-Spruchrollen, Erz, Rationen & Wasser", items: [
    ["Knüppel", 1], ["Arbeiterkluft", 1], ["Licht", 2, "scroll"], ["Erz", 30], ["Ration / Nahrung", 3], ["Wasserschlauch", 1, "custom-water-full"]
  ]},
  {id: "haudrauf", label: "Der Haudrauf", summary: "Spitzhacke, Buddlerhosen, Heiltränke, Rationen & Wasser", items: [
    ["Spitzhacke", 1], ["Grobe Buddlerhosen", 1], ["Kleiner Heiltrank", 2], ["Ration / Nahrung", 3], ["Wasserschlauch", 1, "custom-water-full"]
  ]},
  {id: "jaeger", label: "Der Jäger", summary: "Kurzbogen, Pfeile, Dolch, Fackeln, Dietrich, Rationen & Wasser", items: [
    ["Kurzbogen", 1], ["Pfeile", 45], ["Dolch", 1], ["Fackel", 3], ["Dietrich", 1], ["Ration / Nahrung", 3], ["Wasserschlauch", 1, "custom-water-full"]
  ]},
  {id: "alleskoenner", label: "Der Alleskönner", summary: "Knüppel, Wagenrad, Blitz-Spruchrollen, Seil, Dietrich, Arbeiterkluft", items: [
    ["Knüppel", 1], ["Wagenrad", 1], ["Blitz", 4, "scroll"], ["Seil", 1], ["Dietrich", 1], ["Arbeiterkluft", 1]
  ]}
];

/** NSC-Generator-Vorlagen, die Attribute und Standardausrüstung je nach Archetyp gewichten. */
GT.NPC_ARCHETYPES = {
  arbeiter: {label: "Arbeiter/Buddler", focus: {st: 2, ausd: 2, erf: 1}, weapon: "Spitzhacke", armor: "Buddlerkluft"},
  kaempfer: {label: "Kämpfer/Wache", focus: {st: 3, ausd: 2, ge: 1}, weapon: "Grobes Schwert", armor: "Leichte Lederrüstung"},
  schurke: {label: "Schurke/Bandit", focus: {ge: 3, intu: 2, erf: 1}, weapon: "Wolfsmesser", armor: "Leichte Lederrüstung"},
  jaeger: {label: "Jäger", focus: {ge: 3, intu: 2, erf: 1}, weapon: "Jagdbogen", armor: "Reisekleidung"},
  magier: {label: "Magier", focus: {konz: 3, erf: 2, intu: 1}, weapon: "Feuerpfeil", armor: "Novizenrobe (Wasser)"},
  ork: {label: "Ork", focus: {st: 4, ausd: 3}, weapon: "Grober Nagelknüppel", armor: "Kette & Leder"}
};

/** Prüft, ob ein Dokumentbild bereits sinnvoll gesetzt ist oder noch durch ein GT-Icon ersetzt werden darf. */
GT.isPlaceholderImage = function(img) {
  const value = String(img || "").trim();
  if (!value) return true;
  return ["icons/svg/mystery-man.svg", "icons/svg/item-bag.svg", GT.CONFIG.icons.default].includes(value);
};

/** Liefert ein Actor-Bild anhand des Actor-Typs oder ein allgemeines Fallback-Icon. */
GT.actorImage = function(type = "character", name = "") {
  return GT.CONFIG.icons.actors[type] || GT.CONFIG.icons.default;
};

/** Liefert ein Item-Bild anhand von Typ, Name oder Kategorie und fällt auf allgemein.svg zurück. */
GT.itemImage = function(type = "equipment", name = "", category = "") {
  const haystack = `${name} ${category}`.toLowerCase();
  if (/schild/i.test(haystack)) return GT.CONFIG.icons.items.shield;
  if (/rüstung|ruestung|robe|kluft|panzer|kleidung/i.test(haystack)) return GT.CONFIG.icons.items.armor;
  if (/trank|ration|nahrung|wasser|fleisch|beute/i.test(haystack)) return GT.CONFIG.icons.items.consumable;
  if (/zauber|spruchrolle|magie|feuer|eis|blitz|heilung/i.test(haystack)) return GT.CONFIG.icons.items.spell;
  if (/bogen|pfeil|bolzen|schwert|messer|dolch|stab|axt|armbrust|keule|knüppel|knueppel|speer/i.test(haystack)) return GT.CONFIG.icons.items.weapon;
  return GT.CONFIG.icons.items[type] || GT.CONFIG.icons.default;
};

/** Öffnet Foundrys Dateibrowser, damit Bilder hochgeladen oder vorhandene Bildquellen gewählt werden können. */
GT.openImagePicker = function(document, path = "img") {
  if (!document?.isOwner) return ui.notifications.warn("Du hast keine Berechtigung zum Bearbeiten des Bildes.");
  const current = path === "img" ? document.img : getProperty(document, path);
  const FilePickerClass = foundry?.applications?.apps?.FilePicker?.implementation ?? foundry?.applications?.apps?.FilePicker;
  if (!FilePickerClass) return ui.notifications.error("Gothic Tales: Foundrys Dateibrowser konnte nicht gefunden werden.");
  new FilePickerClass({
    type: "image",
    current: current || GT.CONFIG.icons.default,
    callback: selected => document.update({[path]: selected || GT.CONFIG.icons.default})
  }).browse(current || GT.CONFIG.icons.default);
};

/** Öffnet den Dateibrowser für Avatarfelder in Assistenten, bevor ein Actor existiert. */
GT.openAvatarPickerForForm = function(button, fallback = GT.CONFIG.icons.default) {
  const root = button?.closest?.("form") ?? document;
  const input = root.querySelector?.('input[name="img"]');
  const preview = root.querySelector?.(".gt-avatar-preview");
  const current = input?.value || preview?.getAttribute?.("src") || fallback;
  const FilePickerClass = foundry?.applications?.apps?.FilePicker?.implementation ?? foundry?.applications?.apps?.FilePicker;
  if (!FilePickerClass) return ui.notifications.error("Gothic Tales: Foundrys Dateibrowser konnte nicht gefunden werden.");
  new FilePickerClass({
    type: "image",
    current,
    callback: selected => {
      const value = selected || fallback;
      if (input) input.value = value;
      if (preview) preview.src = value;
    }
  }).browse(current);
};

/** Maskiert Klartext, bevor er in manuell erzeugte HTML-Fragmente eingefügt wird. */
GT.escape = function(value) {
  const div = document.createElement("div");
  div.innerText = value ?? "";
  return div.innerHTML;
};

/** Entfernt HTML-Tags, wenn Import- oder Quellentext als Klartext verglichen werden muss. */
GT.stripHtml = function(value) {
  const div = document.createElement("div");
  div.innerHTML = value ?? "";
  return (div.textContent || div.innerText || "").trim();
};

/** Normalisiert importierten PDF-/OCR-Text, indem Trennzeichen, Ersatzglyphen und überzählige Leerzeichen entfernt werden. */
GT.cleanText = function(value) {
  return String(value ?? "")
    .replace(/\u00ad/g, "")
    .replace(/\u00a0/g, " ")
    .replace(/[\uFFFC\uFFFD]/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};

/** Wandelt Klartextabsätze in einfaches, sicheres HTML für Bogenvorschauen und Journalseiten um. */
GT.textToHtml = function(text) {
  const clean = GT.cleanText(text);
  if (!clean) return "";
  return clean.split(/\n{2,}/).map(p => `<p>${GT.escape(p).replace(/\n/g, "<br>")}</p>`).join("");
};


/** Wandelt gespeichertes HTML für den einfachen Beschreibungseditor zurück in bearbeitbaren Klartext. */
GT.htmlToPlainText = function(value) {
  const html = String(value ?? "");
  if (!html) return "";
  const div = document.createElement("div");
  div.innerHTML = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/li>/gi, "\n");
  return GT.cleanText(div.textContent || div.innerText || "");
};

/** Akzeptiert entweder HTML oder Klartext und gibt normalisiertes HTML für htmlFields zurück. */
GT.normalizeHtml = function(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  if (/<[a-z][\s\S]*>/i.test(raw)) return raw;
  return GT.textToHtml(raw);
};

/** Löst kurze Attributschlüssel wie st/ge in ihre deutschen Beschriftungen auf. */
GT.attributeLabel = function(key) {
  const normalized = String(key ?? "").toLowerCase().trim();
  return GT.CONFIG.attributes[normalized] || key || "";
};

/** Erzeugt kompakte Gegenstandshilfen aus Importdaten, damit Kompendiumseinträge ohne Nachbearbeitung nutzbar sind. */
GT.formatItemDescription = function(entry = {}) {
  const type = entry.type || "equipment";
  const intro = entry.description && /<li|<p|<ul|<article/i.test(entry.description)
    ? GT.htmlToPlainText(entry.description).split(/\n+/)[0]
    : "";
  const lines = [];
  const add = (label, value) => {
    const v = GT.cleanText(value);
    if (v !== "" && v !== "0") lines.push(`<li><strong>${GT.escape(label)}:</strong> ${GT.escape(v)}</li>`);
  };
  let title = intro;
  if (!title) {
    if (type === "weapon") title = "Waffe aus der Rumpelkammer.";
    else if (type === "spell") title = "Zauber aus der Rumpelkammer.";
    else if (type === "armor") title = "Rüstung aus der Rumpelkammer.";
    else if (type === "shield") title = "Schild aus der Rumpelkammer.";
    else if (type === "trait") title = "Stärke oder Schwäche für die Charaktererstellung.";
    else title = "Gegenstand aus der Rumpelkammer.";
  }
  if (entry.quantity && Number(entry.quantity) !== 1) add("Anzahl", entry.quantity);
  if (entry.damage) add(type === "spell" ? "Wirkung/Schaden" : "Schaden", entry.damage);
  if (entry.attribute) add("Attribut", GT.attributeLabel(entry.attribute));
  if (entry.targetDefense) add("Ziel-Verteidigung", String(entry.targetDefense).toUpperCase());
  if (entry.properties) add("Eigenschaften", entry.properties);
  if (entry.requirements && !/^n$/i.test(String(entry.requirements).trim())) add("Voraussetzungen", entry.requirements);
  if (entry.range) add("Reichweite", entry.range);
  if (entry.mana) add("Mana", entry.mana);
  if (entry.circle) add("Kreis", entry.circle);
  if (entry.rk) add("RK", entry.rk);
  if (entry.ele) add("ELE", entry.ele);
  if (entry.ma) add("MA", entry.ma);
  if (entry.kind) add("Art", entry.kind);
  if (entry.points) add("Punkte", entry.points);
  if (entry.value) add("Handelswert", entry.value);
  const html = [`<p>${GT.escape(title)}</p>`];
  if (lines.length) html.push(`<ul>${lines.join("")}</ul>`);
  const oldText = entry.text || "";
  const cleanOld = GT.cleanImportedPlainText(oldText);
  if (cleanOld && !GT.htmlToPlainText(html.join("")).includes(cleanOld.slice(0, 60))) html.push(GT.textToHtml(cleanOld));
  return html.join("");
};

/** Bereinigt importierte Talentbeschriftungen, damit Talentknoten kurze Namen anzeigen. */
GT.talentDisplayLabel = function(node) {
  const raw = String(node?.label ?? node?.name ?? "Talent").trim();
  return raw
    .replace(/\s+gehört zum Talentbaum[\s\S]*$/i, "")
    .replace(/\s+Kosten:\s*[\s\S]*$/i, "")
    .replace(/\s+Voraussetzung:\s*[\s\S]*$/i, "")
    .trim() || "Talent";
};

/** Normalisiert optionale Attribut-Mindestwerte an Talentknoten. Unterstützt Objekte, Listen und kurze Textangaben. */
GT.talentAttributeRequirements = function(node = {}) {
  const raw = node.attributeRequirements ?? node.attributeRequires ?? node.requiresAttributes ?? {};
  const out = {};
  const add = (key, value) => {
    const normalized = String(key ?? "").toLowerCase().trim();
    if (!GT.CONFIG.attributes[normalized]) return;
    const min = Number(value ?? 0);
    if (Number.isFinite(min) && min > 0) out[normalized] = Math.floor(min);
  };
  if (Array.isArray(raw)) {
    for (const entry of raw) add(entry.attribute ?? entry.key ?? entry.id ?? entry.name, entry.min ?? entry.value ?? entry.required);
  } else if (typeof raw === "string") {
    for (const part of raw.split(/[,;|]/)) {
      const match = part.trim().match(/^([a-zäöüß]+)\s*[:=]?\s*(\d+)$/i);
      if (match) add(match[1], match[2]);
    }
  } else if (raw && typeof raw === "object") {
    for (const [key, value] of Object.entries(raw)) add(key, value);
  }
  return out;
};

/** Formatiert Mindestattribute für Tooltips, Kompendien und Warnungen. */
GT.talentAttributeRequirementText = function(node = {}, actor = null) {
  const requirements = GT.talentAttributeRequirements(node);
  const parts = [];
  for (const [key, min] of Object.entries(requirements)) {
    const label = GT.attributeLabel(key) || key;
    if (actor) {
      const current = Number(actor.system?.attributes?.[key]?.value ?? 0);
      parts.push(`${label} ${current}/${min}`);
    } else parts.push(`${label} ${min}`);
  }
  return parts.join(", ");
};

/** Prüft Attribut-Mindestwerte. Für NSC/Monster wird diese Voraussetzung bewusst ignoriert. */
GT.actorMeetsTalentAttributeRequirements = function(actor, node = {}) {
  if (actor?.type !== "character") return {met: true, missing: []};
  const requirements = GT.talentAttributeRequirements(node);
  const missing = [];
  for (const [key, min] of Object.entries(requirements)) {
    const current = Number(actor.system?.attributes?.[key]?.value ?? 0);
    if (current < min) missing.push({key, label: GT.attributeLabel(key), min, current});
  }
  return {met: missing.length === 0, missing};
};

/** Normalisiert optionale Anwendungen von Talenten. max 0 bedeutet: keine Verbrauchsanzeige. */
GT.talentUsesConfig = function(node = {}) {
  const raw = node.uses ?? node.applications ?? node.charges ?? {};
  const max = Number(raw?.max ?? raw?.maximum ?? node.maxUses ?? node.usesMax ?? node.uses?.max ?? 0);
  const recovery = String(raw?.recovery ?? raw?.recover ?? node.usesRecovery ?? "combatEnd").trim() || "combatEnd";
  const pool = String(raw?.pool ?? raw?.poolKey ?? node.usesPool ?? "").trim();
  const poolLabel = String(raw?.poolLabel ?? raw?.label ?? node.usesPoolLabel ?? "").trim();
  return {max: Number.isFinite(max) && max > 0 ? Math.floor(max) : 0, recovery, pool, poolLabel};
};

/** Normalisiert den Verbrauch eines anderen Talents. Leer bedeutet: Talent verbraucht eigene Anwendungen. */
GT.talentConsumeConfig = function(node = {}, defaultTreeId = "") {
  const raw = node.consumes ?? node.consume ?? {};
  let treeId = "", nodeId = "", amount = 0, pool = "";
  if (typeof raw === "string") {
    const clean = raw.trim();
    if (!clean.includes(".") && !clean.includes(":")) pool = clean;
    else {
      const [tree, talent] = clean.split(/[.:/]/).map(p => String(p || "").trim()).filter(Boolean);
      treeId = tree || "";
      nodeId = talent || "";
    }
    amount = 1;
  } else if (raw && typeof raw === "object") {
    pool = String(raw.pool ?? raw.poolKey ?? raw.usePool ?? node.consumePoolKey ?? "").trim();
    const key = String(raw.key ?? raw.talent ?? raw.id ?? raw.node ?? node.consumeTalentKey ?? "").trim();
    if (key.includes(".") || key.includes(":")) {
      const [tree, talent] = key.split(/[.:]/).map(p => String(p || "").trim()).filter(Boolean);
      treeId = tree || String(raw.treeId ?? raw.tree ?? defaultTreeId ?? "");
      nodeId = talent || "";
    } else if (key && !pool) {
      treeId = String(raw.treeId ?? raw.tree ?? defaultTreeId ?? "").trim();
      nodeId = String(raw.nodeId ?? raw.node ?? key ?? "").trim();
    } else {
      treeId = String(raw.treeId ?? raw.tree ?? defaultTreeId ?? "").trim();
      nodeId = String(raw.nodeId ?? raw.node ?? "").trim();
    }
    amount = Number(raw.amount ?? raw.value ?? raw.uses ?? node.consumeAmount ?? 0);
  } else {
    pool = String(node.consumePoolKey ?? "").trim();
    const key = String(node.consumeTalentKey ?? "").trim();
    if (key.includes(".") || key.includes(":")) {
      const [tree, talent] = key.split(/[.:]/).map(p => String(p || "").trim()).filter(Boolean);
      treeId = tree || defaultTreeId;
      nodeId = talent || "";
    }
    amount = Number(node.consumeAmount || 0);
  }
  if (!treeId && nodeId) treeId = defaultTreeId;
  amount = Number.isFinite(amount) && amount > 0 ? Math.floor(amount) : 0;
  return {treeId, nodeId, pool, amount, key: treeId && nodeId ? `${treeId}.${nodeId}` : ""};
};

GT.talentKey = function(treeId, nodeId) {
  return `${String(treeId || "").trim()}.${String(nodeId || "").trim()}`;
};


/** Anwendungspool eines Talentknotens. Ohne Pool benutzt das Talent seinen eigenen Talent-Key. */
GT.talentUsePoolKey = function(treeId, node = {}) {
  const uses = GT.talentUsesConfig(node);
  return uses.pool || GT.talentKey(treeId, node.id);
};

/** Findet den Pool-Key eines Verbrauchsziels. Talent-Keys werden auf deren Pool weitergeleitet. */
GT.talentConsumePoolKey = function(consume = {}, scaffold = GT._talentScaffold) {
  if (consume.pool) return consume.pool;
  if (!consume.key) return "";
  const found = GT.findTalentNode(...consume.key.split("."), scaffold);
  return found ? GT.talentUsePoolKey(found.tree.id, found.node) : consume.key;
};

/** Sammelt die aktiven Anwendungspools aus allen gelernten Talenten. Der höchste gelernte Rang bestimmt das Maximum. */
GT.talentUsePoolsForSystem = function(system = {}, scaffold = GT._talentScaffold) {
  const learned = system?.talentTree?.learned ?? {};
  const pools = {};
  for (const tree of scaffold?.trees ?? []) {
    const learnedTree = learned?.[tree.id] ?? {};
    for (const node of tree.nodes ?? []) {
      if (!learnedTree[node.id]) continue;
      const uses = GT.talentUsesConfig(node);
      if (!uses.max) continue;
      const poolKey = GT.talentUsePoolKey(tree.id, node);
      const existing = pools[poolKey];
      if (!existing || uses.max > existing.max) {
        pools[poolKey] = {key: poolKey, max: uses.max, recovery: uses.recovery, label: uses.poolLabel || GT.talentDisplayLabel(node), sourceKey: GT.talentKey(tree.id, node.id), sourceName: GT.talentDisplayLabel(node), treeLabel: tree.label};
      }
    }
  }
  return pools;
};

GT.talentUsePoolInfo = function(system = {}, poolKey = "", scaffold = GT._talentScaffold) {
  return GT.talentUsePoolsForSystem(system, scaffold)[poolKey] ?? null;
};

GT.findTalentNode = function(treeId, nodeId, scaffold = GT._talentScaffold) {
  const tree = scaffold?.trees?.find(t => t.id === treeId);
  const node = tree?.nodes?.find(n => n.id === nodeId);
  return tree && node ? {tree, node} : null;
};

GT.talentUseMaxForKey = function(key, scaffold = GT._talentScaffold, system = null) {
  if (system) {
    const pool = GT.talentUsePoolInfo(system, key, scaffold);
    if (pool) return pool.max;
  }
  const [treeId, nodeId] = String(key || "").split(".");
  const found = GT.findTalentNode(treeId, nodeId, scaffold);
  return found ? GT.talentUsesConfig(found.node).max : 0;
};

GT.talentUseValue = function(system, key, max = 0) {
  const value = system?.talentTree?.uses?.[key];
  if (value === undefined || value === null || value === "") return Number(max || 0);
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : Number(max || 0);
};

/** Entfernt typische Rang-Endungen aus Talentnamen, z. B. "Einhand II" -> "Einhand". */
GT.talentBaseLabel = function(node = {}) {
  const label = String(GT.talentDisplayLabel(node) || node.label || node.id || "").trim();
  return label
    .replace(/\s+(?:I|II|III|IV|V|VI|VII|VIII|IX|X|\d+)$/i, "")
    .trim() || label;
};

/** Ermittelt eine numerische Ranghöhe für Talente wie Einhand I, Einhand II, Einhand 3 usw. */
GT.talentRankValue = function(node = {}, index = 0) {
  const explicit = Number(node.rank ?? node.tier ?? node.level ?? 0);
  if (Number.isFinite(explicit) && explicit > 0) return explicit;
  const label = String(GT.talentDisplayLabel(node) || node.label || "").trim();
  const id = String(node.id || "").trim();
  const source = `${label} ${id}`;
  const roman = source.match(/\b(I|II|III|IV|V|VI|VII|VIII|IX|X)\b/i)?.[1]?.toUpperCase();
  const romans = {I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8, IX: 9, X: 10};
  if (roman && romans[roman]) return romans[roman];
  const number = source.match(/(?:^|[-_\s])(\d+)\b/)?.[1];
  if (number) return Number(number);
  return Number(index || 0);
};

/** Gruppiert höhere Talentstufen, damit im ActorSheet nur der höchste gelernte Rang erscheint. */
GT.talentRankGroupKey = function(treeId, node = {}) {
  const explicit = String(node.rankGroup ?? node.upgradeGroup ?? node.series ?? node.group ?? "").trim();
  if (explicit) return `${treeId}:${explicit}`;
  const uses = GT.talentUsesConfig(node);
  if (uses.pool) return `${treeId}:pool:${uses.pool}`;
  const base = GT.talentBaseLabel(node).toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${treeId}:base:${base || node.id}`;
};

/** Liefert die Anzeigenkategorie eines Talents im ActorSheet. */
GT.talentCategoryLabel = function(tree = {}, node = {}, fallback = "Talente") {
  return String(node.category || node.groupLabel || tree.category || tree.label || fallback).trim() || fallback;
};

/** Gruppiert Talentkarten für die ActorSheet-Anzeige. */
GT.groupTalentCardsByCategory = function(cards = []) {
  const groups = new Map();
  for (const card of cards ?? []) {
    const key = String(card.category || card.treeLabel || "Talente").trim() || "Talente";
    if (!groups.has(key)) groups.set(key, {label: key, cards: []});
    groups.get(key).cards.push(card);
  }
  return Array.from(groups.values()).map(group => ({
    ...group,
    count: group.cards.length,
    cards: group.cards.sort((a, b) => String(a.name).localeCompare(String(b.name), "de"))
  })).sort((a, b) => String(a.label).localeCompare(String(b.label), "de"));
};

GT.talentPlainDescription = function(value = "") {
  const text = GT.htmlToPlainText(value || "").trim();
  return text || GT.cleanText(value || "");
};

GT.talentDescriptionHtml = function(value = "") {
  return GT.normalizeHtml(String(value || "").trim());
};

GT.talentDetailsText = function(card = {}) {
  return [
    `${card.name || "Talent"}${card.treeLabel ? ` (${card.treeLabel})` : ""}`,
    card.lpCostText ? `Kosten: ${card.lpCostText}` : "",
    card.requirementText ? `Voraussetzungen: ${card.requirementText}` : "",
    card.attributeText ? `Mindestattribute: ${card.attributeText}` : "",
    card.usageText ? `Anwendungen: ${card.usageText}` : "",
    card.consumeText ? `Verbrauch: ${card.consumeText}` : "",
    card.descriptionText ? `\n${card.descriptionText}` : ""
  ].filter(Boolean).join("\n");
};

GT.talentDetailsHtml = function(card = {}) {
  const meta = [
    card.lpCostText ? ["Kosten", card.lpCostText] : null,
    card.requirementText ? ["Voraussetzung", card.requirementText] : null,
    card.attributeText ? ["Mindestattribute", card.attributeText] : null,
    card.usageText ? ["Anwendungen", card.usageText] : null,
    card.consumeText ? ["Verbrauch", card.consumeText] : null
  ].filter(Boolean).map(([label, value]) => `<p class="gt-tooltip-meta"><strong>${GT.escape(label)}:</strong> ${GT.escape(value)}</p>`).join("");
  const body = card.descriptionHtml || GT.talentDescriptionHtml(card.descriptionText || "");
  return `${body}${meta}` || GT.textToHtml("Keine weiteren Informationen.");
};

/** Erzeugt Fallback-Beschreibungen für Talente mit Baum, Kosten und Voraussetzungen. */
GT.talentNodeDescription = function(tree, node) {
  const label = GT.talentDisplayLabel(node);
  const explicit = String(node.description ?? node.sourceDescription ?? "").trim();
  if (explicit && !explicit.startsWith(`${label} gehört zum Talentbaum`)) return explicit;
  const attrReq = GT.talentAttributeRequirementText(node);
  const cost = Number(node.lpCost || 0) > 0 ? `${node.lpCost} LP` : "automatisch oder ohne LP-Kosten";
  const req = (node.requires || []).length ? `Voraussetzung: ${node.requires.join(", ")}.` : "Keine direkte Voraussetzung.";
  const attr = attrReq ? ` Mindestattribute: ${attrReq}.` : "";
  const uses = GT.talentUsesConfig(node);
  const consume = GT.talentConsumeConfig(node, tree.id);
  const useText = uses.max ? ` Anwendungen: ${uses.max} pro Kampf.` : "";
  const consumeText = consume.key && consume.amount ? ` Verbrauch: ${consume.amount} Anwendung von ${consume.key}.` : "";
  return `${label} gehört zum Talentbaum ${tree.label}. Kosten: ${cost}. ${req}${attr}${useText}${consumeText}`;
};

/** Erzeugt eine Zuordnung von Baum-/Knoten-IDs zu Anzeigenamen für gelernte Talente auf Actor-Bögen. */
GT.rebuildTalentLabelIndex = function(scaffold) {
  GT._talentLabelIndex = new Map();
  for (const tree of scaffold?.trees ?? []) {
    for (const node of tree.nodes ?? []) {
      const label = GT.talentDisplayLabel(node);
      GT._talentLabelIndex.set(`${tree.id}.${node.id}`, `${tree.label}: ${label}`);
      GT._talentLabelIndex.set(`${tree.id}:${node.id}`, `${tree.label}: ${label}`);
    }
  }
};

/** Flacht Talentbaumdaten zu gegenstandsähnlichen Dokumenten für den Talent-Kompendiumimport ab. */
GT.flattenTalentScaffold = function(scaffold) {
  return (scaffold?.trees ?? []).flatMap(tree => (tree.nodes ?? []).map(node => {
    const label = GT.talentDisplayLabel(node);
    const description = GT.talentNodeDescription(tree, node);
    const attributeRequirements = GT.talentAttributeRequirements(node);
    const attrText = GT.talentAttributeRequirementText(node);
    const requirements = [(node.requires || []).join(", "), attrText ? `Mindestattribute: ${attrText}` : ""].filter(Boolean).join("; ");
    const uses = GT.talentUsesConfig(node);
    const consume = GT.talentConsumeConfig(node, tree.id);
    return {treeId: tree.id, nodeId: node.id, treeLabel: tree.label, name: label, type: "talent", category: tree.label, description, lpCost: Number(node.lpCost || 0), requirements, attributeRequirements, uses: {value: uses.max, max: uses.max}, usesRecovery: uses.recovery, usesPool: uses.pool, usesPoolLabel: uses.poolLabel, consumeTalentKey: consume.key, consumePoolKey: consume.pool, consumeAmount: consume.amount};
  }));
};

/** Erkennt Talentnamen in NSC-/Monster-Quellentexten und hängt passende eingebettete Talent-Items an. */
GT.actorEmbeddedTalentItems = function(entry, sourceTalents = []) {
  const text = ` ${GT.cleanImportedPlainText(entry?.text || "")} `;
  const added = new Map();
  for (const talent of sourceTalents) {
    const name = GT.talentDisplayLabel(talent);
    if (!name || name.length < 4) continue;
    if (!GT.containsSearchTerm(text, name)) continue;
    const key = GT.normalizedSearch(name);
    if (added.has(key)) continue;
    const description = GT.talentDescriptionHtml(GT.talentNodeDescription({label: talent.treeLabel || talent.category || "Talente"}, {...talent, label: name, lpCost: 0}));
    added.set(key, {
      name,
      type: "talent",
      img: GT.itemImage("talent", name, talent.treeLabel || talent.category || "Talente"),
      system: {
        category: talent.treeLabel || talent.category || "Talente",
        description,
        sourceText: description,
        requirements: talent.requirements || "",
        attributeRequirements: GT.talentAttributeRequirements(talent),
        value: "",
        lpCost: 0,
        treeId: talent.treeId || "",
        nodeId: talent.nodeId || "",
        uses: {value: GT.talentUsesConfig(talent).max, max: GT.talentUsesConfig(talent).max},
        usesRecovery: GT.talentUsesConfig(talent).recovery,
        consumeTalentKey: GT.talentConsumeConfig(talent, talent.treeId || "").key,
        consumeAmount: GT.talentConsumeConfig(talent, talent.treeId || "").amount
      },
      flags: {"gothic-tales": {importedName: name, actorTalent: true}}
    });
  }
  return Array.from(added.values());
};


/** Entfernt Tabellenartefakte und einzelne Wertefragmente aus importierten Kreaturen-/NSC-Beschreibungen. */
GT.cleanImportedPlainText = function(value) {
  let text = String(value ?? "");
  text = text.replace(/<\/?[^>]+>/g, " ");
  text = GT.cleanText(text);
  return text
    .split(/\n+/)
    .map(line => GT.cleanText(line))
    .filter(line => line && !/^(?:\.|-|\/|A|B|AB|ABB)$/i.test(line))
    .filter(line => !/^(?:St|Ge|Ausd|Konz|Intu|Erf|RK|ELE|MA)$/i.test(line))
    .filter(line => !/^[0-9\s,+/().:-]+$/.test(line))
    .filter(line => !/^(?:w|W)?\d+(?:\s*[+/-]\s*\d+)?(?:\s*\+\s*(?:w|W)?\d+)?$/.test(line))
    .reduce((out, line) => {
      if (out[out.length - 1] !== line) out.push(line);
      return out;
    }, [])
    .join("\n");
};

/** Erzeugt lesbare Biografie-/Quellenbeschreibungen für importierte NSCs und Monster. */
GT.actorDescriptionHtml = function(entry, type) {
  const label = type === "monster" ? "Monster" : "NSC";
  const parts = [];
  const meta = [];
  if (entry.faction) meta.push(`Fraktion: ${entry.faction}`);
  if (entry.typ) meta.push(`Typ: ${entry.typ}`);
  if (entry.monsterstufe) meta.push(`Monsterstufe: ${entry.monsterstufe}`);
  if (entry.attributeTotal) meta.push(`Attributsumme: ${entry.attributeTotal}`);
  if (entry.movement !== undefined) meta.push(`Bewegung: ${entry.movement}`);
  if (entry.initiative !== undefined) meta.push(`Initiative: ${entry.initiative}`);
  if (entry.hp?.max !== undefined) meta.push(`TP: ${entry.hp.max}`);
  if (entry.defenses) meta.push(`RK ${entry.defenses.rk || 10}, ELE ${entry.defenses.ele || 10}, MA ${entry.defenses.ma || 10}`);
  parts.push(`<p><strong>${GT.escape(label)}:</strong> ${GT.escape(entry.name)}</p>`);
  if (meta.length) parts.push(`<p>${meta.map(GT.escape).join(" · ")}</p>`);
  const clean = GT.cleanImportedPlainText(entry.text || "");
  if (clean) parts.push(GT.textToHtml(clean));
  return parts.join("");
};

GT.descriptionToPlain = function(value) {
  return GT.cleanImportedPlainText(GT.stripHtml(value ?? ""));
};

/** Bereinigt HTML aus Foundrys Rich-Text-Editor von reinen Editor-Artefakten. */
GT.cleanRichEditorHtml = function(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  const wrapper = document.createElement("div");
  wrapper.innerHTML = raw;
  wrapper.querySelectorAll(".ProseMirror-trailingBreak").forEach(el => el.remove());
  wrapper.querySelectorAll("[data-pm-slice]").forEach(el => el.removeAttribute("data-pm-slice"));
  wrapper.querySelectorAll("[contenteditable]").forEach(el => el.removeAttribute("contenteditable"));
  wrapper.querySelectorAll("[spellcheck]").forEach(el => el.removeAttribute("spellcheck"));
  wrapper.querySelectorAll(".ProseMirror").forEach(el => {
    const div = document.createElement("div");
    div.innerHTML = el.innerHTML;
    el.replaceWith(...Array.from(div.childNodes));
  });
  return wrapper.innerHTML.trim();
};

/** Liest den aktuellen HTML-Stand eines Foundry/ProseMirror Editors robust aus. */
GT.readRichEditorHtml = async function(root, editor = null, field = "system.description") {
  const form = root.querySelector("form");
  try {
    const FD = foundry?.applications?.ux?.FormDataExtended ?? globalThis.FormDataExtended;
    if (form && FD) {
      const data = new FD(form).object;
      const fromPath = getProperty(data, field);
      const fromDirect = data?.[field];
      const fromForm = typeof fromPath === "string" ? fromPath : fromDirect;
      if (typeof fromForm === "string") return GT.cleanRichEditorHtml(fromForm);
    }
  } catch (err) {
    if (GT.debugEnabled?.()) console.debug("Gothic Tales | FormDataExtended für ProseMirror fehlgeschlagen.", err);
  }

  const prose = root.querySelector("prose-mirror");
  if (prose) {
    try {
      if (typeof prose._save === "function") await prose._save();
      if (typeof prose.save === "function") await prose.save();
    } catch (err) {
      if (GT.debugEnabled?.()) console.debug("Gothic Tales | ProseMirror save() fehlgeschlagen.", err);
    }

    const surface = prose.querySelector?.(".ProseMirror") || prose.querySelector?.(".editor-content") || prose.shadowRoot?.querySelector?.(".ProseMirror") || prose.shadowRoot?.querySelector?.(".editor-content");
    const candidates = [
      typeof prose.value === "string" ? prose.value : "",
      surface?.innerHTML,
      typeof prose.getAttribute === "function" ? prose.getAttribute("value") : "",
      prose.innerHTML
    ];
    const value = candidates.find(v => typeof v === "string");
    if (value !== undefined) return GT.cleanRichEditorHtml(value);
  }

  return "";
};

/** Gibt das HTML aus dem Template-Fallback zurück, damit ProseMirror nicht leer startet. */


/** Einfacher Editor, mit dem Bögen htmlFields bearbeiten können, ohne überall rohe Eingabefelder anzuzeigen. */
GT.openTextEditorDialog = function(document, path, label = "Beschreibung") {
  if (!document?.isOwner) return ui.notifications.warn("Du hast keine Berechtigung zum Bearbeiten.");
  new GothicTalesTextEditorDialog(document, path, label).render(true);
};

/** Normalisiert deutsche Namen für unscharfe Treffer zwischen Quellentext und importierten Gegenständen. */
GT.normalizedSearch = function(value) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

GT.containsSearchTerm = function(text, term) {
  const t = ` ${GT.normalizedSearch(text)} `;
  const n = GT.normalizedSearch(term);
  if (!n || n.length < 4) return false;
  return t.includes(` ${n} `);
};

/** Erzeugt alternative Gegenstandsnamen, damit importierter Actor-Text auch Munition und Klammerzusätze findet. */
GT.actorItemAliases = function(item) {
  const names = new Set([item.name]);
  names.add(String(item.name || "").replace(/\s*\([^)]*\)\s*/g, "").trim());
  if (/pfeil|bolzen/i.test(item.name)) names.add("Pfeile");
  return Array.from(names).filter(Boolean);
};

/** Klonet einen Quellgegenstand als eingebettetes Actor-Item und erhält dabei Quellenmetadaten. */
GT.cloneSourceItemForActor = function(entry, quantity = 1, nameOverride = null) {
  const data = deepClone(entry ?? {});
  const system = {
    ...data,
    quantity,
    description: GT.formatItemDescription(data),
    sourceText: data.sourceText || GT.formatItemDescription(data),
    uses: data.uses || {value: 0, max: 0},
    equipped: false
  };
  delete system.name;
  delete system.type;
  return {
    name: nameOverride || data.name || "Gegenstand",
    type: data.type || "equipment",
    img: data.img || data.image || data.sourceImage || GT.itemImage(data.type || "equipment", nameOverride || data.name, data.category || data.folderCategory || ""),
    system,
    flags: {"gothic-tales": {sourceBook: data.sourceBook, sourcePage: data.sourcePage, importedName: data.name}}
  };
};

GT.customActorItem = function(name, type = "equipment", quantity = 1, category = "Inventar") {
  return {
    name,
    type,
    img: GT.itemImage(type, name, category),
    system: {quantity, category, description: GT.formatItemDescription({name, type, quantity, category, text: "Aus dem NSC-/Monsterbogen extrahiert."}), sourceText: GT.textToHtml("Aus dem NSC-/Monsterbogen extrahiert.")},
    flags: {"gothic-tales": {importedName: name}}
  };
};

/** Extrahiert wahrscheinliches Inventar, Beute und Talente aus importiertem NSC-/Monster-Fließtext. */
GT.actorEmbeddedItems = function(entry, type, sourceItems = [], sourceTalents = []) {
  const text = String(entry.text || "");
  const added = new Map();
  const add = (doc, key = doc?.name) => {
    if (!doc || !key) return;
    const norm = GT.normalizedSearch(key);
    if (!norm || added.has(norm)) return;
    added.set(norm, doc);
  };
  const lookup = new Map();
  for (const item of sourceItems) {
    if (item.type === "trait") continue;
    for (const alias of GT.actorItemAliases(item)) lookup.set(GT.normalizedSearch(alias), item);
  }
  const addKnown = (name, qty = 1, display = null) => {
    const wanted = GT.normalizedSearch(name);
    const item = lookup.get(wanted) || sourceItems.find(i => i.type !== "trait" && GT.actorItemAliases(i).some(a => GT.normalizedSearch(a) === wanted));
    if (item) add(GT.cloneSourceItemForActor(item, qty, display || item.name), display || item.name);
    else add(GT.customActorItem(display || name, "equipment", qty), display || name);
  };

  for (const item of sourceItems) {
    if (item.type === "trait") continue;
    if (String(item.name || "").length < 4) continue;
    if (GT.actorItemAliases(item).some(alias => GT.containsSearchTerm(text, alias))) add(GT.cloneSourceItemForActor(item, 1), item.name);
  }

  const rx = (re) => text.match(re);
  let m;
  if ((m = rx(/(\d+)\s*Fackeln?/i))) addKnown("Fackel", Number(m[1]), "Fackeln");
  if ((m = rx(/(\d+)\s*Dietriche?/i))) addKnown("Dietrich", Number(m[1]), "Dietriche");
  else if (/\bDietrich\b/i.test(text)) addKnown("Dietrich", 1);
  if ((m = rx(/Pfeile\s*:\s*(\d+)/i))) add(GT.customActorItem(`Pfeile (${m[1]} Stück)`, "equipment", Number(m[1]), "Munition"), "Pfeile");
  if ((m = rx(/Bolzen\s*:\s*(\d+)/i))) add(GT.customActorItem(`Bolzen (${m[1]} Stück)`, "equipment", Number(m[1]), "Munition"), "Bolzen");
  if ((m = rx(/(\d+)\s*Rationen?/i))) addKnown("Ration / Nahrung", Number(m[1]), "Rationen");
  if ((m = rx(/(\d+)\s*Erz/i))) add(GT.customActorItem(`${m[1]} Erz`, "equipment", Number(m[1]), "Währung"), "Erz");
  if (/Fleisch/i.test(text)) add(GT.customActorItem("Fleisch / Beute", "consumable", 1, type === "monster" ? "Beute" : "Inventar"), "Fleisch / Beute");
  if (/Materialien/i.test(text)) add(GT.customActorItem("Materialien / Trophäen", "equipment", 1, type === "monster" ? "Beute" : "Inventar"), "Materialien / Trophäen");
  const items = Array.from(added.values()).slice(0, 24);
  return items.concat(GT.actorEmbeddedTalentItems(entry, sourceTalents)).slice(0, 36);
};

/** Ergänzt Anzeigenamen und Beschreibungen am Talentgerüst nach dem Laden der JSON-Daten. */
GT.enrichTalentScaffold = function(scaffold) {
  for (const tree of scaffold?.trees ?? []) {
    for (const node of tree.nodes ?? []) {
      node.label = GT.talentDisplayLabel(node);
      node.displayLabel = node.label;
      node.attributeRequirements = GT.talentAttributeRequirements(node);
      node.attributeRequirementText = GT.talentAttributeRequirementText(node);
      node.uses = GT.talentUsesConfig(node);
      node.consumes = GT.talentConsumeConfig(node, tree.id);
      node.sourceDescription = String(node.description ?? "");
      node.description = GT.talentNodeDescription(tree, node);
      node.descriptionText = GT.talentPlainDescription(node.description);
      node.descriptionHtml = GT.talentDescriptionHtml(node.description);
    }
  }
  GT.rebuildTalentLabelIndex(scaffold);
  return scaffold;
};

/** Erzeugt stabile IDs für Flags, Journal-Anker und Kompendium-Import-UIDs. */
GT.slug = function(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "eintrag";
};

/** Übersetzt Gothic-Tales-Attributwerte in Würfel- und Bonuswerte für Würfe. */
GT.attrFromValue = function(value) {
  const v = Number(value || 0);
  const bonus = Math.max(-1, Math.min(10, Math.floor((v - 5) / 10)));
  if (v < 10) return {die: "w2", bonus};
  const step = Math.floor(v / 10);
  if (step <= 1) return {die: "w4", bonus};
  if (step === 2) return {die: "w6", bonus};
  if (step === 3) return {die: "w8", bonus};
  if (step === 4) return {die: "w10", bonus};
  if (step === 5) return {die: "w12", bonus};
  if (step === 6) return {die: "2w6", bonus};
  if (step === 7) return {die: "w8+w6", bonus};
  if (step === 8) return {die: "2w8", bonus};
  if (step === 9) return {die: "w10+w8", bonus};
  if (step === 10) return {die: "2w10", bonus};
  if (step === 11) return {die: "w12+w10", bonus};
  return {die: "2w12", bonus};
};

/** Berechnet die LP-Kosten für Attributsteigerungen während der Charaktererstellung. */
GT.attributeCost = function(from, to) {
  let cost = 0;
  for (let next = Number(from) + 1; next <= Number(to); next++) {
    if (next >= 51) cost += 3;
    else if (next >= 26) cost += 2;
    else cost += 1;
  }
  return cost;
};

/** Berechnet die LP-Kosten für Fähigkeitsgrade aus der Charaktererstellung. */
GT.skillGradeCost = function(grade) {
  const g = Number(grade || 0);
  if (g <= 0) return 0;
  if (g === 1) return 5;
  if (g === 2) return 10;
  return 20;
};

GT.parseFormulaTerms = function(formula) {
  const clean = String(formula || "").toLowerCase().replace(/d/g, "w").replace(/\s+/g, "");
  return clean.match(/[+-]?[^+-]+/g) || [];
};

/** Eigener Gothic-Tales-Würfler mit w-Notation, Vorteil/Nachteil und Pasch-Nachwurf-Logik. */
GT.rollGT = function(formula, options = {}) {
  const terms = GT.parseFormulaTerms(formula);
  const dice = [];
  let constant = 0;
  for (const raw of terms) {
    const sign = raw.startsWith("-") ? -1 : 1;
    const term = raw.replace(/^[+-]/, "");
    const m = term.match(/^(\d*)w(\d+)$/i);
    if (m) {
      const count = Number(m[1] || 1);
      const sides = Number(m[2]);
      const label = sides === 20 ? "Grundwurf" : (sign < 0 ? "Maluswürfel" : (dice.some(d => d.sides === 20) ? "Wertwürfel" : "Zusatzwürfel"));
      for (let i = 0; i < count; i++) dice.push({sides, label, result: Math.floor(Math.random() * sides) + 1, sign, reroll: null, ignored: false, kept: false});
      continue;
    }
    const n = Number(term);
    if (!Number.isNaN(n)) constant += sign * n;
  }

  const mode = String(options.advantageMode || options.d20Mode || "none");
  const level = Math.max(0, Math.min(3, Number(options.advantageLevel || options.d20Level || 0)));
  const advantageSides = GT.advantageDieSides(level);
  if ((mode === "advantage" || mode === "disadvantage") && advantageSides) {
    const label = mode === "advantage" ? "Vorteilswürfel" : "Nachteilwürfel";
    dice.push({
      sides: advantageSides,
      label,
      result: Math.floor(Math.random() * advantageSides) + 1,
      sign: mode === "advantage" ? 1 : -1,
      reroll: null,
      ignored: false,
      kept: false,
      advantageModifier: true
    });
  }

  const groups = {};
  for (let i = 0; i < dice.length; i++) {
    const d = dice[i];
    if (d.ignored || d.advantageModifier || d.sides === 20 || d.sides < 2 || d.sides > 12) continue;
    groups[d.result] ??= [];
    groups[d.result].push(i);
  }
  for (const indexes of Object.values(groups)) {
    if (indexes.length < 2) continue;
    for (const idx of indexes) dice[idx].reroll = Math.floor(Math.random() * dice[idx].sides) + 1;
  }
  const diceTotal = dice.reduce((total, d) => d.ignored ? total : total + d.sign * (d.result + (d.reroll || 0)), 0);
  const total = diceTotal + constant;
  return {formula, dice, constant, total, critical: dice.some(d => d.sides === 20 && d.result === 20 && !d.ignored), rollOptions: options};
};

/** Wandelt Gothic-Tales-w-Notation in Foundry-d-Notation um, damit 3D-Würfelmodule dieselben Würfel erkennen. */
GT.toFoundryDiceFormula = function(formula) {
  return String(formula || "w20").replace(/(\d*)w(\d+)/gi, "$1d$2");
};

/** Baut aus dem eigenen Würfelergebnis einen Foundry-Roll für Dice So Nice, ohne das sichtbare Ergebnis neu zu würfeln. */
GT.prepareDiceSoNiceRoll = async function(result) {
  const supportedSides = new Set([2, 3, 4, 5, 6, 8, 10, 12, 20, 100]);
  const buckets = new Map();
  for (const die of result.dice ?? []) {
    if (!supportedSides.has(die.sides)) continue;
    const bucket = buckets.get(die.sides) ?? {initial: [], rerolls: []};
    bucket.initial.push({result: die.result, active: !die.ignored, discarded: !!die.ignored, exploded: !!die.reroll});
    if (die.reroll) bucket.rerolls.push({result: die.reroll, active: true});
    buckets.set(die.sides, bucket);
  }
  const formula = Array.from(buckets, ([sides, bucket]) => `${bucket.initial.length}d${sides}`).join("+");
  if (!formula) return null;
  const roll = new Roll(formula);
  if (typeof roll.evaluate === "function") await roll.evaluate();
  else await roll.roll({async: true});
  for (const die of roll.dice ?? []) {
    const bucket = buckets.get(die.faces);
    if (!bucket) continue;
    die.results = [...bucket.initial, ...bucket.rerolls];
  }
  return roll;
};

/** Übergibt eigene Gothic-Tales-Würfe an Dice So Nice, falls das Modul aktiv ist. */
GT.showDiceSoNice = async function(result) {
  if (!game.dice3d?.showForRoll) return;
  const roll = await GT.prepareDiceSoNiceRoll(result);
  if (!roll) return;
  return game.dice3d.showForRoll(roll, game.user, true, null, false);
};

GT.advantageDieSides = function(level) {
  const l = Number(level || 0);
  if (l === 1) return 2;
  if (l === 2) return 6;
  if (l === 3) return 12;
  return 0;
};

GT.advantageLabel = function(mode, level) {
  const m = String(mode || "none");
  const l = Number(level || 0);
  if (m !== "advantage" && m !== "disadvantage") return "";
  const sides = GT.advantageDieSides(l);
  if (!sides) return "";
  const height = l === 1 ? "Klein" : (l === 2 ? "Mittel" : "Groß");
  return `${height}er ${m === "advantage" ? "Vorteil" : "Nachteil"}: 1W${sides}`;
};

GT.rollDialogFormula = function(baseFormula, diceCounts = {}, bonus = 0) {
  const parts = [String(baseFormula || "w20").trim() || "w20"];
  for (const die of [2, 4, 6, 8, 10, 12, 20]) {
    const count = Number(diceCounts?.[die] || 0);
    if (count > 0) parts.push(`${count > 1 ? count : ""}w${die}`);
  }
  const b = Number(bonus || 0);
  let formula = parts.join(" + ");
  if (b > 0) formula += ` + ${b}`;
  if (b < 0) formula += ` - ${Math.abs(b)}`;
  return formula;
};

GT.rollDialogSummary = function({advantageMode = "none", advantageLevel = 0, diceCounts = {}, bonus = 0} = {}) {
  const parts = [];
  const adv = GT.advantageLabel(advantageMode, advantageLevel);
  if (adv) parts.push(adv);
  const extra = [];
  for (const die of [2, 4, 6, 8, 10, 12, 20]) {
    const count = Number(diceCounts?.[die] || 0);
    if (count > 0) extra.push(`${count}×W${die}`);
  }
  if (extra.length) parts.push(`Zusatzwürfel: ${extra.join(", ")}`);
  const b = Number(bonus || 0);
  if (b) parts.push(`Bonus: ${b > 0 ? "+" : ""}${b}`);
  return parts.join(" · ");
};

/** Gibt eigene Würfelergebnisse als Foundry-Chatkarten aus und synchronisiert 3D-Würfel mit Dice So Nice. */
GT.executeChatRoll = async function({formula, label = "Gothic Tales Wurf", actor = null, item = null, flavor = "", rollOptions = {}, rollSummary = "", cardType = "roll", cardData = {}} = {}) {
  if (!formula) formula = "w20";
  const result = GT.rollGT(formula, rollOptions);
  GT.showDiceSoNice(result).catch(err => console.warn("Gothic Tales | Dice So Nice konnte den Wurf nicht darstellen.", err));
  const diceHtml = result.dice.map((d, index) => {
    const sign = d.sign < 0 ? "−" : (index === 0 ? "" : "+");
    const subtotal = d.ignored ? 0 : d.sign * (d.result + (d.reroll || 0));
    const signClass = d.ignored ? "ignored" : (d.sign < 0 ? "negative" : "positive");
    const rr = d.reroll ? `<span class="gt-roll-reroll"><i class="fa-solid fa-repeat"></i> Nachwurf ${d.reroll}</span>` : "";
    const labelText = d.label || (d.sides === 20 ? "Grundwurf" : "Wertwürfel");
    const kept = d.kept ? `<span class="gt-roll-keep"><i class="fa-solid fa-check"></i> zählt</span>` : "";
    const ignored = d.ignored ? `<span class="gt-roll-ignored"><i class="fa-solid fa-xmark"></i> ignoriert</span>` : "";
    return `<span class="gt-roll-die ${signClass}">
      <span class="gt-roll-die-label">${GT.escape(labelText)}</span>
      <span class="gt-roll-die-face">${sign}W${d.sides}</span>
      <span class="gt-roll-die-value">${d.result}</span>
      ${kept}${ignored}${rr}
      <span class="gt-roll-die-total">${d.ignored ? "—" : `${subtotal >= 0 ? "+" : ""}${subtotal}`}</span>
    </span>`;
  }).join("");
  const constHtml = result.constant ? `<span class="gt-roll-bonus"><span>Bonus</span><strong>${result.constant >= 0 ? "+" : ""}${result.constant}</strong></span>` : "";
  const baseD20 = result.dice.find(d => d.sides === 20 && !d.ignored)?.result || 0;
  const criticalFailure = Number(baseD20) === 1;
  const critical = result.critical ? `<div class="gt-critical"><i class="fa-solid fa-burst"></i> Kritischer Treffer/Erfolg</div>` : "";
  const fumble = criticalFailure ? `<div class="gt-critical gt-fumble"><i class="fa-solid fa-skull-crossbones"></i> Kritischer Fehlschlag</div>` : "";
  const actorName = actor?.name ? `<div class="gt-roll-actor">${GT.escape(actor.name)}</div>` : "";
  const summaryHtml = rollSummary ? `<div class="gt-roll-options"><i class="fa-solid fa-sliders"></i> ${GT.escape(rollSummary)}</div>` : "";
  const cardClass = cardType === "druidSpell" ? "gt-druid-spell-roll-card" : (cardType === "magicCircle" ? "gt-magic-skill-roll-card" : (cardType === "initiative" ? "gt-initiative-roll-card" : ""));
  const cardIcon = cardType === "druidSpell" ? "fa-leaf" : (cardType === "magicCircle" ? "fa-wand-sparkles" : "fa-dice-d20");
  const cardKicker = cardType === "druidSpell" ? "Druidenkunst" : (cardType === "magicCircle" ? "Magiekreis" : "");
  const detailRows = Object.entries(cardData || {}).filter(([, value]) => value !== "" && value !== null && value !== undefined).map(([key, value]) => `<span><b>${GT.escape(key)}</b>${GT.escape(value)}</span>`).join("");
  const detailsHtml = detailRows ? `<div class="gt-special-card-details">${detailRows}</div>` : "";
  const content = `<div class="gothic-tales chat-card gt-roll-card ${cardClass}">
    <header class="gt-roll-card-header">
      <div>
        ${cardKicker ? `<div class="gt-roll-card-kicker">${GT.escape(cardKicker)}</div>` : ""}
        <h2>${GT.escape(label)}</h2>
        ${actorName}
      </div>
      <div class="gt-roll-card-icon"><i class="fa-solid ${cardIcon}"></i></div>
    </header>
    ${flavor ? `<div class="gt-roll-flavor">${GT.escape(flavor)}</div>` : ""}
    ${summaryHtml}
    ${detailsHtml}
    <div class="gt-roll-formula"><span>Formel</span><code>${GT.escape(formula)}</code></div>
    <div class="gt-roll-dice-grid">${diceHtml || `<span class="gt-roll-die muted">Keine Würfel</span>`}</div>
    ${constHtml ? `<div class="gt-roll-modifiers">${constHtml}</div>` : ""}
    ${critical}
    ${fumble}
    <footer class="gt-roll-total"><span>Gesamt</span><strong>${result.total}</strong></footer>
  </div>`;
  return ChatMessage.create({speaker: ChatMessage.getSpeaker({actor}), content, flags: {"gothic-tales": {cardType, actorUuid: actor?.uuid || "", itemUuid: item?.uuid || "", rollTotal: result.total, rollCritical: !!result.critical, rollCriticalFailure: criticalFailure, rollD20: baseD20, formula, label, flavor}}});
};

GT.chatRoll = async function(options = {}) {
  const shouldConfigure = options.configure === true || (options.configure !== false && !!GT.setting("alwaysRollDialog"));
  if (!shouldConfigure) {
    const message = await GT.executeChatRoll(options);
    if (typeof options.onRoll === "function") options.onRoll(message);
    return message;
  }
  return GT.openRollDialog(options);
};

/** Entfernt ein frei positioniertes Gothic-Tales-Hoverfenster. */
GT.hideFloatingTooltip = function() {
  document.querySelectorAll(".gt-floating-tooltip").forEach(el => el.remove());
  document.querySelectorAll(".gt-talent-info.tooltip-open").forEach(el => el.classList.remove("tooltip-open"));
  document.removeEventListener("mousedown", GT._floatingTooltipOutsideHandler, true);
  document.removeEventListener("keydown", GT._floatingTooltipKeyHandler, true);
  window.removeEventListener("resize", GT._floatingTooltipResizeHandler, true);
};

/** Positioniert einen Talent-Hovertext am Viewport, damit er nicht von Scrollcontainern abgeschnitten wird. */
GT.positionFloatingTooltip = function(trigger, tooltip) {
  if (!trigger || !tooltip) return;
  const gap = 10;
  const margin = 8;
  const rect = trigger.getBoundingClientRect();
  const width = Math.min(420, Math.max(260, window.innerWidth - margin * 2));
  tooltip.style.width = `${width}px`;
  const measured = tooltip.getBoundingClientRect();
  let left = rect.left + rect.width / 2 - width / 2;
  left = Math.max(margin, Math.min(left, window.innerWidth - width - margin));
  const above = rect.top - measured.height - gap >= margin;
  let top = above ? rect.top - measured.height - gap : rect.bottom + gap;
  if (!above && top + measured.height > window.innerHeight - margin) top = Math.max(margin, window.innerHeight - measured.height - margin);
  tooltip.classList.toggle("below", !above);
  tooltip.classList.toggle("above", above);
  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${top}px`;
};

/** Zeigt einen Talent-Hovertext außerhalb des Sheet-Containers an. */
GT.showFloatingTooltip = function(trigger, text) {
  const clean = String(text || "").trim();
  if (!trigger || !clean) {
    GT.hideFloatingTooltip();
    return;
  }
  const alreadyOpen = trigger.classList.contains("tooltip-open") && document.querySelector(".gt-floating-tooltip");
  GT.hideFloatingTooltip();
  if (alreadyOpen) return;
  const tooltip = document.createElement("div");
  tooltip.className = "gothic-tales gt-floating-tooltip";
  tooltip.innerHTML = /<[a-z][\s\S]*>/i.test(clean) ? clean : GT.textToHtml(clean);
  document.body.appendChild(tooltip);
  trigger.classList.add("tooltip-open");
  GT.positionFloatingTooltip(trigger, tooltip);
  GT._floatingTooltipOutsideHandler = (ev) => {
    if (trigger.contains(ev.target)) return;
    if (tooltip.contains?.(ev.target)) return;
    GT.hideFloatingTooltip();
  };
  GT._floatingTooltipKeyHandler = (ev) => {
    if (ev.key === "Escape") GT.hideFloatingTooltip();
  };
  GT._floatingTooltipResizeHandler = () => GT.positionFloatingTooltip(trigger, tooltip);
  document.addEventListener("mousedown", GT._floatingTooltipOutsideHandler, true);
  document.addEventListener("keydown", GT._floatingTooltipKeyHandler, true);
  window.addEventListener("resize", GT._floatingTooltipResizeHandler, true);
};

/** Liefert eine reine, beschreibbare Kopie der Actor-Systemdaten. */
GT.actorSystemSource = function(actor) {
  const system = actor?.system;
  if (system?.toObject) return system.toObject();
  return deepClone(system ?? {});
};

/** Schreibt Systemdaten mit frischer Ableitung zurück. */
GT.updateActorSystem = async function(actor, source, options = {}) {
  if (!actor) return;
  const prepared = GT.recalculateSystem(source, actor.type, {equippedArmorBonus: GT.equippedArmorBonusFromItems(actor.items), ...options});
  await actor.update(GT.flattenSystemUpdate(prepared));
};

/** Ändert die Charakterstufe nach oben oder unten und passt LP nachvollziehbar an. */
GT.changeCharacterLevel = async function(actor, targetLevel) {
  if (!actor || actor.type !== "character") return ui.notifications.warn("Stufenänderungen sind nur für Spielercharaktere verfügbar.");
  if (!actor.isOwner) return ui.notifications.warn("Du hast keine Berechtigung, diesen Charakter zu bearbeiten.");
  const current = Math.max(1, Math.min(27, Number(actor.system?.stufe || 1)));
  const target = Math.max(1, Math.min(27, Number(targetLevel || current)));
  if (target === current) return ui.notifications.info("Die Stufe bleibt unverändert.");
  const oldRes = GT.LEVEL_RESOURCES[current] ?? {lp: current * 10};
  const newRes = GT.LEVEL_RESOURCES[target] ?? {lp: target * 10};
  const lpDelta = Number(newRes.lp || 0) - Number(oldRes.lp || 0);
  const source = GT.actorSystemSource(actor);
  source.stufe = target;
  source.lp ??= {value: 0, max: 0};
  source.lp.max = Number(newRes.lp || 0);
  source.lp.value = Math.max(0, Math.min(source.lp.max, Number(source.lp.value || 0) + lpDelta));
  await GT.updateActorSystem(actor, source);
  const dir = lpDelta >= 0 ? `+${lpDelta}` : `${lpDelta}`;
  ui.notifications.info(`Gothic Tales: ${actor.name} ist jetzt Stufe ${target}. LP-Anpassung: ${dir}.`);
};

/** Abwärtskompatibler Level-Up-Helfer. */
GT.levelUpCharacter = async function(actor) {
  const current = Math.max(1, Number(actor?.system?.stufe || 1));
  return GT.changeCharacterLevel(actor, current + 1);
};

/** Summiert RK-/ELE-/MA-Boni aus eingebetteten Rüstungen und Schilden, die als ausgerüstet markiert sind. */
GT.equippedArmorBonusFromItems = function(items = []) {
  const bonus = {rk: 0, ele: 0, ma: 0};
  for (const item of items ?? []) {
    if (!item?.system?.equipped) continue;
    if (!["armor", "shield"].includes(item.type)) continue;
    bonus.rk += Number(item.system.rk || 0);
    bonus.ele += Number(item.system.ele || 0);
    bonus.ma += Number(item.system.ma || 0);
  }
  return bonus;
};

/** Bereitet deaktivierte Active-Effect-Vorlagen für defensive Ausrüstung vor, die in Kompendien importiert wird. */
GT.makeItemActiveEffects = function(entry = {}) {
  const changes = [];
  for (const key of ["rk", "ele", "ma"]) {
    const value = Number(entry[key] || 0);
    if (value) changes.push({key: `system.armorBonus.${key}`, mode: "add", value: String(value), priority: 20});
  }
  if (!changes.length) return [];
  return [{name: `${entry.name || "Gegenstand"} ausgerüstet`, icon: GT.CONFIG.defaultItemImg, disabled: true, transfer: false, changes, flags: {"gothic-tales": {equipmentEffect: true}}}];
};

/** Berechnet abgeleitete Actor-Daten neu: Attributwürfel, Fähigkeitsformeln, Verteidigungen, Ressourcen und Zähler. */
GT.recalculateSystem = function(system, type = "character", options = {}) {
  const s = deepClone(system ?? {});
  s.attributes ??= {};
  for (const [key, label] of Object.entries(GT.CONFIG.attributes)) {
    s.attributes[key] ??= {label, value: 10};
    s.attributes[key].label = label;
    const derived = GT.attrFromValue(s.attributes[key].value ?? 10);
    s.attributes[key].die = derived.die;
    s.attributes[key].bonus = derived.bonus;
  }
  s.skills ??= {};
  for (const [key, label] of Object.entries(GT.CONFIG.skills)) {
    const [a, b] = GT.CONFIG.skillAttributes[key] ?? ["st", "ge"];
    const value = Math.floor((Number(s.attributes[a]?.value ?? 10) + Number(s.attributes[b]?.value ?? 10)) / 2);
    const previous = s.skills[key] ?? {};
    const derived = GT.attrFromValue(value);
    const grade = Number(previous.grade ?? 0);
    let gradeDie = "";
    let gradeBonus = 0;
    if (grade === 1) gradeBonus = 2;
    if (grade === 2) { gradeDie = "w4"; gradeBonus = 2; }
    if (grade >= 3) { gradeDie = "w8"; gradeBonus = 5; }
    const formula = `w20 + ${derived.die}${gradeDie ? ` + ${gradeDie}` : ""} + ${derived.bonus + gradeBonus}`;
    s.skills[key] = {label, value, die: derived.die, bonus: derived.bonus + gradeBonus, grade, gradeDie, formula};
  }
  s.stufe = Number(s.stufe ?? 1);
  const lr = GT.LEVEL_RESOURCES[s.stufe] ?? {lp: s.stufe * 10, erz: 0};
  s.lp ??= {value: lr.lp, max: lr.lp};
  s.lp.max = Number(s.lp.max || lr.lp);
  const equippedBonus = options.equippedArmorBonus ?? null;
  s.armorBonus ??= {rk: 0, ele: 0, ma: 0};
  if (equippedBonus) s.armorBonus = {rk: Number(equippedBonus.rk || 0), ele: Number(equippedBonus.ele || 0), ma: Number(equippedBonus.ma || 0)};
  s.defenses ??= {};
  const geB = Number(s.attributes.ge?.bonus ?? 0), intuB = Number(s.attributes.intu?.bonus ?? 0), ausdB = Number(s.attributes.ausd?.bonus ?? 0), konzB = Number(s.attributes.konz?.bonus ?? 0), erfB = Number(s.attributes.erf?.bonus ?? 0);
  s.defenses.rk = {label: "RK", value: 10 + geB + intuB + Number(s.armorBonus.rk ?? 0), bonus: Number(s.armorBonus.rk ?? 0)};
  s.defenses.ele = {label: "Elemente", value: 10 + geB + ausdB + Number(s.armorBonus.ele ?? 0), bonus: Number(s.armorBonus.ele ?? 0)};
  s.defenses.ma = {label: "Mentale Abwehr", value: 10 + konzB + erfB + intuB + Number(s.armorBonus.ma ?? 0), bonus: Number(s.armorBonus.ma ?? 0)};
  s.hp ??= {value: 0, max: 0};
  s.mana ??= {value: 0, max: 0};
  if (type === "character") {
    s.hp.max = Math.floor(2 * Number(s.attributes.ausd.value) + Number(s.attributes.st.value) + s.stufe + 5);
    s.mana.max = Math.floor(Number(s.attributes.konz.value) + (Number(s.attributes.erf.value) + Number(s.attributes.intu.value)) / 2 + 0.5 * s.stufe);
  } else {
    s.hp.max = Number(s.hp.max || s.hp.value || 10);
    s.mana.max = Number(s.mana.max || 0);
  }
  s.hp.value = Math.min(Number(s.hp.value || s.hp.max), s.hp.max);
  s.mana.value = Math.min(Number(s.mana.value || s.mana.max), s.mana.max);
  const previousInitiative = s.initiative ?? {};
  if (type === "character") {
    const iniValue = Math.floor((Number(s.attributes.ge.value) + Number(s.attributes.intu.value) + 2 * Number(s.attributes.erf.value)) / 3);
    const iniDerived = GT.attrFromValue(iniValue);
    s.initiative = {value: iniValue, die: iniDerived.die, bonus: iniDerived.bonus, fixed: false};
  } else {
    const fixedValue = Number(previousInitiative.value ?? previousInitiative.bonus ?? 0);
    const configuredDie = String(previousInitiative.die ?? "").trim();
    s.initiative = {
      value: fixedValue,
      die: configuredDie,
      bonus: Number(previousInitiative.bonus ?? fixedValue),
      fixed: previousInitiative.fixed !== false || !configuredDie
    };
  }
  s.movement ??= {value: 5};
  s.exhaustion ??= {value: 0, max: 6};
  s.deathCounter ??= {value: 0, max: 6};
  s.talentTree ??= {learned: {}, uses: {}};
  s.talentTree.learned ??= {};
  s.talentTree.uses ??= {};
  s.magicCircles ??= {learned: {}, uses: {}, dice: {}};
  s.magicCircles.learned ??= {};
  s.magicCircles.uses ??= {};
  s.magicCircles.dice ??= {};
  s.druidArts ??= {learned: {}, uses: {}};
  s.druidArts.learned ??= {};
  s.druidArts.uses ??= {};
  s.professions ??= {learned: {}, uses: {}};
  s.professions.learned ??= {};
  s.professions.uses ??= {};
  s.sheetLocked = !!s.sheetLocked;
  return s;
};

/** Wandelt ein neu berechnetes Systemobjekt in Foundry-Updatepfade unter system.* um. */
GT.flattenSystemUpdate = function(system) {
  const flat = flattenObject(system);
  const update = {};
  for (const [k, v] of Object.entries(flat)) update[`system.${k}`] = v;
  return update;
};

/** Löst ein Actor-Attribut in die Angriffs-/Attributwurfformel auf, die Gegenstandsbuttons verwenden. */
GT.actorAttributeFormula = function(actor, attribute) {
  const raw = String(attribute || "st").toLowerCase();
  const attr = raw.includes("ge") && raw.includes("st") ? "st" : raw.split(/[\/,& ]+/).filter(Boolean)[0] || "st";
  const key = {staerke: "st", geschick: "ge", ausdauer: "ausd", konzentration: "konz", intuition: "intu", erfahrung: "erf"}[attr] || attr;
  const data = actor?.system?.attributes?.[key];
  if (!data) return "w20";
  return `w20 + ${data.die || "w4"} + ${Number(data.bonus || 0)}`;
};

/** Erzeugt die Schadens-/Wirkungsformel für Waffen und Zauber inklusive relevanter Actor-Würfel. */
GT.itemDamageFormula = function(actor, item) {
  const damage = item?.system?.damage || item?.system?.effect || "";
  if (!damage) return "w20";
  const props = String(item?.system?.properties || "").toLowerCase();
  if (item.type === "spell" && String(item.system?.attribute || "").trim()) {
    const attr = String(item.system.attribute).toLowerCase();
    const ad = actor?.system?.attributes?.[attr];
    if (ad) return `${damage} + ${ad.die} + ${Number(ad.bonus || 0)}`;
  }
  if (item.type === "weapon" && !props.includes("armbrust")) {
    const attr = String(item.system?.attribute || "st").toLowerCase().includes("ge") ? "ge" : "st";
    const ad = actor?.system?.attributes?.[attr];
    if (ad) return `${damage} + ${ad.die} + ${Number(ad.bonus || 0)}`;
  }
  return damage;
};

/** Gruppiert eingebettete Items für Bogenbereiche wie Kampf, Kram, Munition, Nahrung und Tränke. */

/** Entfernt das frei schwebende Navigations-Post-It. */
GT.hideFloatingSideTabLabel = function() {
  document.querySelectorAll(".gt-floating-nav-postit").forEach(el => el.remove());
};

/** Zeigt Navigations-Post-Its außerhalb der Foundry-Application an, damit sie nicht vom Fenster abgeschnitten werden. */
GT.showFloatingSideTabLabel = function(link) {
  if (!(link instanceof HTMLElement)) return;
  const label = link.querySelector("span")?.textContent?.trim() || link.dataset.tab || "";
  if (!label) return;
  GT.hideFloatingSideTabLabel();
  const postit = document.createElement("div");
  postit.className = "gt-floating-nav-postit";
  postit.textContent = label;
  document.body.appendChild(postit);

  const rect = link.getBoundingClientRect();
  const margin = 10;
  const postitRect = postit.getBoundingClientRect();
  let left = rect.right + margin;
  let top = rect.top + (rect.height / 2) - (postitRect.height / 2);

  // Wenn das App-Fenster sehr nah am rechten Bildschirmrand steht, bleibt das Post-It trotzdem sichtbar.
  if (left + postitRect.width > window.innerWidth - 8) {
    left = Math.max(8, rect.left - postitRect.width - margin);
    postit.classList.add("left");
  }
  top = Math.max(8, Math.min(top, window.innerHeight - postitRect.height - 8));

  postit.style.left = `${left}px`;
  postit.style.top = `${top}px`;
};

/** Bindet die Side-Tab-Labels an ein body-level Floating-Post-It. */
GT.bindFloatingSideTabLabels = function(root) {
  if (!root?.querySelectorAll) return;
  root.querySelectorAll(".gt-side-tabs a.item").forEach(link => {
    link.addEventListener("mouseenter", () => GT.showFloatingSideTabLabel(link));
    link.addEventListener("focus", () => GT.showFloatingSideTabLabel(link));
    link.addEventListener("mousemove", () => GT.showFloatingSideTabLabel(link));
    link.addEventListener("mouseleave", GT.hideFloatingSideTabLabel);
    link.addEventListener("blur", GT.hideFloatingSideTabLabel);
    link.addEventListener("click", GT.hideFloatingSideTabLabel);
  });
};

GT.groupItems = function(items) {
  const order = [
    ["weapons", "Waffen", ["weapon"], null, "weapon"],
    ["shields", "Schilde", ["shield"], null, "shield"],
    ["armor", "Rüstungen", ["armor"], null, "armor"],
    ["spells", "Zauber", ["spell"], null, "spell"],
    ["talents", "Talente", ["talent"], null, "talent"],
    ["traits", "Stärken & Schwächen", ["trait"], null, "trait"],
    ["potions", "Tränke", ["consumable"], item => String(item.system?.category || "").toLowerCase().includes("tränke") || item.name.toLowerCase().includes("trank"), "consumable"],
    ["food", "Essen & Trinken", ["consumable", "equipment"], item => /ration|nahrung|wasser|wein|bier|schnaps/i.test(item.name), "consumable"],
    ["ammo", "Munition", ["equipment", "weapon"], item => /pfeil|bolzen|munition/i.test(item.name) || String(item.system?.category || "").toLowerCase().includes("munition"), "equipment"],
    ["gear", "Kram", ["equipment", "consumable"], null, "equipment"]
  ];
  const groups = Object.fromEntries(order.map(([id,label,types,pred,createType]) => [id, {id,label,createType,items: []}]));
  for (const item of items) {
    let placed = false;
    for (const [id, label, types, pred] of order) {
      if (!types.includes(item.type)) continue;
      if (pred && !pred(item)) continue;
      groups[id].items.push(item); placed = true; break;
    }
    if (!placed) groups.gear.items.push(item);
  }
  return groups;
};


/** Baut den Startseitenbereich "Ausgerüstet" aus angelegten Waffen/Rüstungen und favorisierten Zaubern/Gegenständen. */
GT.actorEquippedOverviewGroups = function(items = []) {
  const groups = {
    weapons: {id: "weapons", label: "Waffen", createType: "weapon", items: []},
    armor: {id: "armor", label: "Rüstungen", createType: "armor", items: []},
    spells: {id: "spells", label: "Zauber", createType: "spell", items: []},
    gear: {id: "gear", label: "Gegenstände", createType: "equipment", items: []}
  };
  for (const item of items ?? []) {
    const type = String(item?.type || "");
    const equipped = !!item?.system?.equipped;
    const favorite = !!item?.system?.favorite;
    if (type === "weapon" && equipped) groups.weapons.items.push(item);
    else if ((type === "armor" || type === "shield") && equipped) groups.armor.items.push(item);
    else if (type === "spell" && favorite) groups.spells.items.push(item);
    else if (favorite && !["weapon", "armor", "shield", "spell", "talent", "trait"].includes(type)) groups.gear.items.push(item);
  }
  return groups;
};

/** Lädt mitgelieferte JSON-Daten aus systems/gothic-tales/data für Assistenten, Talentbaum und Startausrüstung. */
async function fetchSystemJson(file) {
  const response = await fetch(`systems/gothic-tales/data/${file}`);
  if (!response.ok) throw new Error(`Daten konnten nicht geladen werden: ${file}`);
  return response.json();
}

GT.getRumpelkammerItems = async function() {
  if (!GT._rumpelkammerItems) GT._rumpelkammerItems = (await fetchSystemJson("gt-rumpelkammer-items.json")).items;
  return GT._rumpelkammerItems;
};

GT.getTalentScaffold = async function() {
  if (!GT._talentScaffold) GT._talentScaffold = GT.enrichTalentScaffold(await fetchSystemJson("gt-talent-tree-scaffold.json"));
  else GT.rebuildTalentLabelIndex(GT._talentScaffold);
  return GT._talentScaffold;
};


GT.getMagicCircleScaffold = async function() {
  if (!GT._magicCircleScaffold) GT._magicCircleScaffold = GT.enrichTalentScaffold(await fetchSystemJson("gt-magic-circles-scaffold.json"));
  return GT._magicCircleScaffold;
};

GT.getDruidArtsScaffold = async function() {
  if (!GT._druidArtsScaffold) GT._druidArtsScaffold = GT.enrichTalentScaffold(await fetchSystemJson("gt-druid-arts-scaffold.json"));
  return GT._druidArtsScaffold;
};

GT.getProfessionScaffold = async function() {
  if (!GT._professionScaffold) GT._professionScaffold = GT.enrichTalentScaffold(await fetchSystemJson("gt-profession-scaffold.json"));
  return GT._professionScaffold;
};


/* ------------------------------------------------------------------------- */
/* Druidenkunst: Riten, Schulen, Zauber und Tiergestalten                    */
/* ------------------------------------------------------------------------- */

GT.druidLearningFree = function() {
  return String(GT.setting("druidLearningMode") || "rites") === "free";
};

GT.druidCreateSpellItems = function() {
  return !!GT.setting("druidCreateSpellItems");
};

GT.druidState = function(actorOrSystem) {
  const system = actorOrSystem?.system ?? actorOrSystem ?? {};
  const learned = system.druidArts?.learned ?? {};
  return {
    rites: {...(learned.rites ?? {})},
    schools: Array.isArray(learned.schools) ? [...learned.schools] : [],
    spells: {...(learned.spells ?? {})},
    beastSpells: Array.isArray(learned.beastSpells) ? [...learned.beastSpells] : [],
    riteHistory: Array.isArray(learned.riteHistory) ? [...learned.riteHistory] : []
  };
};

GT.druidRites = function(scaffold = GT._druidArtsScaffold) {
  return scaffold?.rituals ?? [];
};

GT.druidSchools = function(scaffold = GT._druidArtsScaffold) {
  return scaffold?.schools ?? [];
};

GT.druidSpells = function(scaffold = GT._druidArtsScaffold) {
  return scaffold?.spells ?? [];
};

GT.druidForms = function(scaffold = GT._druidArtsScaffold) {
  return scaffold?.forms ?? [];
};

GT.druidSchool = function(id, scaffold = GT._druidArtsScaffold) {
  return GT.druidSchools(scaffold).find(s => s.id === id);
};

GT.druidRite = function(id, scaffold = GT._druidArtsScaffold) {
  return GT.druidRites(scaffold).find(r => r.id === id);
};

GT.druidSpell = function(id, scaffold = GT._druidArtsScaffold) {
  return GT.druidSpells(scaffold).find(s => s.id === id);
};

GT.druidForm = function(id, scaffold = GT._druidArtsScaffold) {
  return GT.druidForms(scaffold).find(f => f.id === id);
};

GT.druidSpellLevel = function(spell, rank) {
  const r = Math.max(1, Math.min(Number(rank || 1), Number(spell?.maxRank || 1)));
  return (spell?.levels ?? []).find(l => Number(l.rank) === r) ?? (spell?.levels ?? [])[0] ?? {};
};

GT.druidActorLevel = function(actor) {
  return Number(actor?.system?.stufe ?? 0);
};

GT.druidAttrMeets = function(actor, requirements = {}) {
  for (const [key, value] of Object.entries(requirements ?? {})) {
    const current = Number(actor?.system?.attributes?.[key]?.value ?? 0);
    if (current < Number(value || 0)) return false;
  }
  return true;
};

GT.druidAttrAnyMeets = function(actor, list = []) {
  if (!list?.length) return true;
  return list.some(req => GT.druidAttrMeets(actor, req));
};

GT.druidRiteLearned = function(state, riteId) {
  const value = state?.rites?.[riteId];
  return !!value || Number(value || 0) > 0;
};

GT.druidRiteAvailable = function(actor, rite, state = GT.druidState(actor)) {
  if (!rite) return {ok: false, reason: "Ritus nicht gefunden"};
  if (!rite.repeatable && GT.druidRiteLearned(state, rite.id)) return {ok: false, reason: "bereits gelernt"};
  for (const req of rite.requires ?? []) if (!GT.druidRiteLearned(state, req)) return {ok: false, reason: "Voraussetzung fehlt"};
  if (!GT.druidAttrMeets(actor, rite.attributeRequirements ?? {})) return {ok: false, reason: "Attributsvoraussetzung fehlt"};
  if (!GT.druidAttrAnyMeets(actor, rite.attributeAny ?? [])) return {ok: false, reason: "Attributsalternative fehlt"};
  const cost = Number(rite.lpCost || 0);
  if (actor?.type === "character" && Number(actor.system?.lp?.value ?? 0) < cost) return {ok: false, reason: "nicht genug LP"};
  return {ok: true, reason: ""};
};

GT.druidUnlockedSchoolIds = function(state = {}) {
  return Array.from(new Set(state.schools ?? []));
};

GT.druidSchoolSlotId = function(state, slot) {
  const schools = GT.druidUnlockedSchoolIds(state);
  if (slot === "first") return schools[0] || "";
  if (slot === "second") return schools[1] || "";
  if (slot === "third") return schools[2] || "";
  return String(slot || "");
};

GT.druidSpellRank = function(state, spellId) {
  return Math.max(0, Number(state?.spells?.[spellId] || 0));
};

GT.druidCountMaxSpellsInSchool = function(state, schoolId, scaffold = GT._druidArtsScaffold) {
  return GT.druidSpells(scaffold).filter(s => s.school === schoolId && GT.druidSpellRank(state, s.id) >= Number(s.maxRank || 1)).length;
};

GT.druidSpellPrereqMet = function(actor, spell, state = GT.druidState(actor), scaffold = GT._druidArtsScaffold) {
  const req = spell?.requires ?? {};
  if (req.rite && !GT.druidRiteLearned(state, req.rite)) return {ok: false, reason: `Ritus ${req.rite} fehlt`};
  if (req.spellMax && GT.druidSpellRank(state, req.spellMax) < Number(GT.druidSpell(req.spellMax, scaffold)?.maxRank || 1)) return {ok: false, reason: "Zauber-Voraussetzung fehlt"};
  if (req.twoMaxInSchool && GT.druidCountMaxSpellsInSchool(state, req.twoMaxInSchool, scaffold) < 2) return {ok: false, reason: "2 Zauber auf Maximalstufe nötig"};
  if (req.oneOfSpellsMax?.length) {
    const ok = req.oneOfSpellsMax.some(id => GT.druidSpellRank(state, id) >= Number(GT.druidSpell(id, scaffold)?.maxRank || 1));
    if (!ok) return {ok: false, reason: "ein Seelenband auf Stufe V nötig"};
  }
  if (req.spellRank) {
    for (const [id, rank] of Object.entries(req.spellRank)) {
      if (GT.druidSpellRank(state, id) < Number(rank || 0)) return {ok: false, reason: "Zauber-Rang-Voraussetzung fehlt"};
    }
  }
  if (spell?.kind === "form") {
    const level = Number(spell.levelRequirement || 0);
    if (GT.druidActorLevel(actor) < level) return {ok: false, reason: `Stufe ${level} nötig`};
    const form = GT.druidForm(spell.formId, scaffold);
    if (form?.requiresAnyCount?.length) {
      const learned = form.requiresAnyCount.filter(fid => GT.druidSpellRank(state, `tiergestalt-${fid}`) > 0).length;
      if (learned < Number(form.requiresAnyCountN || 1)) return {ok: false, reason: `${form.requiresAnyCountN} Vorformen nötig`};
    }
  }
  return {ok: true, reason: ""};
};

GT.druidSpellCanSelect = function(actor, spell, schoolIds = [], state = GT.druidState(actor), scaffold = GT._druidArtsScaffold) {
  if (!spell || spell.school === "ritual") return {ok: false, reason: "kein Schulzauber"};
  const unlocked = GT.druidLearningFree() ? GT.druidSchools(scaffold).map(s => s.id) : GT.druidUnlockedSchoolIds(state);
  const allowedSchools = schoolIds?.length ? schoolIds : unlocked;
  if (!allowedSchools.includes(spell.school)) return {ok: false, reason: "Schule nicht verfügbar"};
  const current = GT.druidSpellRank(state, spell.id);
  if (current >= Number(spell.maxRank || 1)) return {ok: false, reason: "Maximalstufe erreicht"};
  const prereq = GT.druidSpellPrereqMet(actor, spell, state, scaffold);
  if (!prereq.ok) return prereq;
  return {ok: true, reason: ""};
};

GT.druidSpellOptionRows = function(actor, schoolIds = [], state = GT.druidState(actor), scaffold = GT._druidArtsScaffold) {
  const ids = schoolIds?.length ? schoolIds : (GT.druidLearningFree() ? GT.druidSchools(scaffold).map(s => s.id) : GT.druidUnlockedSchoolIds(state));
  return GT.druidSpells(scaffold)
    .filter(spell => ids.includes(spell.school) && spell.school !== "ritual")
    .map(spell => {
      const current = GT.druidSpellRank(state, spell.id);
      const check = GT.druidSpellCanSelect(actor, spell, ids, state, scaffold);
      const school = GT.druidSchool(spell.school, scaffold)?.label || spell.school;
      return {
        id: spell.id,
        label: spell.label,
        school: spell.school,
        schoolLabel: school,
        current,
        next: Math.min(Number(spell.maxRank || 1), current + 1),
        max: Number(spell.maxRank || 1),
        disabled: !check.ok,
        reason: check.reason,
        optionLabel: `${spell.label} (${school}) · ${current ? `Stufe ${current} → ${Math.min(Number(spell.maxRank || 1), current + 1)}` : "neu lernen"}${check.ok ? "" : ` · ${check.reason}`}`
      };
    });
};

GT.druidSchoolChoiceRows = function(state = {}, scaffold = GT._druidArtsScaffold) {
  const unlocked = GT.druidUnlockedSchoolIds(state);
  return GT.druidSchools(scaffold).map(s => ({...s, unlocked: unlocked.includes(s.id), disabled: unlocked.includes(s.id)}));
};

GT.druidRiteSelectionPlan = function(rite, state = GT.druidState({})) {
  const plan = {chooseSchool: false, chooseRemainingSchool: false, spellSlots: []};
  if (!rite) return plan;
  if (rite.effect?.chooseSchool) plan.chooseSchool = true;
  if (rite.effect?.chooseRemainingSchool) plan.chooseRemainingSchool = true;
  for (const choice of rite.effect?.spellChoices ?? []) {
    const count = Number(choice.count || 0);
    if (choice.school === "all") {
      for (const school of GT.druidSchools()) {
        for (let i = 0; i < count; i++) plan.spellSlots.push({school: school.id, label: school.label});
      }
      continue;
    }
    for (let i = 0; i < count; i++) plan.spellSlots.push({school: choice.school, label: choice.school});
  }
  return plan;
};

GT.druidResolveSlotSchoolIds = function(slotSchool, state, chosenSchool = "") {
  if (slotSchool === "chosen") return chosenSchool ? [chosenSchool] : [];
  if (slotSchool === "first") return [GT.druidSchoolSlotId(state, "first")].filter(Boolean);
  if (slotSchool === "second") return [GT.druidSchoolSlotId(state, "second")].filter(Boolean);
  if (slotSchool === "third") return [GT.druidSchoolSlotId(state, "third")].filter(Boolean);
  if (slotSchool === "unlocked") return GT.druidUnlockedSchoolIds(state);
  if (slotSchool === "all") return GT.druidSchools().map(s => s.id);
  return [slotSchool].filter(Boolean);
};

GT.druidRiteDialogData = function(actor, rite) {
  const state = GT.druidState(actor);
  const plan = GT.druidRiteSelectionPlan(rite, state);
  const schools = GT.druidSchoolChoiceRows(state).filter(s => !s.unlocked);
  const selectionSlots = plan.spellSlots.map((slot, index) => {
    const ids = GT.druidResolveSlotSchoolIds(slot.school, state, "");
    const options = slot.school === "chosen"
      ? GT.druidSpellOptionRows(actor, GT.druidSchools().map(s => s.id), state).map(o => ({...o, needsChosen: true}))
      : GT.druidSpellOptionRows(actor, ids, state);
    const label = slot.school === "chosen" ? "gewählte Schule" : (slot.school === "unlocked" ? "freigeschaltete Schulen" : (GT.druidSchool(slot.school)?.label || slot.label || slot.school));
    return {index, school: slot.school, label, options};
  });
  return {actor, rite, state, plan, schools, selectionSlots, lpCost: Number(rite.lpCost || 0), freeMode: GT.druidLearningFree()};
};

GT.druidApplyRite = async function(actor, rite, {schoolId = "", spellIds = []} = {}) {
  const source = GT.actorSystemSource(actor);
  source.druidArts ??= {learned: {}, uses: {}};
  source.druidArts.learned ??= {};
  const state = GT.druidState(source);
  const newState = deepClone(state);
  newState.riteHistory = Array.isArray(newState.riteHistory) ? newState.riteHistory : [];

  const cost = Number(rite.lpCost || 0);
  const history = {
    id: GT.safeRandomID?.() || foundry?.utils?.randomID?.() || `${rite.id}-${Date.now()}`,
    riteId: rite.id,
    label: rite.label,
    lpCost: cost,
    addedSchools: [],
    spellDeltas: {},
    spellIds: [],
    timestamp: Date.now(),
    repeatable: !!rite.repeatable
  };

  const addSchool = id => {
    const school = String(id || "");
    if (!school || newState.schools.includes(school)) return;
    newState.schools.push(school);
    history.addedSchools.push(school);
  };

  addSchool(schoolId);
  if (rite.effect?.chooseRemainingSchool) {
    for (const school of GT.druidSchools()) {
      if (!newState.schools.includes(school.id)) { addSchool(school.id); break; }
    }
  }

  const chosenSchool = schoolId || "";
  const plan = GT.druidRiteSelectionPlan(rite, state);
  const allowedPerSlot = plan.spellSlots.map(slot => GT.druidResolveSlotSchoolIds(slot.school, {...state, schools: newState.schools}, chosenSchool));
  for (let i = 0; i < plan.spellSlots.length; i++) {
    const spellId = String(spellIds[i] || "");
    if (!spellId) continue;
    const spell = GT.druidSpell(spellId);
    const allowed = allowedPerSlot[i] || [];
    const check = GT.druidSpellCanSelect(actor, spell, allowed, {...state, schools: newState.schools, spells: newState.spells});
    if (!check.ok) {
      ui.notifications.warn(`${spell?.label || spellId}: ${check.reason}`);
      continue;
    }
    const before = Number(newState.spells[spellId] || 0);
    const after = Math.min(Number(spell.maxRank || 1), before + 1);
    if (after <= before) continue;
    newState.spells[spellId] = after;
    history.spellDeltas[spellId] = Number(history.spellDeltas[spellId] || 0) + (after - before);
    history.spellIds.push(spellId);
  }

  if (rite.repeatable) newState.rites[rite.id] = Number(newState.rites[rite.id] || 0) + 1;
  else newState.rites[rite.id] = true;
  newState.riteHistory.push(history);

  const update = GT.druidStateUpdate(newState, state);
  if (actor.type === "character" && cost > 0) update["system.lp.value"] = Math.max(0, Number(actor.system?.lp?.value || 0) - cost);
  await actor.update(update);
  if (GT.druidCreateSpellItems()) await GT.syncDruidSpellItems(actor, newState);
  const message = await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({actor}),
    content: GT.druidChatCard({
      icon: "fa-leaf",
      kicker: "Ritus der Druiden",
      title: rite.label,
      actorName: `${actor.name} vollzieht einen Druidenritus.`,
      meta: [`Kosten ${Number(rite.lpCost || 0)} LP`, "Lehrer/Lernmoment", rite.repeatable ? "wiederholbar" : "einmalig"],
      body: `<p>${GT.escape(rite.summary || "")}</p>`
    })
  });
  GT.revealDruidChatMessage(message);
  actor.sheet?.render(false);
};

GT.druidFallbackRiteHistory = function(rite, state = {}) {
  const history = {
    id: `fallback-${rite?.id || "rite"}-${Date.now()}`,
    riteId: rite?.id || "",
    label: rite?.label || "",
    lpCost: Number(rite?.lpCost || 0),
    addedSchools: [],
    spellDeltas: {},
    spellIds: [],
    timestamp: Date.now(),
    repeatable: !!rite?.repeatable,
    legacy: true
  };

  const schools = Array.isArray(state.schools) ? state.schools : [];
  const addSchool = id => {
    const school = String(id || "");
    if (school && !history.addedSchools.includes(school)) history.addedSchools.push(school);
  };

  if (rite?.effect?.chooseSchool) {
    if (rite.id === "initiation") addSchool(schools[0]);
    else if (rite.id === "weggabelung") addSchool(schools[1]);
    else addSchool(schools.find(Boolean));
  }
  if (rite?.effect?.chooseRemainingSchool) addSchool(schools[2] || schools[schools.length - 1]);

  const addSpellDelta = (spellId, amount = 1) => {
    const id = String(spellId || "");
    if (!id) return;
    const current = Number(state.spells?.[id] || 0);
    if (current <= 0) return;
    const delta = Math.min(current, Number(amount || 1));
    history.spellDeltas[id] = Math.min(current, Number(history.spellDeltas[id] || 0) + delta);
    if (!history.spellIds.includes(id)) history.spellIds.push(id);
  };

  // Wenn eine durch den Ritus freigeschaltete Schule zurückgenommen wird, werden
  // bei Altdaten ohne Historie alle aktuell gelernten Zauber dieser Schule entfernt.
  for (const schoolId of history.addedSchools) {
    for (const [spellId, rank] of Object.entries(state.spells ?? {})) {
      const spell = GT.druidSpell(spellId);
      if (spell?.school === schoolId && Number(rank || 0) > 0) addSpellDelta(spellId, rank);
    }
  }

  // Für Riten ohne Schulfreischaltung kann bei alten/beschädigten Daten nicht exakt
  // rekonstruiert werden, welcher Zauber gewählt wurde. Dann wird bestmöglich die
  // passende Anzahl aus den betreffenden Schulen zurückgenommen.
  const workingRanks = {...(state.spells ?? {})};
  const candidatesFor = schoolIds => GT.druidSpells()
    .filter(spell => schoolIds.includes(spell.school) && Number(workingRanks[spell.id] || 0) > 0)
    .reverse();

  for (const choice of rite?.effect?.spellChoices ?? []) {
    const count = Number(choice.count || 0);
    for (let i = 0; i < count; i++) {
      let schoolIds = [];
      if (choice.school === "first") schoolIds = [schools[0]].filter(Boolean);
      else if (choice.school === "second") schoolIds = [schools[1]].filter(Boolean);
      else if (choice.school === "third") schoolIds = [schools[2]].filter(Boolean);
      else if (choice.school === "unlocked" || choice.school === "all") schoolIds = schools;
      else if (choice.school === "chosen") schoolIds = history.addedSchools.length ? history.addedSchools : schools;
      else schoolIds = [choice.school].filter(Boolean);

      const candidate = candidatesFor(schoolIds).find(spell => Number(workingRanks[spell.id] || 0) > 0);
      if (candidate) {
        addSpellDelta(candidate.id, 1);
        workingRanks[candidate.id] = Math.max(0, Number(workingRanks[candidate.id] || 0) - 1);
      }
    }
  }

  return history;
};

GT.druidUnlearnBlockers = function(actor, rite, state = GT.druidState(actor), historyEntry = null) {
  const blockers = [];
  if (!rite) return ["Ritus nicht gefunden."];
  const dependentRites = GT.druidRites().filter(other => other.id !== rite.id && (other.requires ?? []).includes(rite.id) && GT.druidRiteLearned(state, other.id));
  if (dependentRites.length) blockers.push(`Zuerst spätere Riten verlernen: ${dependentRites.map(r => r.label).join(", ")}`);

  if (!historyEntry) historyEntry = GT.druidFallbackRiteHistory(rite, state);

  const preview = deepClone(state);
  preview.rites = {...(preview.rites ?? {})};
  preview.schools = Array.isArray(preview.schools) ? [...preview.schools] : [];
  preview.spells = {...(preview.spells ?? {})};

  if (rite.repeatable && Number(preview.rites[rite.id] || 0) > 1) preview.rites[rite.id] = Number(preview.rites[rite.id] || 0) - 1;
  else preview.rites[rite.id] = false;

  for (const [spellId, delta] of Object.entries(historyEntry.spellDeltas ?? {})) {
    const next = Number(preview.spells[spellId] || 0) - Number(delta || 0);
    preview.spells[spellId] = next > 0 ? next : 0;
  }

  for (const schoolId of historyEntry.addedSchools ?? []) {
    const remainingInSchool = Object.entries(preview.spells ?? {}).some(([spellId, rank]) => Number(rank || 0) > 0 && GT.druidSpell(spellId)?.school === schoolId);
    if (remainingInSchool) blockers.push(`In der Schule ${GT.druidSchool(schoolId)?.label || schoolId} sind noch Zauber gelernt.`);
    else preview.schools = preview.schools.filter(id => id !== schoolId);
  }

  const previewSchools = new Set(preview.schools);
  for (const [spellId, rank] of Object.entries(preview.spells ?? {})) {
    if (Number(rank || 0) <= 0) continue;
    const spell = GT.druidSpell(spellId);
    if (!spell) continue;
    if (spell.school !== "ritual" && !previewSchools.has(spell.school)) blockers.push(`${spell.label}: Schule wäre nicht mehr freigeschaltet.`);
    const prereq = GT.druidSpellPrereqMet(actor, spell, preview);
    if (!prereq.ok) blockers.push(`${spell.label}: ${prereq.reason}`);
  }

  return blockers;
};

GT.druidStateUpdate = function(newState = {}, previousState = {}) {
  const update = {
    "system.druidArts.learned.rites": {...(newState.rites ?? {})},
    "system.druidArts.learned.schools": Array.isArray(newState.schools) ? [...newState.schools] : [],
    "system.druidArts.learned.spells": {...(newState.spells ?? {})},
    "system.druidArts.learned.beastSpells": Array.isArray(newState.beastSpells) ? [...newState.beastSpells] : [],
    "system.druidArts.learned.riteHistory": Array.isArray(newState.riteHistory) ? [...newState.riteHistory] : []
  };

  // Zusätzlich konkrete Werte auf 0/false setzen. Das verhindert, dass Foundry
  // gelöschte Keys durch Merge-Updates im Actor-System zurückbehält.
  for (const riteId of new Set([...Object.keys(previousState.rites ?? {}), ...Object.keys(newState.rites ?? {})])) {
    update[`system.druidArts.learned.rites.${riteId}`] = !!newState.rites?.[riteId] ? newState.rites[riteId] : false;
  }
  for (const spellId of new Set([...Object.keys(previousState.spells ?? {}), ...Object.keys(newState.spells ?? {})])) {
    update[`system.druidArts.learned.spells.${spellId}`] = Number(newState.spells?.[spellId] || 0);
  }
  return update;
};

GT.unlearnDruidRite = async function(actor, riteId) {
  await GT.getDruidArtsScaffold();
  if (actor.system?.sheetLocked) return ui.notifications.warn("Der Charakterbogen ist gesperrt.");
  const rite = GT.druidRite(riteId);
  if (!rite) return ui.notifications.warn("Ritus nicht gefunden.");

  const source = GT.actorSystemSource(actor);
  source.druidArts ??= {learned: {}, uses: {}};
  source.druidArts.learned ??= {};
  const state = GT.druidState(source);
  if (!GT.druidRiteLearned(state, rite.id)) return ui.notifications.warn("Dieser Ritus ist nicht gelernt.");

  const history = Array.isArray(state.riteHistory) ? [...state.riteHistory] : [];
  let historyIndex = -1;
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i]?.riteId === rite.id) { historyIndex = i; break; }
  }
  let historyEntry = historyIndex >= 0 ? history[historyIndex] : null;
  if (!historyEntry) historyEntry = GT.druidFallbackRiteHistory(rite, state);

  const blockers = GT.druidUnlearnBlockers(actor, rite, state, historyEntry);
  if (blockers.length) return ui.notifications.warn(`Ritus kann nicht verlernt werden: ${blockers.join(" ")}`);

  const spellLabels = Object.entries(historyEntry.spellDeltas ?? {}).map(([id, delta]) => `${GT.druidSpell(id)?.label || id} -${delta}`).join(", ") || "keine Zauber";
  const schoolLabels = (historyEntry.addedSchools ?? []).map(id => GT.druidSchool(id)?.label || id).join(", ") || "keine Schule";
  const legacyText = historyEntry.legacy ? "<p><em>Für diesen Ritus fehlte eine Rücknahme-Historie. Die Rücknahme wird daher bestmöglich aus dem aktuellen Zustand rekonstruiert.</em></p>" : "";
  const ok = await GT.confirm({
    title: `${rite.label} verlernen`,
    content: `<p><strong>${GT.escape(rite.label)}</strong> wirklich verlernen?</p>${legacyText}<p>Entfernt: ${GT.escape(spellLabels)}.</p><p>Schulen: ${GT.escape(schoolLabels)}.</p><p>${Number(historyEntry.lpCost || 0) ? `${Number(historyEntry.lpCost || 0)} LP werden zurückerstattet.` : "Es werden keine LP erstattet."}</p>`,
    yesLabel: "Verlernen",
    noLabel: "Abbrechen"
  });
  if (!ok) return;

  const newState = deepClone(state);
  newState.riteHistory = historyIndex >= 0 ? history.filter((_, index) => index !== historyIndex) : history;
  if (rite.repeatable && Number(newState.rites[rite.id] || 0) > 1) newState.rites[rite.id] = Number(newState.rites[rite.id] || 0) - 1;
  else newState.rites[rite.id] = false;

  for (const [spellId, delta] of Object.entries(historyEntry.spellDeltas ?? {})) {
    const next = Number(newState.spells[spellId] || 0) - Number(delta || 0);
    newState.spells[spellId] = next > 0 ? next : 0;
  }

  for (const schoolId of historyEntry.addedSchools ?? []) {
    const addedElsewhere = (newState.riteHistory ?? []).some(h => (h.addedSchools ?? []).includes(schoolId));
    if (!addedElsewhere) {
      newState.schools = (newState.schools ?? []).filter(id => id !== schoolId);
      for (const [spellId, rank] of Object.entries(newState.spells ?? {})) {
        if (Number(rank || 0) > 0 && GT.druidSpell(spellId)?.school === schoolId) newState.spells[spellId] = 0;
      }
    }
  }

  const update = GT.druidStateUpdate(newState, state);
  const refund = Number(historyEntry.lpCost || 0);
  if (actor.type === "character" && refund > 0) update["system.lp.value"] = Number(actor.system?.lp?.value || 0) + refund;
  await actor.update(update);
  if (GT.druidCreateSpellItems()) await GT.syncDruidSpellItems(actor, newState);

  const message = await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({actor}),
    content: GT.druidChatCard({
      icon: "fa-rotate-left",
      kicker: "Ritus verlernt",
      title: rite.label,
      actorName: `${actor.name} nimmt einen Druidenritus zurück.`,
      meta: [`LP zurück ${refund}`, `Zauber: ${Object.keys(historyEntry.spellDeltas ?? {}).length}`, `Schulen: ${(historyEntry.addedSchools ?? []).length}`],
      body: `<p>Der Ritus wurde zurückgenommen. Zugehörige Zauberstufen, Schulen und automatisch erzeugte Zauber-Items wurden angepasst.</p>${historyEntry.legacy ? "<p class=\"gt-chat-note\">Rücknahme-Historie fehlte: der Zustand wurde bestmöglich bereinigt.</p>" : ""}`
    })
  });
  GT.revealDruidChatMessage(message);
  actor.sheet?.render(false);
};

GT.learnDruidRite = async function(actor, riteId) {
  await GT.getDruidArtsScaffold();
  const rite = GT.druidRite(riteId);
  const state = GT.druidState(actor);
  const available = GT.druidRiteAvailable(actor, rite, state);
  if (!available.ok) return ui.notifications.warn(`Ritus kann nicht gelernt werden: ${available.reason}`);
  const confirmed = await GT.confirm({
    title: `${rite.label} lernen`,
    content: `<p>${GT.escape(rite.summary || "")}</p><p>${Number(rite.lpCost || 0) ? `Kosten: <strong>${Number(rite.lpCost || 0)} LP</strong>. ` : "Keine LP-Kosten. "}Ein Lehrer oder Lernmoment ist erforderlich.</p><p>Ritus durchführen?</p>`,
    yesLabel: "Ritus lernen",
    noLabel: "Abbrechen"
  });
  if (!confirmed) return;
  const plan = GT.druidRiteSelectionPlan(rite, state);
  if (plan.chooseSchool || plan.chooseRemainingSchool || plan.spellSlots.length) return new GothicTalesDruidRiteChoiceDialog(actor, rite).render(true);
  return GT.druidApplyRite(actor, rite, {});
};

GT.learnDruidSpellFree = async function(actor, spellId) {
  await GT.getDruidArtsScaffold();
  if (!GT.druidLearningFree() && !game.user?.isGM) return ui.notifications.warn("Freie Druidenzauber-Auswahl ist in den Systemeinstellungen deaktiviert.");
  const spell = GT.druidSpell(spellId);
  const state = GT.druidState(actor);
  const check = GT.druidSpellCanSelect(actor, spell, GT.druidLearningFree() ? GT.druidSchools().map(s => s.id) : GT.druidUnlockedSchoolIds(state), state);
  if (!check.ok) return ui.notifications.warn(check.reason);
  const newState = deepClone(state);
  if (!newState.schools.includes(spell.school)) newState.schools.push(spell.school);
  newState.spells[spell.id] = Math.min(Number(spell.maxRank || 1), Number(newState.spells[spell.id] || 0) + 1);
  await actor.update(GT.druidStateUpdate(newState, state));
  if (GT.druidCreateSpellItems()) await GT.syncDruidSpellItems(actor, newState);
  ui.notifications.info(`${spell.label} gelernt/gestuft.`);
  actor.sheet?.render(false);
};

GT.druidSpellDescriptionHtml = function(spell, rank) {
  const level = GT.druidSpellLevel(spell, rank);
  const rows = (spell.levels ?? []).map(l => `<tr><td>${GT.escape(l.rank)}</td><td>${GT.escape(l.weapon || l.block || l.difficulty || "—")}</td><td>${GT.escape(l.mana ?? "—")}</td><td>${GT.escape(l.duration ?? l.height ?? "—")}</td><td>${GT.escape(l.properties || l.healing || "")}</td></tr>`).join("");
  return `<p>${GT.escape(spell.description || spell.summary || "")}</p>
    <p><strong>Aktuelle Stufe:</strong> ${Number(rank || 1)} · <strong>Mana:</strong> ${GT.escape(level.mana ?? spell.mana ?? "—")} · <strong>Eigenschaften:</strong> ${GT.escape(level.properties || spell.summary || "")}</p>
    <table><thead><tr><th>Stufe</th><th>W/Block/SchwG</th><th>Mana</th><th>Dauer/Höhe</th><th>Eigenschaften</th></tr></thead><tbody>${rows}</tbody></table>`;
};

GT.druidSpellItemData = function(spell, rank) {
  const level = GT.druidSpellLevel(spell, rank);
  const mana = String(level.mana ?? spell.mana ?? "");
  const weapon = String(level.weapon || level.block || spell.damage || "");
  const range = String(spell.range || level.range || "");
  return {
    name: spell.label,
    type: "spell",
    img: GT.itemImage?.("spell", spell.label) || "systems/gothic-tales/assets/icons/zauber.svg",
    system: {
      description: GT.druidSpellDescriptionHtml(spell, rank),
      category: `Druidenkunst · ${GT.druidSchool(spell.school)?.label || spell.school}`,
      folderCategory: "Druidenkunst",
      properties: `Druidenkunst, ${GT.druidSchool(spell.school)?.label || spell.school}, Stufe ${rank}${level.properties ? `, ${level.properties}` : ""}`,
      requirements: spell.prereqText || "",
      cost: mana,
      circle: `Druidenkunst ${rank}`,
      mana,
      targetDefense: spell.targetDefense || "",
      damage: weapon,
      attribute: "intu",
      range,
      favorite: true
    }
  };
};

GT.revealDruidChatMessage = function(message) {
  const messageId = String(message?.id || message?._id || "");
  const reveal = () => {
    try { ui.sidebar?.activateTab?.("chat"); } catch (_err) { /* Foundry-Version ohne activateTab */ }
    try { ui.chat?.scrollBottom?.(); } catch (_err) { /* Chat-Popout oder noch nicht gerendert */ }
    if (!messageId) return;
    const safeId = globalThis.CSS?.escape ? CSS.escape(messageId) : messageId.replace(/[^a-zA-Z0-9_-]/g, "");
    const messageElement = document.querySelector(`.message[data-message-id="${safeId}"], [data-message-id="${safeId}"]`);
    if (!messageElement) return;
    document.querySelectorAll(".message.gt-druid-message-front, [data-message-id].gt-druid-message-front").forEach(element => element.classList.remove("gt-druid-message-front"));
    messageElement.classList.add("gt-druid-message-front");
    messageElement.scrollIntoView?.({block: "nearest", behavior: "smooth"});
    window.setTimeout(() => messageElement.classList.remove("gt-druid-message-front"), 4200);
  };
  window.setTimeout(reveal, 60);
  window.setTimeout(reveal, 260);
  return message;
};

GT.druidChatCard = function({icon = "fa-leaf", kicker = "Druidenkunst", title = "", actorName = "", body = "", meta = []} = {}) {
  const metaHtml = (meta || []).filter(Boolean).map(entry => `<span><i class="fas fa-seedling"></i>${GT.escape(entry)}</span>`).join("");
  return `<div class="gothic-tales chat-card gt-druid-card">
    <header class="gt-druid-chat-header">
      <div class="gt-druid-chat-sigil"><i class="fas ${GT.escape(icon)}"></i></div>
      <div class="gt-druid-chat-heading">
        <div class="gt-druid-chat-kicker">${GT.escape(kicker)}</div>
        <h2>${GT.escape(title)}</h2>
        ${actorName ? `<p>${GT.escape(actorName)}</p>` : ""}
      </div>
      <span class="gt-druid-chat-branch" aria-hidden="true"><i class="fas fa-leaf"></i></span>
    </header>
    ${metaHtml ? `<div class="gt-druid-chat-meta">${metaHtml}</div>` : ""}
    <div class="gt-druid-chat-body">${body}</div>
  </div>`;
};

GT.syncDruidSpellItems = async function(actor, state = GT.druidState(actor)) {
  if (!GT.druidCreateSpellItems()) return;
  const creates = [];
  const learnedNames = new Set();

  for (const [spellId, rank] of Object.entries(state.spells ?? {})) {
    const spell = GT.druidSpell(spellId);
    if (!spell || spell.school === "ritual" || Number(rank || 0) <= 0) continue;
    learnedNames.add(spell.label);
    const data = GT.druidSpellItemData(spell, rank);
    const existing = Array.from(actor.items ?? []).find(i => i.type === "spell" && i.name === spell.label && String(i.system?.folderCategory || "") === "Druidenkunst");
    if (existing) await existing.update({system: data.system});
    else creates.push(data);
  }

  const deleteIds = Array.from(actor.items ?? [])
    .filter(i => i.type === "spell" && String(i.system?.folderCategory || "") === "Druidenkunst" && !learnedNames.has(i.name))
    .map(i => i.id)
    .filter(Boolean);
  if (deleteIds.length) await actor.deleteEmbeddedDocuments("Item", deleteIds);
  if (creates.length) await actor.createEmbeddedDocuments("Item", creates);
};

GT.castDruidSpell = async function(actor, spellId) {
  await GT.getDruidArtsScaffold();
  const state = GT.druidState(actor);
  const spell = GT.druidSpell(spellId);
  if (!spell) return ui.notifications.warn("Druidenzauber nicht gefunden.");
  const rank = GT.druidSpellRank(state, spellId);
  if (rank <= 0 && !GT.druidLearningFree()) return ui.notifications.warn("Dieser Druidenzauber ist nicht gelernt.");
  const level = GT.druidSpellLevel(spell, Math.max(1, rank));
  const formula = spell.roll ? GT.actorAttributeFormula(actor, "intu") : (level.weapon || level.block ? String(level.weapon || level.block) : "w20");
  const schoolLabel = GT.druidSchool(spell.school)?.label || "Druidenkunst";
  const flavor = `${level.properties || spell.summary || ""}`;
  const rollSummary = `${schoolLabel} · ${spell.roll || "Druidenkunst"} · Stufe ${Math.max(1, rank)} · Mana ${level.mana ?? spell.mana ?? "—"}`;
  await GT.chatRoll({
    formula,
    label: spell.label,
    actor,
    flavor,
    rollSummary,
    cardType: "druidSpell",
    cardData: {
      Schule: schoolLabel,
      Stufe: Math.max(1, rank),
      Mana: level.mana ?? spell.mana ?? "—",
      Reichweite: spell.range || level.range || "—",
      Dauer: level.duration || "—"
    },
    onRoll: message => GT.revealDruidChatMessage(message)
  });
};

GT.announceDruidTransformation = async function(actor, spellId) {
  await GT.getDruidArtsScaffold();
  const spell = GT.druidSpell(spellId);
  const form = GT.druidForm(spell?.formId);
  if (!spell || !form) return ui.notifications.warn("Tiergestalt nicht gefunden.");
  const message = await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({actor}),
    content: GT.druidChatCard({
      icon: "fa-paw",
      kicker: "Gestaltwandler",
      title: `Tiergestalt: ${form.label}`,
      actorName: `${actor.name} verwandelt sich in ${form.label}.`,
      meta: [`Mana ${Number(form.mana || 0)}`, `Mindeststufe ${Number(form.level || 0)}`, "Dauer max. 5 Minuten"],
      body: `<p>Nutze jetzt den vom SL vorbereiteten Monster-Actor.</p><p class="gt-chat-note">TP und Tiergestalt-Schaden werden händisch verwaltet.</p>`
    })
  });
  GT.revealDruidChatMessage(message);
};

GT.actorDruidView = function(actor, system = actor?.system ?? {}, scaffold = GT._druidArtsScaffold) {
  const state = GT.druidState(system);
  const schools = GT.druidSchools(scaffold).map((school, index) => ({...school, unlocked: state.schools.includes(school.id), order: state.schools.indexOf(school.id) + 1 || ""}));
  const rites = GT.druidRites(scaffold).map(rite => {
    const av = GT.druidRiteAvailable(actor, rite, state);
    const learnedValue = state.rites?.[rite.id];
    const history = (state.riteHistory ?? []).filter(h => h?.riteId === rite.id);
    const lastHistory = history[history.length - 1] || null;
    const blockers = !!learnedValue ? GT.druidUnlearnBlockers(actor, rite, state, lastHistory) : [];
    return {
      ...rite,
      learned: !!learnedValue,
      learnedCount: Number(learnedValue || 0),
      available: av.ok,
      reason: av.reason,
      costText: Number(rite.lpCost || 0) ? `${rite.lpCost} LP` : "0 LP",
      canUnlearn: !!learnedValue && !!lastHistory && !blockers.length,
      unlearnReason: blockers.join(" "),
      historyCount: history.length
    };
  });
  const spells = GT.druidSpells(scaffold).filter(s => s.school !== "ritual").map(spell => {
    const rank = GT.druidSpellRank(state, spell.id);
    const level = GT.druidSpellLevel(spell, Math.max(1, rank));
    const can = GT.druidSpellCanSelect(actor, spell, GT.druidLearningFree() ? GT.druidSchools(scaffold).map(s => s.id) : GT.druidUnlockedSchoolIds(state), state, scaffold);
    return {
      ...spell,
      learned: rank > 0,
      rank,
      currentRank: rank,
      maxRank: Number(spell.maxRank || 1),
      schoolLabel: GT.druidSchool(spell.school, scaffold)?.label || spell.school,
      level,
      manaText: level.mana ?? spell.mana ?? "—",
      propertiesText: level.properties || spell.summary || "",
      canImprove: can.ok,
      cannotReason: can.reason,
      isForm: spell.kind === "form"
    };
  });
  const activeSchoolId = state.schools?.[0] || GT.druidSchools(scaffold)[0]?.id || "";
  const spellGroups = GT.druidSchools(scaffold).map(school => {
    const groupSpells = spells.filter(spell => spell.school === school.id);
    return {
      ...school,
      active: school.id === activeSchoolId,
      learnedCount: groupSpells.filter(spell => spell.learned).length,
      totalCount: groupSpells.length,
      spells: groupSpells
    };
  });
  const learnedSpells = spells.filter(s => s.learned);
  const learnedRites = rites.filter(r => r.learned);
  return {
    state,
    schools,
    rites,
    learnedRites,
    hasLearnedRites: learnedRites.length > 0,
    spellGroups,
    learnedSpells,
    hasLearnedSpells: learnedSpells.length > 0,
    freeMode: GT.druidLearningFree(),
    itemSync: GT.druidCreateSpellItems()
  };
};

GT.openDruidRiteTree = async function(actor) {
  await GT.getDruidArtsScaffold();
  return new GothicTalesDruidRiteTreeDialog(actor).render(true);
};




GT.professionTalentSystem = function(system = {}) {
  return {...system, talentTree: system.professions ?? {learned: {}, uses: {}}};
};

GT.learnedProfessionEntries = function(system = {}, scaffold = GT._professionScaffold) {
  const learnedRoot = system.professions?.learned ?? {};
  const groupRanks = !!GT.setting("rankAsSingleProfession");
  const entries = [];
  const byGroup = new Map();
  for (const tree of scaffold?.trees ?? []) {
    const learnedTree = learnedRoot[tree.id] ?? {};
    for (const node of tree.nodes ?? []) {
      if (!learnedTree[node.id]) continue;
      if (!groupRanks) {
        entries.push({tree, node});
        continue;
      }
      const group = String(node.rankGroup || node.id);
      const rank = Number(node.rank || 0);
      const existing = byGroup.get(group);
      if (!existing || rank > Number(existing.node.rank || 0)) byGroup.set(group, {tree, node});
    }
  }
  return groupRanks ? Array.from(byGroup.values()) : entries;
};

GT.learnedProfessionCount = function(system = {}, scaffold = GT._professionScaffold) {
  return GT.learnedProfessionEntries(system, scaffold).length;
};

GT.actorBestProfessionEntry = function(actor, rankGroupOrId, scaffold = GT._professionScaffold) {
  const target = String(rankGroupOrId || "");
  const learnedRoot = actor?.system?.professions?.learned ?? {};
  let best = null;
  for (const tree of scaffold?.trees ?? []) {
    const learnedTree = learnedRoot[tree.id] ?? {};
    for (const node of tree.nodes ?? []) {
      if (!learnedTree[node.id]) continue;
      const group = String(node.rankGroup || node.id);
      if (node.id !== target && group !== target) continue;
      const rank = Number(node.rank || 0);
      if (!best || rank > Number(best.node.rank || 0)) best = {tree, node};
    }
  }
  return best;
};

GT.actorHasProfession = function(actor, nodeIdOrGroup) {
  const target = String(nodeIdOrGroup || "");
  const learned = actor?.system?.professions?.learned ?? {};
  for (const nodes of Object.values(learned)) if (nodes?.[target]) return true;
  return !!GT.actorBestProfessionEntry(actor, target);
};

GT.professionAttributeText = function(node = {}) {
  const attrs = Array.isArray(node.attributes) ? node.attributes : [];
  return attrs.map(a => GT.CONFIG.attributes?.[a] || a).join(" & ") || "Keine Attribute";
};

GT.professionFormula = function(actor, node = {}) {
  const attrs = Array.isArray(node.attributes) ? node.attributes : [];
  const a = attrs[0] || "ge";
  const b = attrs[1] || a;
  const av = Number(actor?.system?.attributes?.[a]?.value ?? 10);
  const bv = Number(actor?.system?.attributes?.[b]?.value ?? av);
  const value = Math.floor((av + bv) / 2);
  const derived = GT.attrFromValue(value);
  return `w20 + ${derived.die}${Number(derived.bonus || 0) ? ` + ${Number(derived.bonus || 0)}` : ""}`;
};

GT.actorSkillFormulaByKey = function(actor, key) {
  const skill = actor?.system?.skills?.[key];
  if (skill?.formula) return skill.formula;
  const pair = GT.CONFIG.skillAttributes?.[key] ?? ["ge", "erf"];
  const av = Number(actor?.system?.attributes?.[pair[0]]?.value ?? 10);
  const bv = Number(actor?.system?.attributes?.[pair[1]]?.value ?? av);
  const value = Math.floor((av + bv) / 2);
  const derived = GT.attrFromValue(value);
  return `w20 + ${derived.die}${Number(derived.bonus || 0) ? ` + ${Number(derived.bonus || 0)}` : ""}`;
};

GT.actorProfessionCards = function(actor, system = {}, scaffold = GT._professionScaffold) {
  return GT.learnedProfessionEntries(system, scaffold).map(({tree, node}) => ({
    treeId: tree.id,
    nodeId: node.id,
    label: node.label,
    summary: node.summary || "",
    descriptionHtml: node.descriptionHtml || GT.talentDescriptionHtml(node.description || ""),
    mechanics: node.mechanics || [],
    tables: node.tables || [],
    special: node.special || "",
    formula: GT.professionFormula(actor, node),
    attributeText: GT.professionAttributeText(node),
    anchorId: `gt-profession-${tree.id}-${node.id}`
  }));
};

GT.findProfessionNode = async function(treeId, nodeId) {
  const data = await GT.getProfessionScaffold();
  const tree = data.trees.find(t => t.id === treeId) || data.trees[0];
  const node = tree?.nodes.find(n => n.id === nodeId);
  return {data, tree, node};
};

GT.toggleProfessionLearned = async function(actor, treeId, nodeId) {
  const {data, tree, node} = await GT.findProfessionNode(treeId, nodeId);
  if (!tree || !node) return ui.notifications.warn("Beruf nicht gefunden.");
  if (actor.system?.sheetLocked) return ui.notifications.warn("Der Charakterbogen ist gesperrt.");

  const path = `professions.learned.${tree.id}.${node.id}`;
  const isLearned = !!getProperty(actor.system, path);
  const isCharacter = actor.type === "character";
  const cost = isCharacter ? Number(node.lpCost || 0) : 0;
  const lp = Number(actor.system?.lp?.value ?? 0);
  const update = {};

  if (isLearned) {
    const ok = await GT.confirm({title: "Beruf verlernen", content: `<p><strong>${GT.escape(node.label)}</strong> wirklich verlernen?</p>`, yesLabel: "Verlernen", noLabel: "Abbrechen"});
    if (!ok) return false;
    update[`system.${path}`] = false;
    if (isCharacter) update["system.lp.value"] = lp + cost;
    await actor.update(update);
    actor.sheet?.render(false);
    return true;
  }

  const learnedTree = getProperty(actor.system, `professions.learned.${tree.id}`) ?? {};
  const reqsMet = (node.requires ?? []).every(r => learnedTree[r]);
  if (!reqsMet) return ui.notifications.warn("Voraussetzungen sind noch nicht erfüllt.");

  const group = String(node.rankGroup || node.id);
  const groupAlreadyLearned = !!GT.setting("rankAsSingleProfession") && (tree.nodes ?? []).some(other => String(other.rankGroup || other.id) === group && !!learnedTree[other.id]);
  const learnedCount = GT.learnedProfessionCount(actor.system, data);
  const professionLimitMode = String(GT.setting("professionLimitMode") || "warn");
  if (!groupAlreadyLearned && learnedCount >= 3 && professionLimitMode === "block") {
    return ui.notifications.warn("Maximal 3 Berufe sind erlaubt. Diese Grenze kann in den Gothic-Tales-Systemeinstellungen geändert werden.");
  }
  if (!groupAlreadyLearned && learnedCount >= 3 && professionLimitMode === "warn") {
    const okLimit = await GT.confirm({
      title: "Mehr als 3 Berufe",
      content: `<p>Normalerweise sind maximal <strong>3 Berufe</strong> erlaubt.</p><p>Dieser Charakter hat bereits ${learnedCount} Berufe gelernt. Trotzdem lernen?</p>`,
      yesLabel: "Trotzdem lernen",
      noLabel: "Abbrechen"
    });
    if (!okLimit) return false;
  }

  if (isCharacter && lp < cost) return ui.notifications.warn("Nicht genug Lernpunkte.");

  const okTeacher = await GT.confirm({
    title: "Lehrer oder Lernmoment",
    content: `<p><strong>${GT.escape(node.label)}</strong> benötigt einen Lehrer oder einen passenden Lernmoment.</p><p>${cost ? `Kosten: <strong>${cost} LP</strong>.` : "Kosten: frei."}</p><p>Beruf lernen?</p>`,
    yesLabel: "Lernen",
    noLabel: "Abbrechen"
  });
  if (!okTeacher) return false;

  update[`system.${path}`] = true;
  if (isCharacter) update["system.lp.value"] = lp - cost;
  await actor.update(update);
  actor.sheet?.render(false);
  return true;
};

GT.openProfessionDetail = function(actor, treeId, nodeId) {
  if (!actor) return ui.notifications.warn("Kein Charakter ausgewählt.");
  new GothicTalesProfessionDetail(actor, treeId, nodeId).render(true);
};

GT.professionMacroText = function(options = {}) {
  const switches = (options.switches ?? ["left", "right", "left"]).map(s => String(s || "left"));
  const difficulty = Number(options.difficulty || 15);
  const hideCount = !!options.hideCount;
  const userId = String(options.userId || "");
  return `game.gothicTales.professions.lockpicking.open({\n  difficulty: ${difficulty},\n  hideCount: ${hideCount},\n  switches: ${JSON.stringify(switches)},\n  userId: ${JSON.stringify(userId)}\n});`;
};

GT.lockpickingOnlineUsers = function(selected = "") {
  return Array.from(game.users ?? [])
    .filter(u => u.active && !u.isGM)
    .map(u => ({id: u.id, name: u.name, selected: u.id === selected}));
};

GT.startLockpickingSession = function(options = {}) {
  if (!game.user?.isGM) return ui.notifications.warn("Nur der Spielleiter kann ein Schloss vorbereiten.");
  const userId = String(options.userId || "");
  const target = game.users?.get?.(userId);
  if (!target?.active) return ui.notifications.warn("Der gewählte Spieler ist nicht aktiv.");
  const switches = (options.switches ?? []).map(s => String(s || "left") === "right" ? "right" : "left");
  if (!switches.length) return ui.notifications.warn("Es wurde keine Schalterfolge festgelegt.");
  const payload = {
    type: "lockpickingStart",
    userId,
    session: {
      id: foundry?.utils?.randomID?.() || String(Date.now()),
      gmId: game.user.id,
      difficulty: Number(options.difficulty || 10),
      hideCount: !!options.hideCount,
      switches
    }
  };
  game.socket?.emit?.("system.gothic-tales", payload);
  GT.handleSocketMessage(payload);
  ui.notifications.info(`Schlösserknacken an ${target.name} gesendet.`);
};

GT.handleSocketMessage = function(payload = {}) {
  GT.debug("Socket-Nachricht", payload);
  if (!payload) return;
  if (payload.type === "initiativeRequest" && payload.userIds?.includes?.(game.user?.id)) return GT.openInitiativeDialog(payload);
  if (payload.type === "initiativeChoice" && game.user?.isGM && payload.gmUserId === game.user.id) return GT.resolveInitiativeChoice(payload);
  if (payload.userId !== game.user?.id) return;
  const actor = game.user.character ?? canvas?.tokens?.controlled?.[0]?.actor;

  if (payload.type === "lockpickingStart") {
    if (!actor) return ui.notifications.warn("Schlösserknacken: Kein Spielercharakter zugewiesen.");
    new GothicTalesLockpickingPlayerDialog(actor, payload.session).render(true);
  }

  if (payload.type === "hagglingStart") {
    if (!actor) return ui.notifications.warn("Feilschen: Kein Spielercharakter zugewiesen.");
    new GothicTalesHagglingPlayerDialog(actor, payload.session).render(true);
  }

  if (payload.type === "pickpocketingStart") {
    if (!actor) return ui.notifications.warn("Taschendiebstahl: Kein Spielercharakter zugewiesen.");
    new GothicTalesPickpocketingPlayerDialog(actor, payload.session).render(true);
  }

  if (payload.type === "herbalismStart") {
    if (!actor) return ui.notifications.warn("Kräuterkunde: Kein Spielercharakter zugewiesen.");
    new GothicTalesHerbalismPlayerDialog(actor, payload.session).render(true);
  }

  if (payload.type === "miningStart") {
    if (!actor) return ui.notifications.warn("Schürfen: Kein Spielercharakter zugewiesen.");
    new GothicTalesMiningPlayerDialog(actor, payload.session).render(true);
  }

  if (payload.type === "alchemyStart") {
    if (!actor) return ui.notifications.warn("Alchemie: Kein Spielercharakter zugewiesen.");
    new GothicTalesAlchemyPlayerDialog(actor, payload.session).render(true);
  }

  if (payload.type === "smithingStart") {
    if (!actor) return ui.notifications.warn("Schmiedekunst: Kein Spielercharakter zugewiesen.");
    new GothicTalesSmithingPlayerDialog(actor, payload.session).render(true);
  }

  if (payload.type === "carvingStart") {
    if (!actor) return ui.notifications.warn("Schnitzkunst: Kein Spielercharakter zugewiesen.");
    new GothicTalesCarvingPlayerDialog(actor, payload.session).render(true);
  }

  if (payload.type === "miningReset") {
    if (!actor) return ui.notifications.warn("Schürfen: Kein Spielercharakter zugewiesen.");
    GT.resetMiningState(actor, {timer: true, successes: true});
    ui.notifications.info("Schürfen-Zähler und Timer wurden zurückgesetzt.");
  }

  if (payload.type === "herbalismReset") {
    if (!actor) return ui.notifications.warn("Kräuterkunde: Kein Spielercharakter zugewiesen.");
    GT.resetHerbalismState(actor, {timer: true, successes: true});
    ui.notifications.info("Kräuterkunde-Zähler und Timer wurden zurückgesetzt.");
  }
};

GT.consumeLockpick = async function(actor) {
  const items = Array.from(actor?.items ?? []);
  const item = items.find(i => /dietrich/i.test(i.name || "") && Number(i.system?.quantity ?? 1) > 0);
  if (!item) {
    const ok = await GT.confirm({
      title: "Kein Dietrich gefunden",
      content: "<p>Im Inventar wurde kein Gegenstand mit dem Namen „Dietrich“ gefunden.</p><p>Trotzdem einen neuen Versuch starten?</p>",
      yesLabel: "Trotzdem",
      noLabel: "Abbrechen"
    });
    return ok;
  }
  const qty = Number(item.system?.quantity ?? 1);
  if (qty > 1) await item.update({"system.quantity": qty - 1});
  else await item.delete();
  ui.notifications.info(`Ein Dietrich wurde verbraucht (${item.name}).`);
  return true;
};

GT.lockpickingFormulaOptions = function(actor) {
  const learned = GT.actorHasProfession(actor, "schloesserknacken");
  if (learned) {
    const node = GT._professionScaffold?.trees?.flatMap(t => t.nodes ?? [])?.find(n => n.id === "schloesserknacken");
    return {formula: GT.professionFormula(actor, node || {attributes: ["ge", "erf"]}), label: "Schlösserknacken", rollOptions: {}, summary: "Beruf gelernt"};
  }
  return {formula: GT.actorSkillFormulaByKey(actor, "gewandtheit"), label: "Gewandtheit", advantageMode: "disadvantage", advantageLevel: 3, summary: "Ohne Schlösserknacken: großer Nachteil"};
};

GT.magicCircleTalentSystem = function(system = {}) {
  return {...system, talentTree: system.magicCircles ?? {learned: {}, uses: {}}};
};

GT.actorMagicCircleCards = function(actor, system = {}, scaffold = GT._magicCircleScaffold) {
  const tempSystem = GT.magicCircleTalentSystem(system);
  return GT.actorTalentCards(actor, tempSystem, [], scaffold).map(card => ({...card, source: "magic", category: card.category || "Magiekreise"}));
};

GT.magicCircleDiceConfig = function(node = {}) {
  const raw = node.magicDice ?? node.dice ?? node.magic?.dice ?? [];
  const dice = Array.isArray(raw) ? raw : String(raw || "").split(/[ ,;]+/);
  return dice.map(d => String(d || "").trim().toLowerCase().replace(/^d/, "w")).filter(Boolean).slice(0, 4);
};

GT.currentMagicCircleNode = function(system = {}, scaffold = GT._magicCircleScaffold) {
  const learnedRoot = system.magicCircles?.learned ?? {};
  let best = null;
  for (const [treeIndex, tree] of (scaffold?.trees ?? []).entries()) {
    const learnedTree = learnedRoot[tree.id] ?? {};
    for (const [nodeIndex, node] of (tree.nodes ?? []).entries()) {
      if (!learnedTree[node.id]) continue;
      const rankGroup = String(node.rankGroup || "").toLowerCase();
      const isCircle = rankGroup === "magiekreis" || String(node.id || "").startsWith("kreis-");
      if (!isCircle) continue;
      const rank = GT.talentRankValue(node, nodeIndex);
      const entry = {tree, node, treeIndex, nodeIndex, rank};
      if (!best || rank > best.rank || (rank === best.rank && nodeIndex > best.nodeIndex)) best = entry;
    }
  }
  return best;
};

GT.currentMagicDiceNode = function(system = {}, scaffold = GT._magicCircleScaffold) {
  const learnedRoot = system.magicCircles?.learned ?? {};
  let best = null;
  for (const [treeIndex, tree] of (scaffold?.trees ?? []).entries()) {
    const learnedTree = learnedRoot[tree.id] ?? {};
    for (const [nodeIndex, node] of (tree.nodes ?? []).entries()) {
      if (!learnedTree[node.id]) continue;
      const dice = GT.magicCircleDiceConfig(node);
      if (!dice.length) continue;
      const rank = GT.talentRankValue(node, nodeIndex);
      const entry = {tree, node, treeIndex, nodeIndex, rank, dice};
      if (!best || rank > best.rank || (rank === best.rank && nodeIndex > best.nodeIndex)) best = entry;
    }
  }
  return best;
};

GT.magicCircleDiceForSystem = function(system = {}, scaffold = GT._magicCircleScaffold) {
  const current = GT.currentMagicDiceNode(system, scaffold);
  return current ? current.dice : [];
};

GT.magicCircleSlots = function(system = {}, scaffold = GT._magicCircleScaffold) {
  const dice = GT.magicCircleDiceForSystem(system, scaffold);
  const stored = system.magicCircles?.dice ?? {};
  return [0, 1, 2, 3].map(index => {
    const entry = stored[index] ?? {};
    const die = String(entry.die || dice[index] || "").trim();
    const hasResult = entry.result !== undefined && entry.result !== null && entry.result !== "";
    const used = !!entry.used && hasResult;
    return {
      index,
      die,
      active: !!dice[index],
      filled: !!die && hasResult,
      used,
      result: hasResult ? entry.result : "",
      label: die ? die.toUpperCase() : "—"
    };
  });
};

GT.rollMagicDie = function(die) {
  const formula = String(die || "w4").toLowerCase().replace(/^d/, "w");
  const result = GT.rollGT(formula);
  const rolled = result.dice?.[0]?.result ?? result.total;
  return {die: formula, result: rolled};
};

GT.rollAllMagicCircleDice = async function(actor) {
  const scaffold = await GT.getMagicCircleScaffold();
  const source = GT.actorSystemSource(actor);
  source.magicCircles ??= {learned: {}, uses: {}, dice: {}};
  const dice = GT.magicCircleDiceForSystem(source, scaffold);
  if (!dice.length) return ui.notifications.warn("Es ist noch kein Zauberwürfel gelernt.");
  const slots = {};
  dice.slice(0, 4).forEach((die, index) => { slots[index] = {...GT.rollMagicDie(die), used: false}; });
  source.magicCircles.dice = slots;
  await actor.update({"system.magicCircles.dice": slots});
  ui.notifications.info("Magiekreis-Würfel wurden geworfen.");
};

GT.rerollMagicCircleDie = async function(actor, index) {
  const source = GT.actorSystemSource(actor);
  const dice = source.magicCircles?.dice ?? {};
  const entry = dice[index];
  if (!entry?.die) return ui.notifications.warn("Dieser Platz enthält keinen aktiven Magiewürfel.");
  dice[index] = {...GT.rollMagicDie(entry.die), used: false};
  await actor.update({"system.magicCircles.dice": dice});
};

GT.useMagicCircleDie = async function(actor, index) {
  const source = GT.actorSystemSource(actor);
  const dice = source.magicCircles?.dice ?? {};
  const entry = dice[index];
  if (!entry?.die || entry.result === undefined || entry.result === null || entry.result === "") {
    return ui.notifications.warn("Dieser Magiewürfel wurde noch nicht geworfen.");
  }
  if (entry.used) return ui.notifications.warn("Dieser Magiewürfel wurde bereits benutzt. Du kannst ihn nur neu würfeln.");
  dice[index] = {...entry, used: true};
  await actor.update({"system.magicCircles.dice": dice});
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({actor}),
    content: GT.magicCircleDieUsedChatContent(actor, dice[index], Number(index || 0))
  });
};

GT.magicCircleDieUsedChatContent = function(actor, entry = {}, index = 0) {
  const die = String(entry.die || "").toUpperCase() || "Würfel";
  const result = entry.result ?? "—";
  const actorName = actor?.name || "Magiewirker";
  return `<div class="gothic-tales chat-card gt-magic-die-used-chat-card">
    <header class="gt-magic-die-chat-header">
      <div>
        <div class="gt-magic-die-chat-kicker">Zauberwürfel benutzt</div>
        <h2><i class="fas fa-sparkles"></i> ${GT.escape(actorName)}</h2>
        <p>Ein vorbereiteter Zauberwürfel wurde für eine Zauberhandlung eingesetzt.</p>
      </div>
    </header>
    <div class="gt-magic-die-chat-meta">
      <span>Ergebnis ${GT.escape(result)}</span>
      <span>${GT.escape(die)}</span>
      <span>Feld ${Number(index) + 1}</span>
    </div>
    <div class="gt-magic-die-chat-body">
      <p>Der Zauberwürfel wurde erfolgreich eingesetzt und als benutzt markiert.</p>
      <p class="gt-chat-note">Der Zauberwürfel ist nun verbraucht und kann bei Bedarf neu vorbereitet werden.</p>
    </div>
  </div>`;
};

GT.executeMagicCircleSkill = async function(actor, data = {}) {
  if (!actor?.isOwner) return ui.notifications.warn("Du hast keine Berechtigung, diesen Magiekreis auszuführen.");
  const scaffold = await GT.getMagicCircleScaffold();
  const found = GT.findTalentNode(data.treeId, data.nodeId, scaffold);
  if (!found) return ui.notifications.warn("Magiekreis-Daten nicht gefunden.");
  const {tree, node} = found;
  const circle = Number(String(node.id || "").match(/kreis-(\d+)/i)?.[1] || GT.talentRankValue(node, 0) || 0);
  const current = GT.currentMagicCircleNode(actor.system, scaffold);
  const prepared = GT.magicCircleSlots(actor.system, scaffold).filter(slot => slot.active);
  const card = {
    name: GT.talentDisplayLabel(node),
    treeLabel: tree.label,
    descriptionHtml: GT.talentDescriptionHtml(node.description || node.sourceDescription || ""),
    lpCostText: Number(node.lpCost || 0) ? `${node.lpCost} LP` : "frei / automatisch",
    requirementText: (node.requires || []).join(", ") || "Keine",
    attributeText: GT.talentAttributeRequirementText(node, actor) || "Keine",
    usageText: node.actionType || "Magiekreis-Fähigkeit",
    circleText: circle ? `Kreis ${circle}` : (current ? GT.talentDisplayLabel(current.node) : "Magiekreis"),
    diceText: prepared.map(slot => `${slot.label}${slot.filled ? `: ${slot.result}${slot.used ? " (benutzt)" : ""}` : ""}`).join(" · ") || "Keine vorbereiteten Magiewürfel",
    consumeText: "",
    remainingText: ""
  };
  await ChatMessage.create({speaker: ChatMessage.getSpeaker({actor}), content: GT.magicCircleChatContent(actor, card)});
};

GT.magicCircleChatContent = function(actor, card = {}) {
  const actorName = actor?.name || "Magiewirker";
  return `<div class="gothic-tales chat-card gt-magic-die-used-chat-card gt-magic-talent-chat-card">
    <header class="gt-magic-die-chat-header">
      <div>
        <div class="gt-magic-die-chat-kicker">Magiekreis-Talent angewandt</div>
        <h2><i class="fas fa-wand-sparkles"></i> ${GT.escape(card.name || "Magiekreis")}</h2>
        <p>${GT.escape(actorName)} nutzt Wissen aus ${GT.escape(card.treeLabel || "einem Magiekreis")}.</p>
      </div>
    </header>
    <div class="gt-magic-die-chat-meta gt-magic-talent-meta">
      <span>${GT.escape(card.circleText || "Magiekreis")}</span>
      <span>${GT.escape(card.usageText || "Fähigkeit")}</span>
      <span>Attribute: ${GT.escape(card.attributeText || "Keine")}</span>
      <span>Voraussetzung: ${GT.escape(card.requirementText || "Keine")}</span>
    </div>
    <div class="gt-magic-die-chat-body gt-magic-talent-body">
      <div class="gt-magic-talent-dice"><i class="fas fa-dice"></i><span>${GT.escape(card.diceText || "Keine vorbereiteten Magiewürfel")}</span></div>
      <section class="gt-magic-talent-description">${card.descriptionHtml || ""}</section>
      <p class="gt-chat-note">Die vorbereiteten Magiewürfel werden wie gewohnt separat eingesetzt und als benutzt markiert.</p>
    </div>
  </div>`;
};


/** Erzeugt Gegenstandsdaten für Startpakete aus Quellitems, Spruchrollenmodi oder speziellen Wasserschläuchen. */
GT.itemFromSource = async function(name, quantity = 1, mode = "normal") {
  const list = await GT.getRumpelkammerItems();
  const exact = String(name || "").toLowerCase();
  let entry = list.find(i => i.name.toLowerCase() === exact);
  if (!entry) entry = list.find(i => i.name.toLowerCase().includes(exact) || exact.includes(i.name.toLowerCase()));
  if (entry) {
    const type = mode === "scroll" ? "spell" : entry.type;
    const data = deepClone(entry);
    let itemName = entry.name;
    if (mode === "scroll" && !itemName.startsWith("Spruchrolle")) itemName = `Spruchrolle – ${entry.name}`;
    return {
      name: itemName,
      type,
      img: data.img || data.image || data.sourceImage || GT.itemImage(type, itemName, data.category || data.folderCategory || ""),
      system: {
        ...data,
        quantity,
        description: GT.formatItemDescription(data),
        properties: mode === "scroll" ? `${data.properties || ""}${data.properties ? ", " : ""}Spruchrolle` : data.properties || "",
        uses: {value: quantity, max: quantity},
        equipped: false
      },
      flags: {"gothic-tales": {sourceBook: data.sourceBook, sourcePage: data.sourcePage, importedName: entry.name}}
    };
  }
  if (mode === "custom-water-full") {
    return {name: "Wasserschlauch (3/3)", type: "consumable", img: GT.itemImage("consumable", "Wasserschlauch"), system: {quantity, category: "Essen & Trinken", description: "<p>Gefüllter Wasserschlauch mit drei Portionen Wasser.</p>", value: "", uses: {value: 3, max: 3}}};
  }
  if (name === "Wasserschlauch") return {name: "Wasserschlauch (2/3)", type: "consumable", img: GT.itemImage("consumable", "Wasserschlauch"), system: {quantity, category: "Essen & Trinken", description: "<p>Wasserschlauch mit zwei von drei Portionen Wasser.</p>", uses: {value: 2, max: 3}}};
  return {name, type: "equipment", img: GT.itemImage("equipment", name), system: {quantity, category: "Kram", description: "<p>Startausrüstung.</p>"}};
};

GT.itemsFromPackage = async function(packageId) {
  const pack = GT.START_PACKAGES.find(p => p.id === packageId) ?? GT.START_PACKAGES[0];
  const docs = [];
  docs.push({name: "Zerschlissene Kleidung", type: "armor", img: GT.itemImage("armor", "Zerschlissene Kleidung"), system: {category: "Startausrüstung", rk: 0, ele: 0, ma: 0, description: "<p>Einfache, zerschlissene Kleidung.</p>"}});
  docs.push(await GT.itemFromSource("Ration / Nahrung", 1));
  docs.push(await GT.itemFromSource("Wasserschlauch", 1));
  for (const [name, qty, mode] of pack.items) docs.push(await GT.itemFromSource(name, qty, mode));
  return docs;
};


GT.actorTalentCards = function(actor, system = {}, itemList = [], scaffold = GT._talentScaffold) {
  const cards = [];
  const learned = system.talentTree?.learned ?? {};
  const pools = GT.talentUsePoolsForSystem(system, scaffold);

  const addTreeCard = (tree, node) => {
    const key = GT.talentKey(tree.id, node.id);
    const uses = GT.talentUsesConfig(node);
    const poolKey = GT.talentUsePoolKey(tree.id, node);
    const pool = pools[poolKey] ?? (uses.max ? {key: poolKey, max: uses.max, label: uses.poolLabel || GT.talentDisplayLabel(node), sourceName: GT.talentDisplayLabel(node)} : null);
    const consume = GT.talentConsumeConfig(node, tree.id);
    const spendKey = GT.talentConsumePoolKey(consume, scaffold) || (uses.max ? poolKey : "");
    const spendPool = spendKey ? (pools[spendKey] ?? pool) : null;
    const spendMax = spendPool?.max || (spendKey === poolKey ? uses.max : GT.talentUseMaxForKey(spendKey, scaffold, system));
    const ownMax = pool?.max || uses.max;
    const ownCurrent = ownMax ? GT.talentUseValue(system, poolKey, ownMax) : 0;
    const spendCurrent = spendKey ? GT.talentUseValue(system, spendKey, spendMax) : ownCurrent;
    const descriptionRaw = node.description || node.sourceDescription || "";
    const descriptionText = GT.talentPlainDescription(descriptionRaw);
    const descriptionHtml = GT.talentDescriptionHtml(descriptionRaw);
    const attrText = GT.talentAttributeRequirementText(node, actor);
    const reqText = (node.requires || []).join(", ");
    const lpCostText = Number(node.lpCost || 0) ? `${node.lpCost} LP` : "frei / automatisch";
    const poolLabel = pool?.label || uses.poolLabel || GT.talentDisplayLabel(node);
    const spendLabel = spendPool?.label || (consume.key ? consume.key : poolLabel);
    const usageText = spendKey && (consume.amount || uses.max)
      ? `${spendCurrent}/${spendMax || 0} ${spendLabel}`
      : "keine Begrenzung";
    const consumeText = consume.amount && spendKey ? `${consume.amount} Anwendung von ${spendLabel}` : (uses.max ? `verbraucht ${poolLabel}` : "");
    const needed = Number(consume.amount || (uses.max ? 1 : 0));
    const category = GT.talentCategoryLabel(tree, node);
    const card = {
      source: "tree",
      key,
      poolKey,
      treeId: tree.id,
      nodeId: node.id,
      name: GT.talentDisplayLabel(node),
      treeLabel: tree.label,
      category,
      poolLabel,
      descriptionText,
      descriptionHtml,
      lpCostText,
      requirementText: reqText,
      attributeText: attrText,
      usageText,
      consumeText,
      usesCurrent: spendKey ? spendCurrent : ownCurrent,
      usesMax: spendKey ? spendMax : ownMax,
      usesLimited: !!(uses.max || spendKey),
      canExecute: !(uses.max || spendKey) || Number(spendCurrent) >= needed,
      executeLabel: (uses.max || spendKey) ? "Ausführen" : "In Chat posten"
    };
    card.tooltip = GT.talentDetailsHtml(card);
    cards.push(card);
  };

  const bestByGroup = new Map();
  for (const [treeIndex, tree] of (scaffold?.trees ?? []).entries()) {
    const learnedTree = learned?.[tree.id] ?? {};
    for (const [nodeIndex, node] of (tree.nodes ?? []).entries()) {
      if (!learnedTree[node.id]) continue;
      const groupKey = GT.talentRankGroupKey(tree.id, node);
      const rank = GT.talentRankValue(node, nodeIndex);
      const candidate = {tree, node, treeIndex, nodeIndex, groupKey, rank};
      const current = bestByGroup.get(groupKey);
      if (!current || candidate.rank > current.rank || (candidate.rank === current.rank && candidate.nodeIndex > current.nodeIndex)) {
        bestByGroup.set(groupKey, candidate);
      }
    }
  }

  const selectedTreeTalents = Array.from(bestByGroup.values())
    .sort((a, b) => a.treeIndex - b.treeIndex || a.nodeIndex - b.nodeIndex);
  for (const entry of selectedTreeTalents) addTreeCard(entry.tree, entry.node);

  const knownTreeKeys = new Set(cards.map(c => c.key));
  for (const item of itemList ?? []) {
    if (item.type !== "talent") continue;
    const treeId = String(item.system?.treeId || "");
    const nodeId = String(item.system?.nodeId || "");
    const key = treeId && nodeId ? GT.talentKey(treeId, nodeId) : `item.${item.id}`;
    if (knownTreeKeys.has(key)) continue;
    const max = Number(item.system?.uses?.max || 0);
    const current = Number(item.system?.uses?.value ?? max ?? 0);
    const consumeKey = String(item.system?.consumePoolKey || item.system?.consumeTalentKey || "").trim();
    const consumeAmount = Number(item.system?.consumeAmount || 0);
    const consumeMax = consumeKey ? GT.talentUseMaxForKey(consumeKey, scaffold, system) : max;
    const consumeCurrent = consumeKey ? GT.talentUseValue(system, consumeKey, consumeMax) : current;
    const descriptionText = GT.talentPlainDescription(item.system?.description || item.system?.sourceText || "");
    const category = String(item.system?.category || item.system?.treeLabel || "Talent-Items").trim() || "Talent-Items";
    const card = {
      source: "item",
      itemId: item.id,
      key,
      poolKey: item.system?.usesPool || key,
      name: item.name,
      treeLabel: category,
      category,
      poolLabel: item.system?.usesPoolLabel || item.name,
      descriptionText,
      descriptionHtml: GT.normalizeHtml(item.system?.description || GT.textToHtml(descriptionText)),
      lpCostText: Number(item.system?.lpCost || 0) ? `${item.system.lpCost} LP` : "",
      requirementText: item.system?.requirements || "",
      attributeText: GT.talentAttributeRequirementText(item.system || {}, actor),
      usageText: consumeKey && consumeAmount ? `${consumeCurrent}/${consumeMax || 0} ${consumeKey}` : (max ? `${current}/${max}` : "keine Begrenzung"),
      consumeText: consumeKey && consumeAmount ? `${consumeAmount} Anwendung von ${consumeKey}` : "",
      usesCurrent: consumeKey ? consumeCurrent : current,
      usesMax: consumeKey ? consumeMax : max,
      usesLimited: !!(max || consumeKey),
      canExecute: !(consumeKey || max) || Number(consumeKey ? consumeCurrent : current) >= Number(consumeAmount || (max ? 1 : 0)),
      executeLabel: (consumeKey || max) ? "Ausführen" : "In Chat posten"
    };
    card.tooltip = GT.talentDetailsHtml(card);
    cards.push(card);
  }
  return cards.sort((a, b) => String(a.category || a.treeLabel).localeCompare(String(b.category || b.treeLabel), "de") || String(a.name).localeCompare(String(b.name), "de"));
};

GT.rechargeTalentUses
GT.rechargeTalentUses = async function(actor, {mode = "combatEnd"} = {}) {
  if (!actor) return [];
  const scaffold = await GT.getTalentScaffold();
  const source = GT.actorSystemSource(actor);
  source.talentTree ??= {learned: {}, uses: {}};
  source.talentTree.learned ??= {};
  source.talentTree.uses ??= {};
  const messages = [];
  const pools = GT.talentUsePoolsForSystem(source, scaffold);
  for (const [poolKey, pool] of Object.entries(pools)) {
    if (!pool.max) continue;
    source.talentTree.uses[poolKey] = pool.max;
    messages.push(`${pool.label} ${pool.max}/${pool.max}`);
  }
  await actor.update({"system.talentTree.uses": source.talentTree.uses});
  const itemUpdates = [];
  for (const item of actor.items ?? []) {
    if (item.type !== "talent") continue;
    const max = Number(item.system?.uses?.max || 0);
    const recovery = String(item.system?.usesRecovery || "combatEnd");
    if (max > 0 && recovery !== "none") {
      itemUpdates.push({_id: item.id, "system.uses.value": max});
      messages.push(`${item.name} ${max}/${max}`);
    }
  }
  if (itemUpdates.length) await actor.updateEmbeddedDocuments("Item", itemUpdates);
  return messages;
};

GT.talentChatContent
GT.talentChatContent = function(actor, card = {}) {
  const meta = [
    card.lpCostText ? {icon: "fa-coins", label: "Kosten", value: card.lpCostText} : null,
    card.requirementText ? {icon: "fa-link", label: "Voraussetzung", value: card.requirementText} : null,
    card.attributeText ? {icon: "fa-dumbbell", label: "Attribute", value: card.attributeText} : null,
    card.usageText ? {icon: "fa-hourglass-half", label: "Anwendungen", value: card.usageText} : null
  ].filter(Boolean).map(part => `
    <span class="gt-talent-chat-pill"><i class="fas ${part.icon}"></i><strong>${GT.escape(part.label)}:</strong> ${GT.escape(part.value)}</span>`).join("");

  const spend = card.consumeText || card.spendText || "";
  const footer = spend ? `
    <footer class="gt-talent-chat-footer">
      <span><i class="fas fa-bolt"></i><strong>Verbrauch:</strong> ${GT.escape(spend)}</span>
      ${card.remainingText ? `<span><i class="fas fa-battery-half"></i><strong>Verbleibend:</strong> ${GT.escape(card.remainingText)}</span>` : ""}
    </footer>` : (card.remainingText ? `
    <footer class="gt-talent-chat-footer">
      <span><i class="fas fa-battery-half"></i><strong>Verbleibend:</strong> ${GT.escape(card.remainingText)}</span>
    </footer>` : "");

  return `
    <div class="gothic-tales chat-card gt-talent-chat-card gt-talent-chat-card-v2">
      <header class="gt-talent-chat-header">
        <div class="gt-talent-chat-rune"><i class="fas fa-hand-sparkles"></i></div>
        <div class="gt-talent-chat-title">
          <div class="gt-talent-chat-kicker">Talent ausgeführt</div>
          <h2>${GT.escape(card.name || "Talent")}</h2>
          <div class="gt-talent-chat-subtitle">
            <span><i class="fas fa-user"></i>${GT.escape(actor?.name || "Unbekannter Actor")}</span>
            ${card.treeLabel ? `<span><i class="fas fa-sitemap"></i>${GT.escape(card.treeLabel)}</span>` : ""}
          </div>
        </div>
      </header>
      ${meta ? `<div class="gt-talent-chat-pills">${meta}</div>` : ""}
      <section class="gt-talent-chat-body">
        <h3><i class="fas fa-scroll"></i> Beschreibung</h3>
        <div class="gt-chat-description">${card.descriptionHtml || "<p>Keine Beschreibung hinterlegt.</p>"}</div>
      </section>
      ${footer}
    </div>`;
};

GT.executeTalent = async function(actor, data = {}) {
  if (!actor?.isOwner) return ui.notifications.warn("Du hast keine Berechtigung, dieses Talent auszuführen.");
  const scaffold = await GT.getTalentScaffold();
  let card = null;
  let updateActorUses = null;
  let updateItem = null;
  if (data.source === "tree") {
    const found = GT.findTalentNode(data.treeId, data.nodeId, scaffold);
    if (!found) return ui.notifications.warn("Talentdaten nicht gefunden.");
    const {tree, node} = found;
    const system = GT.actorSystemSource(actor);
    system.talentTree ??= {learned: {}, uses: {}};
    system.talentTree.uses ??= {};
    const uses = GT.talentUsesConfig(node);
    const pools = GT.talentUsePoolsForSystem(system, scaffold);
    const ownPoolKey = GT.talentUsePoolKey(tree.id, node);
    const ownPool = pools[ownPoolKey] ?? (uses.max ? {key: ownPoolKey, max: uses.max, label: uses.poolLabel || GT.talentDisplayLabel(node), recovery: uses.recovery} : null);
    const consume = GT.talentConsumeConfig(node, tree.id);
    const spendKey = GT.talentConsumePoolKey(consume, scaffold) || (uses.max ? ownPoolKey : "");
    const spendPool = spendKey ? (pools[spendKey] ?? ownPool) : null;
    const spendMax = spendPool?.max || (spendKey === ownPoolKey ? uses.max : GT.talentUseMaxForKey(spendKey, scaffold, system));
    const spendAmount = consume.amount || (uses.max ? 1 : 0);
    let consumeText = "";
    let remainingText = ownPool ? `${GT.talentUseValue(system, ownPoolKey, ownPool.max)}/${ownPool.max} ${ownPool.label}` : "";
    if (spendKey && spendAmount) {
      const current = GT.talentUseValue(system, spendKey, spendMax);
      if (current < spendAmount) return ui.notifications.warn("Nicht genug Talent-Anwendungen verfügbar.");
      const next = current - spendAmount;
      system.talentTree.uses[spendKey] = next;
      updateActorUses = system.talentTree.uses;
      const spentName = spendPool?.label || spendKey;
      consumeText = `${spendAmount} Anwendung von ${spentName}`;
      remainingText = `${next}/${spendMax || 0} ${spentName}`;
    }
    const reqText = (node.requires || []).join(", ");
    const attrText = GT.talentAttributeRequirementText(node, actor);
    const currentOwn = ownPool ? GT.talentUseValue(system, ownPoolKey, ownPool.max) : 0;
    card = {
      name: GT.talentDisplayLabel(node),
      treeLabel: tree.label,
      descriptionHtml: GT.talentDescriptionHtml(node.description || node.sourceDescription || ""),
      lpCostText: Number(node.lpCost || 0) ? `${node.lpCost} LP` : "frei / automatisch",
      requirementText: reqText,
      attributeText: attrText,
      usageText: ownPool ? `${currentOwn}/${ownPool.max} ${ownPool.label}` : "keine Begrenzung",
      consumeText,
      remainingText
    };
  } else if (data.source === "item") {
    const item = actor.items.get(data.itemId);
    if (!item) return ui.notifications.warn("Talent-Item nicht gefunden.");
    const consumeKey = String(item.system?.consumePoolKey || item.system?.consumeTalentKey || "").trim();
    const consumeAmount = Number(item.system?.consumeAmount || 0);
    const max = Number(item.system?.uses?.max || 0);
    const current = Number(item.system?.uses?.value ?? max ?? 0);
    let consumeText = "";
    let remainingText = max ? `${current}/${max}` : "";
    if (consumeKey && consumeAmount > 0) {
      const system = GT.actorSystemSource(actor);
      system.talentTree ??= {learned: {}, uses: {}};
      system.talentTree.uses ??= {};
      const consumeMax = GT.talentUseMaxForKey(consumeKey, scaffold, system);
      const consumeCurrent = GT.talentUseValue(system, consumeKey, consumeMax);
      if (consumeCurrent < consumeAmount) return ui.notifications.warn("Nicht genug Talent-Anwendungen verfügbar.");
      const next = consumeCurrent - consumeAmount;
      system.talentTree.uses[consumeKey] = next;
      updateActorUses = system.talentTree.uses;
      consumeText = `${consumeAmount} Anwendung von ${consumeKey}`;
      remainingText = `${next}/${consumeMax || 0} ${consumeKey}`;
    } else if (max > 0) {
      if (current < 1) return ui.notifications.warn("Keine Anwendungen dieses Talents mehr verfügbar.");
      const next = current - 1;
      updateItem = {_id: item.id, "system.uses.value": next};
      consumeText = "1 Anwendung";
      remainingText = `${next}/${max}`;
    }
    card = {
      name: item.name,
      treeLabel: item.system?.category || "Talent",
      descriptionHtml: GT.normalizeHtml(item.system?.description || item.system?.sourceText || ""),
      lpCostText: Number(item.system?.lpCost || 0) ? `${item.system.lpCost} LP` : "",
      requirementText: item.system?.requirements || "",
      attributeText: GT.talentAttributeRequirementText(item.system || {}, actor),
      usageText: consumeKey && consumeAmount ? `${remainingText}` : (max ? `${current}/${max}` : "keine Begrenzung"),
      consumeText,
      remainingText
    };
  }
  if (!card) return;
  if (updateActorUses) await actor.update({"system.talentTree.uses": updateActorUses});
  if (updateItem) await actor.updateEmbeddedDocuments("Item", [updateItem]);
  await ChatMessage.create({speaker: ChatMessage.getSpeaker({actor}), content: GT.talentChatContent(actor, card)});
};

/** Bereitet
/** Bereitet reine Bogenlisten, gruppierte Items und Anzeigenamen gelernter Talente für Handlebars-Templates vor. */
function enrichLists(data) {
  const system = data.system ?? {};
  data.attributeList = Object.entries(system.attributes ?? {}).map(([key, value]) => {
    const bonus = Number(value.bonus || 0);
    return {key, ...value, bonus, formula: `w20 + ${value.die || "w4"}${bonus ? ` + ${bonus}` : ""}`, kind: "attribute"};
  });
  data.skillList = Object.entries(system.skills ?? {}).map(([key, value]) => {
    const bonus = Number(value.bonus || 0);
    const formula = value.formula || `w20 + ${value.die || "w4"}${bonus ? ` + ${bonus}` : ""}`;
    return {key, ...value, bonus, formula, kind: "skill"};
  });
  const items = Array.from(data.items ?? []);
  data.itemGroups = GT.groupItems(items);
  data.combatGroups = {
    weapons: data.itemGroups.weapons,
    shields: data.itemGroups.shields,
    spells: data.itemGroups.spells,
    talents: data.itemGroups.talents
  };
  data.equippedGroups = GT.actorEquippedOverviewGroups(items);
  data.hasEquippedOverview = Object.values(data.equippedGroups).some(group => group.items.length);
  data.learnedTalentLabels = [];
  const learned = system.talentTree?.learned ?? {};
  const labelIndex = GT._talentLabelIndex ?? new Map();
  for (const [treeId, nodes] of Object.entries(learned)) {
    for (const [nodeId, value] of Object.entries(nodes ?? {})) if (value) data.learnedTalentLabels.push(labelIndex.get(`${treeId}.${nodeId}`) || `${treeId}: ${nodeId}`);
  }
  data.talentCards = GT.actorTalentCards(data.actor, system, items);
  data.talentCategories = GT.groupTalentCardsByCategory(data.talentCards);
  data.hasTalentCards = !!data.talentCards.length;
  data.hasTalentCategories = !!data.talentCategories.length;
  data.magicCircleCards = GT.actorMagicCircleCards(data.actor, system);
  data.magicCircleCategories = GT.groupTalentCardsByCategory(data.magicCircleCards);
  data.hasMagicCircleCategories = !!data.magicCircleCategories.length;
  data.professionCards = GT.actorProfessionCards(data.actor, system);
  data.hasProfessionCards = !!data.professionCards.length;
  data.professionCount = GT.learnedProfessionCount(system);
  data.druid = GT.actorDruidView(data.actor, system);
  data.hasDruidSpells = !!data.druid?.hasLearnedSpells;
  data.isGM = !!game.user?.isGM;
  data.magicCircleSlots = GT.magicCircleSlots(system);
  data.currentMagicCircle = GT.currentMagicCircleNode(system);
  data.currentMagicCircleLabel = data.currentMagicCircle ? GT.talentDisplayLabel(data.currentMagicCircle.node) : "Kein Magiekreis gelernt";
  data.currentMagicCircleDiceText = GT.magicCircleDiceForSystem(system).map(d => d.toUpperCase()).join(" · ") || "Keine Würfel";
  data.isCharacter = data.actor?.type === "character";
  data.isNpcOrMonster = data.actor?.type === "npc" || data.actor?.type === "monster";
  data.sheetLocked = !!system.sheetLocked;
  const ini = system.initiative ?? {};
  const iniBonus = Number(ini.bonus || 0);
  data.initiativeFormula = GT.initiativeFormula(data.actor);
  data.initiativeBonusText = `${iniBonus >= 0 ? "+" : ""}${iniBonus}`;
  data.levels = Object.entries(GT.LEVEL_RESOURCES).map(([level, r]) => ({level, lp: r.lp, erz: r.erz, selected: Number(level) === Number(system.stufe)}));
  return data;
}

/** Gothic-Tales-Initiative ohne W20. Würfe addieren Grundwert, Initiativwürfel und Bonus. */
GT.initiativeFormula = function(actor, {yieldDie = false} = {}) {
  const initiative = actor?.system?.initiative ?? {};
  const baseValue = Number(initiative.value ?? 0);
  const bonus = Number(initiative.bonus ?? 0);
  const die = String(initiative.die || "").trim();
  if (yieldDie) return String(bonus);
  const terms = [String(baseValue)];
  if (die) terms.push(`+ ${die}`);
  if (bonus) terms.push(`${bonus >= 0 ? "+" : "-"} ${Math.abs(bonus)}`);
  return terms.join(" ");
};

GT.initiativeModeLabel = function(mode, level = 0) {
  if (mode !== "advantage" && mode !== "disadvantage") return "Normal";
  return GT.advantageLabel(mode, level) || (mode === "advantage" ? "Vorteil" : "Nachteil");
};

const ApplicationV2 = foundry?.applications?.api?.ApplicationV2;
const HandlebarsApplicationMixin = foundry?.applications?.api?.HandlebarsApplicationMixin;
const ActorSheetV2 = foundry?.applications?.sheets?.ActorSheetV2;
const ItemSheetV2 = foundry?.applications?.sheets?.ItemSheetV2;
const BaseApplicationV2 = HandlebarsApplicationMixin ? HandlebarsApplicationMixin(ApplicationV2) : foundry?.appv1?.api?.Application;
const BaseActorSheet = HandlebarsApplicationMixin && ActorSheetV2 ? HandlebarsApplicationMixin(ActorSheetV2) : foundry?.appv1?.sheets?.ActorSheet;
const BaseItemSheet = HandlebarsApplicationMixin && ItemSheetV2 ? HandlebarsApplicationMixin(ItemSheetV2) : foundry?.appv1?.sheets?.ItemSheet;

GT.formDataObject = function(form) {
  const FormDataExtended = foundry?.applications?.ux?.FormDataExtended ?? globalThis.FormDataExtended;
  if (FormDataExtended) return new FormDataExtended(form).object;
  return Object.fromEntries(new FormData(form).entries());
};

/** Gemeinsame ApplicationV2-Basis mit V1-kompatiblem render(true)-Aufruf und jQuery-Listener-Brücke. */
class GothicTalesApplicationV2 extends BaseApplicationV2 {
  render(force = true, options = {}) {
    if (typeof force === "object") return super.render(force);
    return super.render({...options, force: true});
  }

  async _prepareContext(options) {
    const data = await this.getData(options);
    return data ?? {};
  }

  _onRender(context, options) {
    super._onRender(context, options);
    const html = globalThis.jQuery ? globalThis.jQuery(this.element) : this.element;
    this.activateListeners(html);
  }

  getData() { return {}; }
  activateListeners() {}
}

class GothicTalesDruidRiteChoiceDialog extends GothicTalesApplicationV2 {
  constructor(actor, rite) {
    super({window: {title: rite?.label || "Druidenritus"}, position: {width: 740, height: "auto"}});
    this.actor = actor;
    this.rite = rite;
  }
  static DEFAULT_OPTIONS = {
    classes: ["gothic-tales", "gt-app", "gt-v2-window", "gt-dialog-window", "gt-druid-rite-window"],
    window: {title: "Druidenritus", resizable: true},
    position: {width: 740}
  };
  static PARTS = {body: {template: "systems/gothic-tales/templates/dialog-druid-rite.hbs", scrollable: [".gt-druid-rite-dialog"]}};
  getData() { return GT.druidRiteDialogData(this.actor, this.rite); }
  activateListeners(html) {
    super.activateListeners(html);
    const root = GT.htmlRoot(html);
    root.querySelector(".gt-dialog-cancel")?.addEventListener("click", ev => { ev.preventDefault(); this.close(); });
    root.querySelector(".gt-druid-rite-apply")?.addEventListener("click", async ev => {
      ev.preventDefault();
      const schoolId = String(root.querySelector(".gt-druid-school-select")?.value || "");
      const spellIds = Array.from(root.querySelectorAll(".gt-druid-spell-select")).map(select => String(select.value || ""));
      await GT.druidApplyRite(this.actor, this.rite, {schoolId, spellIds});
      await this.close();
    });
  }
}

class GothicTalesDruidRiteTreeDialog extends GothicTalesApplicationV2 {
  constructor(actor, options = {}) {
    super(options);
    this.actor = actor;
  }
  static DEFAULT_OPTIONS = {
    id: "gothic-tales-druid-rite-tree",
    classes: ["gothic-tales", "gt-app", "gt-v2-window", "gt-talent-tree-window", "gt-druid-rite-tree-window"],
    window: {title: "Riten der Druiden", resizable: true},
    position: {width: 780, height: 760}
  };
  static PARTS = {body: {template: "systems/gothic-tales/templates/dialog-druid-rite-tree.hbs", scrollable: [".gt-druid-rite-tree-app"]}};
  async getData() {
    await GT.getDruidArtsScaffold();
    const druid = GT.actorDruidView(this.actor, this.actor.system);
    return {actor: this.actor, druid};
  }
  activateListeners(html) {
    super.activateListeners(html);
    const root = GT.htmlRoot(html);
    root.querySelectorAll(".gt-open-druid-rite").forEach(el => el.addEventListener("click", async ev => {
      ev.preventDefault();
      await GT.learnDruidRite(this.actor, ev.currentTarget.dataset.riteId);
      this.render(false);
    }));
    root.querySelectorAll(".gt-unlearn-druid-rite").forEach(el => el.addEventListener("click", async ev => {
      ev.preventDefault();
      await GT.unlearnDruidRite(this.actor, ev.currentTarget.dataset.riteId);
      this.render(false);
    }));
    root.querySelectorAll(".gt-druid-rite-node")
      .forEach(el => el.addEventListener("dblclick", async ev => {
        ev.preventDefault();
        const button = ev.currentTarget.querySelector(".gt-open-druid-rite:not(:disabled)");
        if (button) {
          await GT.learnDruidRite(this.actor, button.dataset.riteId);
          this.render(false);
        }
      }));
  }
}



/** ApplicationV2-Formularbasis als Ersatz für FormApplication. */
class GothicTalesFormApplicationV2 extends GothicTalesApplicationV2 {
  _onRender(context, options) {
    super._onRender(context, options);
    const element = this.element instanceof HTMLElement ? this.element : this.element?.[0];
    const form = element?.querySelector?.("form");
    if (!form) return;
    form.addEventListener("submit", async event => {
      event.preventDefault();
      const formData = GT.formDataObject(form);
      await this._updateObject(event, formData);
    });
  }

  async _updateObject() {}
}

/** Kleine ApplicationV2-Bestätigung als Ersatz für V1 Dialog.confirm. */
class GothicTalesConfirmDialog extends GothicTalesApplicationV2 {
  constructor(options = {}) {
    super({window: {title: options.title || "Gothic Tales"}, position: {width: 420, height: "auto"}});
    this.content = options.content || "";
    this.yesLabel = options.yesLabel || "Ja";
    this.noLabel = options.noLabel || "Nein";
    this._resolve = options.resolve || (() => {});
  }
  static DEFAULT_OPTIONS = {
    classes: ["gothic-tales", "gt-app", "gt-v2-window", "gt-dialog-window"],
    window: {title: "Gothic Tales", resizable: false},
    position: {width: 500}
  };
  static PARTS = {body: {template: "systems/gothic-tales/templates/dialog-confirm.hbs"}};
  getData() { return {content: this.content, yesLabel: this.yesLabel, noLabel: this.noLabel}; }
  activateListeners(html) {
    super.activateListeners(html);
    const root = GT.htmlRoot(html);
    root.querySelector(".gt-confirm-yes")?.addEventListener("click", async ev => { ev.preventDefault(); const resolve = this._resolve; this._resolve = null; resolve?.(true); await this.close(); });
    root.querySelector(".gt-confirm-no")?.addEventListener("click", async ev => { ev.preventDefault(); const resolve = this._resolve; this._resolve = null; resolve?.(false); await this.close(); });
  }
  async close(options) {
    if (this._resolve) { const resolve = this._resolve; this._resolve = null; resolve(false); }
    return super.close(options);
  }
}

GT.confirm = function(options = {}) {
  return new Promise(resolve => new GothicTalesConfirmDialog({...options, resolve}).render(true));
};

/** Dialog für kontrollierte Würfe: Vorteil/Nachteil, Zusatzbonus und weitere Würfel. */
class GothicTalesRollDialog extends GothicTalesApplicationV2 {
  constructor(options = {}) {
    super({window: {title: options.label || "Wurf vorbereiten"}, position: {width: 560, height: "auto"}});
    this.roll = {...options, formula: options.formula || "w20", label: options.label || "Gothic Tales Wurf"};
    this.rollState = {advantageMode: options.advantageMode || options.d20Mode || "none", advantageLevel: Number(options.advantageLevel || options.d20Level || 1), bonus: Number(options.bonus || 0), diceCounts: {2: 0, 4: 0, 6: 0, 8: 0, 10: 0, 12: 0, 20: 0}};
  }
  static DEFAULT_OPTIONS = {
    classes: ["gothic-tales", "gt-app", "gt-v2-window", "gt-dialog-window", "gt-roll-dialog-window"],
    window: {title: "Wurf vorbereiten", resizable: false},
    position: {width: 560}
  };
  static PARTS = {body: {template: "systems/gothic-tales/templates/dialog-roll.hbs"}};
  getData() {
    return {
      label: this.roll.label,
      formula: this.roll.formula,
      flavor: this.roll.flavor || "",
      diceButtons: [2, 4, 6, 8, 10, 12, 20].map(die => ({die, label: `W${die}`, count: Number(this.rollState.diceCounts[die] || 0)})),
      finalFormula: GT.rollDialogFormula(this.roll.formula, this.rollState.diceCounts, this.rollState.bonus),
      summary: GT.rollDialogSummary(this.rollState) || "Ohne Modifikatoren"
    };
  }
  activateListeners(html) {
    super.activateListeners(html);
    const root = GT.htmlRoot(html);
    const sync = () => {
      const bonus = root.querySelector(".gt-roll-dialog-bonus");
      this.rollState.bonus = Number(bonus?.value || 0);
      this.rollState.advantageMode = root.querySelector('input[name="advantageMode"]:checked')?.value || "none";
      this.rollState.advantageLevel = Number(root.querySelector(".gt-roll-dialog-level")?.value || 1);
      const finalFormula = GT.rollDialogFormula(this.roll.formula, this.rollState.diceCounts, this.rollState.bonus);
      const summary = GT.rollDialogSummary(this.rollState) || "Ohne Modifikatoren";
      const formulaEl = root.querySelector(".gt-roll-dialog-final code");
      if (formulaEl) formulaEl.textContent = finalFormula;
      const summaryEl = root.querySelector(".gt-roll-dialog-summary");
      if (summaryEl) summaryEl.textContent = summary;
      for (const die of [2, 4, 6, 8, 10, 12, 20]) {
        const button = root.querySelector(`.gt-roll-dialog-die[data-die="${die}"]`);
        if (!button) continue;
        const count = Number(this.rollState.diceCounts[die] || 0);
        button.classList.toggle("active", count > 0);
        const counter = button.querySelector("span");
        if (counter) counter.textContent = count ? String(count) : "+";
      }
    };
    root.querySelectorAll('input[name="advantageMode"], .gt-roll-dialog-level, .gt-roll-dialog-bonus').forEach(el => el.addEventListener("change", sync));
    root.querySelector(".gt-roll-dialog-bonus")?.addEventListener("input", sync);
    root.querySelectorAll(".gt-roll-dialog-die").forEach(button => button.addEventListener("click", ev => {
      ev.preventDefault();
      const die = Number(ev.currentTarget.dataset.die || 0);
      if (!die) return;
      this.rollState.diceCounts[die] = Number(this.rollState.diceCounts[die] || 0) + 1;
      sync();
    }));
    root.querySelectorAll(".gt-roll-dialog-die").forEach(button => button.addEventListener("contextmenu", ev => {
      ev.preventDefault();
      const die = Number(ev.currentTarget.dataset.die || 0);
      if (!die) return;
      this.rollState.diceCounts[die] = Math.max(0, Number(this.rollState.diceCounts[die] || 0) - 1);
      sync();
    }));
    root.querySelector(".gt-roll-dialog-clear-dice")?.addEventListener("click", ev => {
      ev.preventDefault();
      this.rollState.diceCounts = {2: 0, 4: 0, 6: 0, 8: 0, 10: 0, 12: 0, 20: 0};
      sync();
    });
    root.querySelector(".gt-roll-dialog-cancel")?.addEventListener("click", ev => { ev.preventDefault(); this.close(); });
    root.querySelector(".gt-roll-dialog-submit")?.addEventListener("click", async ev => {
      ev.preventDefault();
      sync();
      const formula = GT.rollDialogFormula(this.roll.formula, this.rollState.diceCounts, this.rollState.bonus);
      const rollSummary = GT.rollDialogSummary(this.rollState);
      await GT.chatRoll({
        ...this.roll,
        formula,
        configure: false,
        rollOptions: {advantageMode: this.rollState.advantageMode, advantageLevel: this.rollState.advantageLevel},
        rollSummary
      });
      await this.close();
    });
    sync();
  }
}

GT.openRollDialog = function(options = {}) {
  return new GothicTalesRollDialog(options).render(true);
};

class GothicTalesMagicDieDialog extends GothicTalesApplicationV2 {
  constructor(actor, index, slot = {}) {
    super({window: {title: "Magiewürfel"}, position: {width: 500, height: "auto"}});
    this.actor = actor;
    this.index = Number(index || 0);
    this.slot = slot;
  }
  static DEFAULT_OPTIONS = {
    classes: ["gothic-tales", "gt-app", "gt-v2-window", "gt-dialog-window", "gt-magic-die-dialog-window"],
    window: {title: "Magiewürfel", resizable: false},
    position: {width: 500}
  };
  static PARTS = {body: {template: "systems/gothic-tales/templates/dialog-magic-die.hbs"}};
  getData() { return {slot: this.slot, index: this.index}; }
  activateListeners(html) {
    super.activateListeners(html);
    const root = GT.htmlRoot(html);
    root.querySelector(".gt-magic-die-use")?.addEventListener("click", async ev => {
      ev.preventDefault();
      if (this.slot?.used) return ui.notifications.warn("Dieser Magiewürfel wurde bereits benutzt. Du kannst ihn nur neu würfeln.");
      await GT.useMagicCircleDie(this.actor, this.index);
      await this.close();
      this.actor.sheet?.render(false);
    });
    root.querySelector(".gt-magic-die-reroll")?.addEventListener("click", async ev => { ev.preventDefault(); await GT.rerollMagicCircleDie(this.actor, this.index); await this.close(); this.actor.sheet?.render(false); });
    root.querySelector(".gt-dialog-cancel")?.addEventListener("click", ev => { ev.preventDefault(); this.close(); });
  }
}

GT.openMagicDieDialog = function(actor, index) {
  const system = GT.actorSystemSource(actor);
  const slot = GT.magicCircleSlots(system)[Number(index || 0)] ?? {};
  if (!slot.active) return ui.notifications.warn("Dieser Magiewürfel ist noch nicht verfügbar.");
  if (!slot.filled) return ui.notifications.warn("Dieser Magiewürfel wurde noch nicht geworfen.");
  new GothicTalesMagicDieDialog(actor, index, slot).render(true);
};

/** ApplicationV2-Editor für Beschreibungsfelder. */
class GothicTalesTextEditorDialog extends GothicTalesApplicationV2 {
  constructor(document, path, label = "Beschreibung") {
    super({window: {title: `${label} bearbeiten`, resizable: true}, position: {width: 1100, height: 900}});
    this.document = document;
    this.systemPath = String(path || "description").replace(/^system\./, "");
    this.fieldName = `system.${this.systemPath}`;
    this.label = label;
    this.currentHtml = "";
  }

  static DEFAULT_OPTIONS = {
    classes: [],
    window: {title: "Beschreibung bearbeiten", resizable: true},
    position: {width: 1100, height: 900}
  };

  static PARTS = {body: {template: "systems/gothic-tales/templates/dialog-description.hbs"}};

  async getData() {
    const current = String(getProperty(this.document, this.fieldName) ?? getProperty(this.document.system ?? {}, this.systemPath) ?? "");
    this.currentHtml = GT.normalizeHtml(current || "");
    const enriched = await TextEditor.enrichHTML(this.currentHtml, {
      async: true,
      secrets: game.user?.isGM,
      relativeTo: this.document
    });
    return {
      label: this.label,
      fieldName: this.fieldName,
      html: this.currentHtml,
      enrichedHtml: enriched || this.currentHtml,
      isOwner: !!this.document?.isOwner,
      documentName: this.document?.name || "",
      documentUuid: this.document?.uuid || "",
      documentType: this.document?.documentName || this.document?.constructor?.documentName || "Dokument"
    };
  }

  activateListeners(html) {
    const root = GT.htmlRoot(html);

    root.querySelector("[data-action='save']")?.addEventListener("click", async ev => {
      ev.preventDefault();
      if (!this.document?.isOwner) return ui.notifications.warn("Du hast keine Berechtigung zum Bearbeiten.");
      const raw = await GT.readRichEditorHtml(root, null, this.fieldName);
      await this.document.update({[this.fieldName]: GT.normalizeHtml(raw)});
      ui.notifications.info(`${this.label} gespeichert.`);
      await this.close();
    });

    root.querySelector("[data-action='cancel']")?.addEventListener("click", ev => {
      ev.preventDefault();
      this.close();
    });
  }
}

/** ApplicationV2-Rastdialog. */
class GothicTalesRestDialog extends GothicTalesApplicationV2 {
  constructor(actor) { super({window: {title: "Ausruhen"}, position: {width: 520, height: "auto"}}); this.actor = actor; }
  static DEFAULT_OPTIONS = {
    classes: ["gothic-tales", "gt-app", "gt-v2-window", "gt-rest-window"],
    window: {title: "Ausruhen", resizable: false},
    position: {width: 520}
  };
  static PARTS = {body: {template: "systems/gothic-tales/templates/dialog-rest.hbs"}};
  getData() { return {actor: this.actor}; }
  activateListeners(html) {
    super.activateListeners(html);
    const root = GT.htmlRoot(html);
    root.querySelector(".gt-rest-submit")?.addEventListener("click", async ev => {
      ev.preventDefault();
      const hp = this.actor.system?.hp ?? {value: 0, max: 0};
      const mana = this.actor.system?.mana ?? {value: 0, max: 0};
      const ex = this.actor.system?.exhaustion ?? {value: 0, max: 6};
      const rest = root.querySelector('input[name="rest"]:checked')?.value || "short";
      const meal = !!root.querySelector('input[name="meal"]')?.checked;
      const healExhaustionShort = !!root.querySelector('input[name="healExhaustionShort"]')?.checked;
      let newHp = Number(hp.value || 0), newMana = Number(mana.value || 0), newEx = Number(ex.value || 0);
      if (rest === "short" && meal) {
        newHp = Math.min(Number(hp.max || 0), newHp + Math.floor(Number(hp.max || 0) / 2));
        newMana = Math.min(Number(mana.max || 0), newMana + Math.floor(Number(mana.max || 0) / 2));
        if (healExhaustionShort) newEx = Math.max(0, newEx - 1);
      }
      if (rest === "long" && meal) {
        newHp = Number(hp.max || 0);
        newMana = Number(mana.max || 0);
        newEx = Math.max(0, newEx - 2);
      }
      await this.actor.update({"system.hp.value": newHp, "system.mana.value": newMana, "system.exhaustion.value": newEx});
      ChatMessage.create({speaker: ChatMessage.getSpeaker({actor: this.actor}), content: `<div class="gothic-tales chat-card"><h2>Ausruhen</h2><p>${this.actor.name} hat eine ${rest === "short" ? "kurze" : "lange"} Rast gemacht.</p><p>TP: ${newHp}/${hp.max}, Mana: ${newMana}/${mana.max}, Erschöpfung: ${newEx}/${ex.max}</p></div>`});
      await this.close();
    });
    root.querySelector(".gt-dialog-cancel")?.addEventListener("click", ev => { ev.preventDefault(); this.close(); });
  }
}

/** Kleines Fenster zum kontrollierten Level Up/Level Down. */
class GothicTalesLevelDialog extends GothicTalesApplicationV2 {
  constructor(actor) {
    super({window: {title: "Stufe ändern"}, position: {width: 460, height: "auto"}});
    this.actor = actor;
  }

  static DEFAULT_OPTIONS = {
    classes: ["gothic-tales", "gt-app", "gt-v2-window", "gt-level-window"],
    window: {title: "Stufe ändern", resizable: false},
    position: {width: 460}
  };

  static PARTS = {body: {template: "systems/gothic-tales/templates/dialog-level.hbs"}};

  getData() {
    const current = Math.max(1, Math.min(27, Number(this.actor?.system?.stufe || 1)));
    const lp = this.actor?.system?.lp ?? {value: 0, max: 0};
    return {
      actor: this.actor,
      current,
      currentLp: Number(lp.value || 0),
      currentLpMax: Number(lp.max || 0),
      levels: Object.entries(GT.LEVEL_RESOURCES).map(([level, res]) => ({
        level: Number(level),
        lp: Number(res.lp || 0),
        erz: Number(res.erz || 0),
        selected: Number(level) === current
      }))
    };
  }

  activateListeners(html) {
    super.activateListeners(html);
    const root = GT.htmlRoot(html);
    const select = root.querySelector('select[name="targetLevel"]');
    root.querySelectorAll("[data-level-step]").forEach(button => button.addEventListener("click", ev => {
      ev.preventDefault();
      if (!select) return;
      const current = Math.max(1, Math.min(27, Number(select.value || this.actor?.system?.stufe || 1)));
      const step = Number(ev.currentTarget.dataset.levelStep || 0);
      select.value = String(Math.max(1, Math.min(27, current + step)));
    }));
    root.querySelector(".gt-level-apply")?.addEventListener("click", async ev => {
      ev.preventDefault();
      await GT.changeCharacterLevel(this.actor, Number(select?.value || this.actor?.system?.stufe || 1));
      await this.close();
    });
    root.querySelector(".gt-dialog-cancel")?.addEventListener("click", ev => { ev.preventDefault(); this.close(); });
  }
}

const BaseCombatantDocument = CONFIG.Combatant?.documentClass ?? globalThis.Combatant;

/** Standardbutton im Combat Tracker folgt ebenfalls den Gothic-Tales-Initiativregeln. */
class GothicTalesCombatant extends BaseCombatantDocument {
  _getInitiativeFormula() {
    const actor = this.actor;
    if (!actor) return "0";
    const initiative = actor.system?.initiative ?? {};
    if (actor.type !== "character" && (initiative.fixed !== false || !String(initiative.die || "").trim())) return String(Number(initiative.value ?? 0));
    return GT.initiativeFormula(actor);
  }
}

/** Hauptbogen für Charaktere, NSCs und Monster. Verdrahtet Würfe, Sperrmodus, Rast und Gegenstandsaktionen. */
class GothicTalesActorSheet extends BaseActorSheet {
  static DEFAULT_OPTIONS = {
    classes: ["gothic-tales", "sheet", "actor", "gt-v2-window", "gt-actor-window"],
    window: {title: "Gothic Tales Bogen", resizable: true},
    position: {width: 850, height: 800},
    form: {submitOnChange: false, closeOnSubmit: false}
  };

  static PARTS = {body: {template: "systems/gothic-tales/templates/actor/actor-sheet.hbs", scrollable: [".sheet-body", ".gt-scroll"]}};

  get actor() { return this.document; }
  get title() { return `${this.actor?.name || "Actor"} · Gothic Tales`; }

  render(force = true, options = {}) {
    if (typeof force === "object") return super.render(force);
    return super.render({...options, force: true});
  }

  async _prepareContext(options) {
    const data = await super._prepareContext(options);
    data.config = GT.CONFIG;
    data.actor = this.actor;
    data.document = this.actor;
    data.cssClass = this.isEditable ? "editable" : "locked";
    data.documentImage = GT.isPlaceholderImage(this.actor.img) ? GT.actorImage(this.actor.type, this.actor.name) : this.actor.img;
    data.items = Array.from(this.actor.items ?? [])
      .sort((a,b) => (a.sort ?? 0) - (b.sort ?? 0) || a.name.localeCompare(b.name))
      .map(item => ({id: item.id, name: item.name, type: item.type, sort: item.sort, img: GT.isPlaceholderImage(item.img) ? GT.itemImage(item.type, item.name, item.system?.category || "") : item.img, system: item.system}));
    await GT.getTalentScaffold();
    await GT.getMagicCircleScaffold();
    await GT.getDruidArtsScaffold();
    await GT.getProfessionScaffold();
    data.system = GT.recalculateSystem(GT.actorSystemSource(this.actor), this.actor.type, {equippedArmorBonus: GT.equippedArmorBonusFromItems(this.actor.items)});
    data.editable = this.isEditable;
    data.actorTypeLabel = GT.CONFIG.actorTypes[this.actor.type] || this.actor.type;
    data.sheetTheme = GT.actorSheetTheme();
    data.themeToggleLabel = data.sheetTheme === "dark" ? "Heller Bogen" : "Dunkler Bogen";
    data.themeToggleIcon = data.sheetTheme === "dark" ? "fa-sun" : "fa-moon";
    return enrichLists(data);
  }

  _onRender(context, options) {
    super._onRender(context, options);
    this.activateListeners(this.element);
  }

  activateListeners(element) {
    const root = GT.htmlRoot(element);
    const tabKey = GT.sheetTabKey(this.actor);
    GT.hideFloatingSideTabLabel();
    GT.activateSheetTabs(root, {
      initial: this._activeTab || GT.sheetTabState.get(tabKey) || "main",
      onChange: tab => {
        this._activeTab = tab || "main";
        GT.sheetTabState.set(tabKey, this._activeTab);
      }
    });
    GT.bindFloatingSideTabLabels(root);
    const locked = !!this.actor.system?.sheetLocked;
    if (locked) {
      root.querySelectorAll("input, textarea, select").forEach(el => { el.disabled = true; });
      root.querySelectorAll('input[name="system.hp.value"], input[name="system.mana.value"], input[name="system.exhaustion.value"], input[name="system.deathCounter.value"]').forEach(el => { el.disabled = false; el.classList.add("gt-resource-editable"); });
      root.querySelectorAll(".gt-lock-toggle, .gt-theme-toggle, .gt-roll, .gt-open-talent-tree, .gt-open-creator, .gt-open-npc-creator, .gt-rest-button, .gt-combat-end-button, .gt-initiative-roll, .gt-recalculate, .gt-level-manage, .gt-description-edit, .gt-talent-info, .gt-use-talent, .gt-open-druid-rite-tree, .gt-open-druid-rite, .gt-druid-free-learn, .gt-druid-cast, .gt-druid-transform, .item-roll, .item-attack, .item-favorite").forEach(el => { el.disabled = false; });
      root.querySelectorAll(".item-create, .item-edit, .item-delete, .item-equip").forEach(el => { el.disabled = true; el.classList.add("disabled"); });
    }
    root.querySelectorAll(".gt-roll:not(.gt-initiative-roll)").forEach(el => el.addEventListener("click", ev => {
      ev.preventDefault();
      const button = ev.currentTarget;
      GT.chatRoll({formula: button.dataset.formula, label: button.dataset.label, actor: this.actor});
    }));
    root.querySelectorAll(".gt-initiative-roll").forEach(el => el.addEventListener("click", ev => {
      ev.preventDefault();
      GT.rollActorInitiative(this.actor);
    }));
    root.querySelectorAll(".gt-recalculate").forEach(el => el.addEventListener("click", async ev => {
      ev.preventDefault();
      const calc = GT.recalculateSystem(this.actor.system, this.actor.type, {equippedArmorBonus: GT.equippedArmorBonusFromItems(this.actor.items)});
      await this.actor.update(GT.flattenSystemUpdate(calc));
      ui.notifications.info("Gothic Tales: Werte neu berechnet.");
    }));
    root.querySelectorAll(".gt-level-manage").forEach(el => el.addEventListener("click", ev => {
      ev.preventDefault();
      new GothicTalesLevelDialog(this.actor).render(true);
    }));
    root.querySelectorAll("input[name], select[name], textarea[name]").forEach(el => el.addEventListener("change", async ev => {
      const field = ev.currentTarget;
      if (!this.isEditable || field.disabled || field.readOnly) return;
      const name = field.name;
      if (!name || name.startsWith("items.")) return;
      const value = field.type === "checkbox" ? field.checked : (field.type === "number" ? Number(field.value || 0) : field.value);
      if (name === "name") return this.actor.update({name: String(value || this.actor.name)});
      if (!name.startsWith("system.")) return;
      const path = name.replace(/^system\./, "");
      const source = GT.actorSystemSource(this.actor);
      setProperty(source, path, value);
      await GT.updateActorSystem(this.actor, source);
    }));
    root.querySelectorAll(".gt-lock-toggle").forEach(el => el.addEventListener("click", async ev => {
      ev.preventDefault();
      await this.actor.update({"system.sheetLocked": !this.actor.system?.sheetLocked});
      ui.notifications.info(this.actor.system?.sheetLocked ? "Bearbeitung aktiviert." : "Bearbeitung gesperrt.");
      this.render(false);
    }));
    root.querySelectorAll(".gt-theme-toggle").forEach(el => el.addEventListener("click", async ev => {
      ev.preventDefault();
      const nextTheme = GT.actorSheetTheme() === "dark" ? "light" : "dark";
      await game.settings.set(GT.SETTINGS_NAMESPACE, "actorSheetTheme", nextTheme);
      ui.notifications.info(nextTheme === "dark" ? "Dunkler Actorbogen aktiviert." : "Heller Actorbogen aktiviert.");
      GT.rerenderActorSheets();
    }));
    root.querySelectorAll(".gt-rest-button").forEach(el => el.addEventListener("click", ev => {
      ev.preventDefault();
      GT.openRestDialog(this.actor);
    }));
    root.querySelectorAll(".gt-combat-end-button").forEach(el => el.addEventListener("click", async ev => {
      ev.preventDefault();
      await GT.confirmCombatEndRecharge(this.actor);
      this.render(false);
    }));
    root.querySelectorAll(".gt-open-talent-tree").forEach(el => el.addEventListener("click", ev => { ev.preventDefault(); new GothicTalesTalentTree(this.actor).render(true); }));
    root.querySelectorAll(".gt-open-magic-tree").forEach(el => el.addEventListener("click", ev => { ev.preventDefault(); new GothicTalesMagicCircleTree(this.actor).render(true); }));
    root.querySelectorAll(".gt-open-profession-tree").forEach(el => el.addEventListener("click", ev => { ev.preventDefault(); new GothicTalesProfessionTree(this.actor).render(true); }));
    root.querySelectorAll(".gt-profession-page-select").forEach(el => el.addEventListener("click", ev => {
      ev.preventDefault();
      const button = ev.currentTarget;
      const target = button.dataset.professionTarget || "";
      if (!target) return;
      root.querySelectorAll(".gt-profession-page-select").forEach(btn => btn.classList.toggle("active", btn === button));
      root.querySelectorAll(".gt-profession-page").forEach(page => page.classList.toggle("active", page.dataset.professionPage === target));
    }));
    root.querySelectorAll(".gt-druid-school-page-select").forEach(el => el.addEventListener("click", ev => {
      ev.preventDefault();
      const button = ev.currentTarget;
      const target = button.dataset.druidSchoolTarget || "";
      if (!target) return;
      root.querySelectorAll(".gt-druid-school-page-select").forEach(btn => btn.classList.toggle("active", btn === button));
      root.querySelectorAll(".gt-druid-school-page").forEach(page => page.classList.toggle("active", page.dataset.druidSchoolPage === target));
    }));
    root.querySelectorAll(".gt-druid-spell-card, .gt-druid-learned-rite").forEach(card => card.addEventListener("pointerdown", () => {
      root.querySelectorAll(".gt-druid-card-front").forEach(other => other.classList.remove("gt-druid-card-front"));
      card.classList.add("gt-druid-card-front");
      card.scrollIntoView?.({block: "nearest", behavior: "smooth"});
    }));
    root.querySelector(".gt-open-druid-rite-tree")?.addEventListener("click", ev => {
      ev.preventDefault();
      GT.openDruidRiteTree(this.actor);
    });
    root.querySelectorAll(".gt-unlearn-druid-rite").forEach(el => el.addEventListener("click", async ev => {
      ev.preventDefault();
      await GT.unlearnDruidRite(this.actor, ev.currentTarget.dataset.riteId);
      this.render(false);
    }));
    root.querySelectorAll(".gt-profession-detail-open").forEach(el => el.addEventListener("click", ev => { ev.preventDefault(); const btn = ev.currentTarget; GT.openProfessionDetail(this.actor, btn.dataset.treeId, btn.dataset.nodeId); }));
    root.querySelectorAll(".gt-profession-roll").forEach(el => el.addEventListener("click", async ev => {
      ev.preventDefault();
      const btn = ev.currentTarget;
      const {node} = await GT.findProfessionNode(btn.dataset.treeId, btn.dataset.nodeId);
      if (!node) return ui.notifications.warn("Beruf nicht gefunden.");
      GT.chatRoll({formula: GT.professionFormula(this.actor, node), label: node.label, actor: this.actor, flavor: "Berufswurf"});
    }));
    root.querySelectorAll(".gt-open-druid-rite").forEach(el => el.addEventListener("click", async ev => {
      ev.preventDefault();
      await GT.learnDruidRite(this.actor, ev.currentTarget.dataset.riteId);
      this.render(false);
    }));
    root.querySelectorAll(".gt-druid-free-learn").forEach(el => el.addEventListener("click", async ev => {
      ev.preventDefault();
      await GT.learnDruidSpellFree(this.actor, ev.currentTarget.dataset.spellId);
      this.render(false);
    }));
    root.querySelectorAll(".gt-druid-cast").forEach(el => el.addEventListener("click", async ev => {
      ev.preventDefault();
      await GT.castDruidSpell(this.actor, ev.currentTarget.dataset.spellId);
      this.render(false);
    }));
    root.querySelectorAll(".gt-druid-transform").forEach(el => el.addEventListener("click", async ev => {
      ev.preventDefault();
      await GT.announceDruidTransformation(this.actor, ev.currentTarget.dataset.spellId);
      this.render(false);
    }));
    root.querySelectorAll(".gt-magic-roll-all").forEach(el => el.addEventListener("click", async ev => { ev.preventDefault(); await GT.rollAllMagicCircleDice(this.actor); this.render(false); }));
    root.querySelectorAll(".gt-magic-die-slot").forEach(el => el.addEventListener("click", ev => { ev.preventDefault(); if (ev.currentTarget.disabled) return; GT.openMagicDieDialog(this.actor, ev.currentTarget.dataset.slotIndex); }));
    root.querySelectorAll(".gt-use-magic-skill").forEach(el => el.addEventListener("click", async ev => { ev.preventDefault(); const button = ev.currentTarget; await GT.executeMagicCircleSkill(this.actor, {treeId: button.dataset.treeId, nodeId: button.dataset.nodeId}); this.render(false); }));
    root.querySelectorAll(".gt-open-creator").forEach(el => el.addEventListener("click", ev => { ev.preventDefault(); new GothicTalesCharacterCreator({targetActor: this.actor}).render(true); }));
    root.querySelectorAll(".gt-open-npc-creator").forEach(el => el.addEventListener("click", ev => { ev.preventDefault(); new GothicTalesNPCGenerator({targetActor: this.actor}).render(true); }));
    root.querySelectorAll(".gt-description-edit").forEach(el => el.addEventListener("click", ev => {
      ev.preventDefault();
      const path = ev.currentTarget.dataset.path || "notes";
      const label = ev.currentTarget.dataset.label || "Beschreibung";
      GT.openTextEditorDialog(this.actor, path, label);
    }));
    root.querySelectorAll(".gt-image-picker").forEach(el => el.addEventListener("click", ev => {
      ev.preventDefault();
      GT.openImagePicker(this.actor, "img");
    }));
    root.querySelectorAll(".gt-talent-info").forEach(el => el.addEventListener("click", ev => {
      ev.preventDefault();
      ev.stopPropagation();
      GT.showFloatingTooltip(ev.currentTarget, ev.currentTarget.dataset.gtTooltip || "Keine weiteren Informationen.");
    }));
    root.querySelectorAll(".gt-use-talent").forEach(el => el.addEventListener("click", async ev => {
      ev.preventDefault();
      const button = ev.currentTarget;
      await GT.executeTalent(this.actor, {source: button.dataset.source, treeId: button.dataset.treeId, nodeId: button.dataset.nodeId, itemId: button.dataset.itemId});
      this.render(false);
    }));
    root.querySelectorAll(".item-attack").forEach(el => el.addEventListener("click", ev => {
      ev.preventDefault();
      ev.stopPropagation();
      const row = ev.currentTarget.closest(".gt-item-row, .item");
      const item = this.actor.items.get(row?.dataset?.itemId);
      if (!item) return ui.notifications.warn("Gothic Tales: Gegenstand nicht gefunden.");
      const formula = GT.actorAttributeFormula(this.actor, item?.system?.attribute || (item?.type === "spell" ? "konz" : "st"));
      const isDruid = item?.type === "spell" && (String(item.system?.folderCategory || "") === "Druidenkunst" || String(item.system?.category || "").includes("Druidenkunst"));
      GT.chatRoll({
        formula,
        label: item?.name ?? "Angriff",
        actor: this.actor,
        item,
        flavor: isDruid ? "Druidenkunst" : "Angriffswurf",
        cardType: isDruid ? "druidSpell" : (item?.type === "spell" ? "spell" : "roll"),
        cardData: isDruid ? {Schule: String(item.system?.category || "Druidenkunst").replace(/^Druidenkunst\s*·?\s*/, ""), Mana: item.system?.mana || "—", Reichweite: item.system?.range || "—"} : {}
      });
    }));
    root.querySelectorAll(".item-roll").forEach(el => el.addEventListener("click", ev => {
      ev.preventDefault();
      ev.stopPropagation();
      const row = ev.currentTarget.closest(".gt-item-row, .item");
      const item = this.actor.items.get(row?.dataset?.itemId);
      if (!item) return ui.notifications.warn("Gothic Tales: Gegenstand nicht gefunden.");
      const isDruid = item?.type === "spell" && (String(item.system?.folderCategory || "") === "Druidenkunst" || String(item.system?.category || "").includes("Druidenkunst"));
      GT.chatRoll({
        formula: GT.itemDamageFormula(this.actor, item),
        label: item?.name ?? "Wurf",
        actor: this.actor,
        item,
        flavor: isDruid ? "Druidenkunst" : (item?.type === "spell" ? "Zauberwirkung" : "Schaden/Effekt"),
        cardType: isDruid ? "druidSpell" : (item?.type === "spell" ? "spell" : "roll"),
        cardData: isDruid ? {Schule: String(item.system?.category || "Druidenkunst").replace(/^Druidenkunst\s*·?\s*/, ""), Mana: item.system?.mana || "—", Reichweite: item.system?.range || "—"} : {}
      });
    }));
    root.querySelectorAll(".item-favorite").forEach(el => el.addEventListener("click", async ev => {
      ev.preventDefault();
      ev.stopPropagation();
      const row = ev.currentTarget.closest(".gt-item-row, .item");
      const item = this.actor.items.get(row?.dataset?.itemId);
      if (!item) return ui.notifications.warn("Gothic Tales: Gegenstand nicht gefunden.");
      await item.update({"system.favorite": !item.system?.favorite});
      this.render(false);
    }));
    root.querySelectorAll(".item-favorite").forEach(el => el.addEventListener("click", async ev => {
      ev.preventDefault();
      const item = this.actor.items.get(ev.currentTarget.closest(".item")?.dataset.itemId);
      if (!item) return;
      await item.update({"system.favorite": !item.system?.favorite});
      this.render(false);
    }));
    if (!this.isEditable || locked) return;
    root.querySelectorAll(".item-create").forEach(el => el.addEventListener("click", async ev => {
      ev.preventDefault();
      const type = ev.currentTarget.dataset.type || "equipment";
      await this.actor.createEmbeddedDocuments("Item", [{name: "Neuer Eintrag", type, img: GT.itemImage(type, "Neuer Eintrag")}]);
    }));
    root.querySelectorAll(".item-edit").forEach(el => el.addEventListener("click", ev => {
      ev.preventDefault();
      const item = this.actor.items.get(ev.currentTarget.closest(".item")?.dataset.itemId);
      item?.sheet?.render(true);
    }));
    root.querySelectorAll(".item-delete").forEach(el => el.addEventListener("click", async ev => {
      ev.preventDefault();
      const item = this.actor.items.get(ev.currentTarget.closest(".item")?.dataset.itemId);
      if (item && await GT.confirm({title: GT.localize("GOTHICTALES.DeleteItem", "Gegenstand löschen"), content: `<p>${GT.escape(item.name)} entfernen?</p>`, yesLabel: "Entfernen", noLabel: "Abbrechen"})) await item.delete();
    }));
    root.querySelectorAll(".item-equip").forEach(el => el.addEventListener("click", async ev => {
      ev.preventDefault();
      const item = this.actor.items.get(ev.currentTarget.closest(".item")?.dataset.itemId);
      if (!item) return;
      await item.update({"system.equipped": !item.system?.equipped});
      await this.actor.update(GT.flattenSystemUpdate(GT.recalculateSystem(this.actor.system, this.actor.type, {equippedArmorBonus: GT.equippedArmorBonusFromItems(this.actor.items)})));
    }));
  }
}

/** Rastdialog, der TP/Mana regeneriert, optional Erschöpfung senkt und anschließend eine Chat-Zusammenfassung schreibt. */
GT.openRestDialog = function(actor) {
  new GothicTalesRestDialog(actor).render(true);
};

/** Fragt nach Kampfende ab und füllt alle Talent-Anwendungen nach Regelwerk wieder auf. */
GT.confirmCombatEndRecharge = async function(actor) {
  if (!actor?.isOwner) return ui.notifications.warn("Du hast keine Berechtigung, diesen Actor zu ändern.");
  const confirmed = await GT.confirm({
    title: "Kampf vorbei",
    message: "Sollen alle Talent-Anwendungen dieses Actors wieder vollständig hergestellt werden?",
    yes: "Talente auffüllen",
    no: "Abbrechen"
  });
  if (!confirmed) return;
  const recharged = await GT.rechargeTalentUses(actor, {mode: "combatEnd"});
  const summary = recharged.length ? GT.escape(recharged.join(", ")) : "Keine begrenzten Talent-Anwendungen vorhanden.";
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({actor}),
    content: `<div class="gothic-tales chat-card gt-combat-end-card"><h2><i class="fas fa-flag-checkered"></i> Kampf vorbei</h2><p>${GT.escape(actor.name)} stellt seine Talent-Anwendungen wieder her.</p><p><strong>Aufgefüllt:</strong> ${summary}</p></div>`
  });
  ui.notifications.info("Talent-Anwendungen wurden wiederhergestellt.");
};

/** Gegenstandsbogen für Waffen, Rüstungen, Zauber, Talente und Ausrüstungsmetadaten. */
class GothicTalesItemSheet extends BaseItemSheet {
  static DEFAULT_OPTIONS = {
    classes: ["gothic-tales", "sheet", "item", "gt-v2-window", "gt-item-window"],
    window: {title: "Gothic Tales Gegenstand", resizable: true},
    position: {width: 820, height: 760},
    form: {submitOnChange: true, closeOnSubmit: false}
  };

  static PARTS = {body: {template: "systems/gothic-tales/templates/item/item-sheet.hbs", scrollable: [".sheet-body", ".gt-scroll"]}};

  get item() { return this.document; }

  render(force = true, options = {}) {
    if (typeof force === "object") return super.render(force);
    return super.render({...options, force: true});
  }

  async _prepareContext(options) {
    const data = await super._prepareContext(options);
    data.config = GT.CONFIG;
    data.item = this.item;
    data.document = this.item;
    data.cssClass = this.isEditable ? "editable" : "locked";
    data.documentImage = GT.isPlaceholderImage(this.item.img) ? GT.itemImage(this.item.type, this.item.name, this.item.system?.category || "") : this.item.img;
    data.system = this.item.system;
    data.editable = this.isEditable;
    data.editMode = this._editMode === true;
    data.viewMode = !data.editMode;
    data.descriptionText = GT.htmlToPlainText(this.item.system?.description || "");
    data.attributeOptions = Object.entries(GT.CONFIG.attributes).map(([key, label]) => ({key, label, selected: key === String(this.item.system?.attribute || "").toLowerCase()}));
    data.attributeRequirementOptions = Object.entries(GT.CONFIG.attributes).map(([key, label]) => ({key, label, value: Number(this.item.system?.attributeRequirements?.[key] || 0)}));
    return data;
  }

  _onRender(context, options) {
    super._onRender(context, options);
    this.activateListeners(this.element);
  }

  activateListeners(element) {
    const root = GT.htmlRoot(element);
    const tabKey = GT.sheetTabKey(this.item);
    GT.activateSheetTabs(root, {
      initial: this._activeTab || GT.sheetTabState.get(tabKey) || "main",
      onChange: tab => {
        this._activeTab = tab || "main";
        GT.sheetTabState.set(tabKey, this._activeTab);
      }
    });
    root.querySelectorAll(".gt-item-mode-toggle").forEach(el => el.addEventListener("click", ev => {
      ev.preventDefault();
      this._editMode = !this._editMode;
      this.render(false);
    }));
    root.querySelectorAll(".gt-roll").forEach(el => el.addEventListener("click", ev => {
      ev.preventDefault();
      GT.chatRoll({formula: ev.currentTarget.dataset.formula || this.item.system?.damage || "w20", label: this.item.name});
    }));
    root.querySelectorAll(".gt-description-edit").forEach(el => el.addEventListener("click", ev => {
      ev.preventDefault();
      const path = ev.currentTarget.dataset.path || "description";
      const label = ev.currentTarget.dataset.label || "Beschreibung";
      GT.openTextEditorDialog(this.item, path, label);
    }));
    root.querySelectorAll(".gt-image-picker").forEach(el => el.addEventListener("click", ev => {
      ev.preventDefault();
      GT.openImagePicker(this.item, "img");
    }));
  }
}

/** Charakterassistent für Stufe, LP-Ausgaben, Stärken/Schwächen, Talente und Startausrüstung. */
class GothicTalesCharacterCreator extends GothicTalesFormApplicationV2 {
  constructor(options = {}) { super(options); this.targetActor = options.targetActor ?? null; }
  static DEFAULT_OPTIONS = {
    id: "gothic-tales-character-creator",
    classes: ["gothic-tales", "gt-app", "gt-v2-window", "gt-character-creator-window"],
    window: {title: "Gothic Tales Charakter erstellen", resizable: true},
    position: {width: 980, height: 860}
  };
  static PARTS = {body: {template: "systems/gothic-tales/templates/creator.hbs", scrollable: [".gt-generator-scroll"]}};

  async getData() {
    const items = await GT.getRumpelkammerItems();
    const traits = items.filter(i => i.type === "trait").map(i => ({name: i.name, kind: i.kind, points: i.points, category: i.category}));
    const scaffold = await GT.getTalentScaffold();
    const talents = scaffold.trees.flatMap(t => t.nodes.map(n => ({tree: t.label, id: `${t.id}__${n.id}`, label: n.label, lpCost: Number(n.lpCost || 0), requirements: (n.requires || []).join(", "), attrRequirements: GT.talentAttributeRequirementText(n)}))).filter(t => t.lpCost > 0);
    const basicItems = items.filter(i => ["weapon", "shield", "armor", "consumable", "equipment"].includes(i.type) && Number(String(i.value).replace(/[^0-9]/g,"")) <= 120)
      .slice(0, 180).map(i => ({name: i.name, type: i.type, category: i.folderCategory || i.category, value: i.value}));
    return {
      packages: GT.START_PACKAGES,
      levels: Object.entries(GT.LEVEL_RESOURCES).map(([level, r]) => ({level, lp: r.lp, erz: r.erz})),
      attributes: Object.entries(GT.CONFIG.attributes).map(([key, label]) => ({key, label})),
      skills: Object.entries(GT.CONFIG.skills).map(([key, label]) => ({key, label})),
      weaknesses: traits.filter(t => t.kind === "Schwäche"),
      strengths: traits.filter(t => t.kind === "Stärke"),
      talents,
      basicItems,
      targetActor: this.targetActor,
      avatar: this.targetActor && !GT.isPlaceholderImage(this.targetActor.img) ? this.targetActor.img : GT.actorImage("character")
    };
  }

  async _updateObject(event, formData) {
    const name = formData.heroName || "Neuer Held";
    const level = Math.max(1, Math.min(27, Number(formData.level || 1)));
    const res = GT.LEVEL_RESOURCES[level] ?? {lp: level * 10, erz: 0};
    let spent = 0;
    const attrs = {};
    for (const [key, label] of Object.entries(GT.CONFIG.attributes)) {
      const add = Math.max(0, Number(formData[`add_${key}`] || 0));
      spent += GT.attributeCost(10, 10 + add);
      attrs[key] = {label, value: 10 + add, die: "w4", bonus: 0};
    }
    const skills = {};
    for (const [key, label] of Object.entries(GT.CONFIG.skills)) {
      const grade = Math.max(0, Math.min(3, Number(formData[`skill_${key}`] || 0)));
      spent += GT.skillGradeCost(grade);
      skills[key] = {label, grade};
    }
    const learned = {};
    for (const [k, v] of Object.entries(formData)) {
      if (!k.startsWith("talent_") || !v) continue;
      const [tree, node] = k.replace("talent_", "").split("__");
      learned[tree] ??= {};
      learned[tree][node] = true;
    }
    const scaffold = await GT.getTalentScaffold();
    const selectedTalentNodes = [];
    for (const [tree, nodes] of Object.entries(learned)) {
      const t = scaffold.trees.find(x => x.id === tree);
      for (const node of Object.keys(nodes)) {
        const nodeData = t?.nodes.find(n => n.id === node);
        if (!nodeData) continue;
        selectedTalentNodes.push({tree: t, node: nodeData});
        spent += Number(nodeData.lpCost || 0);
      }
    }
    const tempActorForReqs = {type: "character", system: {attributes: attrs}};
    const missingTalentAttrs = selectedTalentNodes.flatMap(({tree, node}) => GT.actorMeetsTalentAttributeRequirements(tempActorForReqs, node).missing.map(m => `${tree.label}: ${GT.talentDisplayLabel(node)} benötigt ${m.label} ${m.min} (aktuell ${m.current})`));
    if (missingTalentAttrs.length) return ui.notifications.warn(`Talent-Mindestattribute fehlen: ${missingTalentAttrs.join("; ")}.`);
    const weaknesses = [formData.weakness1, formData.weakness2, formData.weakness3].filter(Boolean);
    const strengths = [formData.strength1, formData.strength2, formData.strength3].filter(Boolean);
    if (weaknesses.length !== new Set(weaknesses).size || strengths.length !== new Set(strengths).size) return ui.notifications.warn("Bitte Stärken und Schwächen nicht doppelt auswählen.");
    if (spent > res.lp) return ui.notifications.warn(`Zu viele Lernpunkte ausgegeben: ${spent}/${res.lp}.`);
    const selected = GT.START_PACKAGES.find(p => p.id === formData.package) ?? GT.START_PACKAGES[0];
    const baseSystem = GT.recalculateSystem({
      playerName: formData.playerName || "",
      faction: formData.faction || "",
      stufe: level,
      lp: {value: Math.max(0, res.lp - spent), max: res.lp},
      attributes: attrs,
      skills,
      strengthsWeaknesses: [...weaknesses.map(w => `Schwäche: ${w}`), ...strengths.map(s => `Stärke: ${s}`)].join("\n"),
      biography: formData.biography || "",
      inventoryText: `Startpaket: ${selected.label}\n${selected.summary}\nStart-Erz nach Tabelle: ${res.erz}`,
      notes: formData.notes || "",
      movement: {value: 5},
      armorBonus: {rk: 0, ele: 0, ma: 0},
      talentTree: {learned}
    }, "character");
    const image = String(formData.img || "").trim() || (this.targetActor && !GT.isPlaceholderImage(this.targetActor.img) ? this.targetActor.img : GT.actorImage("character", name));
    let actor = this.targetActor;
    if (actor) await actor.update({name, type: "character", img: image, prototypeToken: {texture: {src: image}}, system: baseSystem});
    else actor = await Actor.create({name, type: "character", img: image, prototypeToken: {texture: {src: image}}, system: baseSystem});
    const itemDocs = await GT.itemsFromPackage(selected.id);
    for (const itemName of [formData.extraItem1, formData.extraItem2, formData.extraItem3].filter(Boolean)) itemDocs.push(await GT.itemFromSource(itemName, 1));
    if (itemDocs.length) await actor.createEmbeddedDocuments("Item", itemDocs);
    ui.notifications.info(`Gothic Tales: Spielercharakter ${name} erstellt.`);
    actor?.sheet?.render(true);
  }

  activateListeners(element) {
    super.activateListeners(element);
    const root = GT.htmlRoot(element);
    root.querySelectorAll(".gt-avatar-picker").forEach(el => el.addEventListener("click", ev => {
      ev.preventDefault();
      GT.openAvatarPickerForForm(ev.currentTarget, GT.actorImage("character"));
    }));
  }
}

/** SL-Werkzeug zum Erstellen archetypbasierter NSC-Actoren mit Startausrüstung. */
class GothicTalesNPCGenerator extends GothicTalesFormApplicationV2 {
  constructor(options = {}) { super(options); this.targetActor = options.targetActor ?? null; }
  static DEFAULT_OPTIONS = {
    id: "gothic-tales-npc-generator",
    classes: ["gothic-tales", "gt-app", "gt-v2-window", "gt-npc-generator-window"],
    window: {title: "Gothic Tales NSC-Generator", resizable: true},
    position: {width: 860, height: 740}
  };
  static PARTS = {body: {template: "systems/gothic-tales/templates/npc-generator.hbs", scrollable: [".gt-generator-scroll"]}};
  async getData() {
    const items = await GT.getRumpelkammerItems();
    return {
      archetypes: Object.entries(GT.NPC_ARCHETYPES).map(([id, a]) => ({id, label: a.label})),
      levels: Array.from({length: 30}, (_, i) => i + 1),
      factions: ["keine", "Altes Lager", "Neues Lager", "Sektenlager", "Stadtwache", "Paladin", "Feuermagier", "Wassermagier", "Druiden", "Waldläufer", "Nordmar", "Assassinen", "Ork", "Untot"],
      weapons: items.filter(i => ["weapon", "shield", "spell"].includes(i.type)).map(i => i.name).slice(0, 260),
      armors: items.filter(i => i.type === "armor").map(i => i.name),
      targetActor: this.targetActor,
      avatar: this.targetActor && !GT.isPlaceholderImage(this.targetActor.img) ? this.targetActor.img : GT.actorImage("npc")
    };
  }
  async _updateObject(event, formData) {
    const level = Math.max(1, Number(formData.level || 1));
    const archetype = GT.NPC_ARCHETYPES[formData.archetype] ?? GT.NPC_ARCHETYPES.kaempfer;
    const attrs = {};
    for (const [key, label] of Object.entries(GT.CONFIG.attributes)) attrs[key] = {label, value: 10 + Math.floor(level * 1.5), die: "w4", bonus: 0};
    for (const [key, mult] of Object.entries(archetype.focus)) attrs[key].value += Math.floor(level * mult);
    const system = GT.recalculateSystem({
      faction: formData.faction || "keine",
      stufe: level,
      actions: Number(formData.actions || 2),
      variant: formData.variant || "A",
      attributes: attrs,
      movement: {value: Number(formData.movement || 5)},
      armorBonus: {rk: 0, ele: 0, ma: 0},
      biography: formData.description || "",
      inventoryText: "NSC-Inventar kann nach dem Kampf geplündert werden. Rüstungen erschlagener Feinde passen Spielercharakteren in der Regel nicht.",
      notes: `NSC-Regel: feste Initiative, grundsätzlich 2 Aktionen; Anführer oder wichtige NSCs können 3 Aktionen haben.`
    }, "npc");
    system.hp.max = Math.max(10, 30 + level * 10 + Number(attrs.ausd.value));
    system.hp.value = system.hp.max;
    system.initiative.value = Math.floor((Number(attrs.ge.value) + Number(attrs.intu.value) + 2 * Number(attrs.erf.value) - 5) / 15);
    system.initiative.bonus = system.initiative.value;
    system.initiative.die = "";
    const actorName = formData.npcName || "Neuer NSC";
    const image = String(formData.img || "").trim() || (this.targetActor && !GT.isPlaceholderImage(this.targetActor.img) ? this.targetActor.img : GT.actorImage("npc", actorName));
    const actorData = {name: actorName, type: "npc", img: image, prototypeToken: {texture: {src: image}}, system};
    let actor = this.targetActor;
    if (actor) await actor.update(actorData);
    else actor = await Actor.create(actorData);
    const itemDocs = [];
    for (const n of [formData.weapon || archetype.weapon, formData.armor || archetype.armor, formData.extra || ""].filter(Boolean)) itemDocs.push(await GT.itemFromSource(n, 1));
    if (itemDocs.length) await actor.createEmbeddedDocuments("Item", itemDocs);
    actor.sheet?.render(true);
  }

  activateListeners(element) {
    super.activateListeners(element);
    const root = GT.htmlRoot(element);
    root.querySelectorAll(".gt-avatar-picker").forEach(el => el.addEventListener("click", ev => {
      ev.preventDefault();
      GT.openAvatarPickerForForm(ev.currentTarget, GT.actorImage("npc"));
    }));
  }
}

/** Interaktives Talentbaumfenster, das LP ausgibt/erstattet und gelernte Knoten am Actor speichert. */
class GothicTalesTalentTree extends GothicTalesApplicationV2 {
  constructor(actor, options = {}) { super(options); this.actor = actor; this.activeTree = "einhand"; }
  static DEFAULT_OPTIONS = {
    id: "gothic-tales-talent-tree",
    classes: ["gothic-tales", "gt-app", "gt-v2-window", "gt-talent-tree-window"],
    window: {title: "Gothic Tales Talentbaum", resizable: true},
    position: {width: 1040, height: 780}
  };
  static PARTS = {body: {template: "systems/gothic-tales/templates/talent-tree.hbs", scrollable: [".gt-talent-app"]}};
  async getData() {
    const data = await GT.getTalentScaffold();
    const learnedRoot = this.actor.system?.talentTree?.learned ?? {};
    const lp = Number(this.actor.system?.lp?.value ?? 0);
    const isCharacter = this.actor.type === "character";
    const trees = data.trees.map(tree => {
      const learned = learnedRoot[tree.id] ?? {};
      const nodes = tree.nodes.map(n => {
        const reqsMet = (n.requires ?? []).every(r => learned[r]);
        const attrCheck = GT.actorMeetsTalentAttributeRequirements(this.actor, n);
        const attrText = GT.talentAttributeRequirementText(n, this.actor);
        const cost = isCharacter ? Number(n.lpCost || 0) : 0;
        const enoughLp = !isCharacter || lp >= cost;
        const available = !!learned[n.id] || (reqsMet && attrCheck.met && enoughLp);
        const displayCost = isCharacter ? (Number(n.lpCost || 0) ? `${n.lpCost} LP` : "frei") : "NSC/Monster";
        const missingReason = [];
        if (!reqsMet) missingReason.push("Talentpfad fehlt");
        if (!attrCheck.met) missingReason.push(`Attribute fehlen: ${attrCheck.missing.map(m => `${m.label} ${m.current}/${m.min}`).join(", ")}`);
        if (!enoughLp) missingReason.push("nicht genug LP");
        const uses = GT.talentUsesConfig(n);
        const consume = GT.talentConsumeConfig(n, tree.id);
        const usageInfo = uses.max ? `Anwendungen: ${uses.max} pro Kampf` : "";
        const consumeInfo = consume.key && consume.amount ? `Verbraucht: ${consume.amount} Anwendung von ${consume.key}` : "";
        const tooltip = GT.talentDetailsHtml({descriptionHtml: n.descriptionHtml || GT.talentDescriptionHtml(n.description || ""), usageText: usageInfo, consumeText: consumeInfo, attributeText: attrText});
        const lockedInfo = missingReason.length ? `Gesperrt: ${missingReason.join("; ")}` : "";
        const tooltipHtml = `${tooltip}${lockedInfo ? `<p class="gt-tooltip-meta"><strong>Gesperrt:</strong> ${GT.escape(missingReason.join("; "))}</p>` : ""}`;
        return {...n, displayLabel: GT.talentDisplayLabel(n), learned: !!learned[n.id], available, displayCost, attrRequirementText: attrText, usesText: usageInfo, consumeText: consumeInfo, tooltip: tooltipHtml, missingReason: missingReason.join("; ")};
      });
      return {...tree, active: tree.id === this.activeTree, nodes};
    });
    return {actor: this.actor, system: this.actor.system, trees, isCharacter};
  }
  activateListeners(html) {
    super.activateListeners(html);
    html.find(".gt-tree-select").on("click", ev => { this.activeTree = ev.currentTarget.dataset.tree; GT.hideFloatingTooltip(); this.render(false); });
    html.find(".gt-talent-node")
      .on("mouseenter focus", ev => GT.showFloatingTooltip(ev.currentTarget, ev.currentTarget.dataset.gtTooltip))
      .on("mouseleave blur", () => GT.hideFloatingTooltip());
    html.find(".gt-talent-node").on("click", async ev => {
      ev.preventDefault();
      if (this.actor.system?.sheetLocked) return ui.notifications.warn("Der Charakterbogen ist gesperrt.");
      const button = ev.currentTarget;
      const tree = button.dataset.tree;
      const node = button.dataset.node;
      const data = await GT.getTalentScaffold();
      const treeData = data.trees.find(t => t.id === tree);
      const nodeData = treeData?.nodes.find(n => n.id === node);
      if (!nodeData) return;
      const path = `talentTree.learned.${tree}.${node}`;
      const isLearned = !!getProperty(this.actor.system, path);
      const update = {};
      if (isLearned) {
        const isCharacter = this.actor.type === "character";
        update[`system.${path}`] = false;
        const usesMap = deepClone(this.actor.system?.talentTree?.uses ?? {});
        const removedPoolKey = GT.talentUsePoolKey(tree, nodeData);
        const tempSystem = deepClone(this.actor.system ?? {});
        setProperty(tempSystem, path, false);
        const nextPools = GT.talentUsePoolsForSystem(tempSystem, data);
        if (!nextPools[removedPoolKey]) delete usesMap[removedPoolKey];
        else usesMap[removedPoolKey] = Math.min(Number(usesMap[removedPoolKey] ?? nextPools[removedPoolKey].max), nextPools[removedPoolKey].max);
        update["system.talentTree.uses"] = usesMap;
        if (isCharacter) update["system.lp.value"] = Number(this.actor.system?.lp?.value ?? 0) + Number(nodeData.lpCost || 0);
        await this.actor.update(update); return this.render(false);
      }
      const learnedTree = getProperty(this.actor.system, `talentTree.learned.${tree}`) ?? {};
      const reqsMet = (nodeData.requires ?? []).every(r => learnedTree[r]);
      if (!reqsMet) return ui.notifications.warn("Voraussetzungen sind noch nicht erfüllt.");
      const isCharacter = this.actor.type === "character";
      const attrCheck = GT.actorMeetsTalentAttributeRequirements(this.actor, nodeData);
      if (isCharacter && !attrCheck.met) return ui.notifications.warn(`Mindestattribute nicht erfüllt: ${attrCheck.missing.map(m => `${m.label} ${m.current}/${m.min}`).join(", ")}.`);
      const cost = isCharacter ? Number(nodeData.lpCost || 0) : 0;
      const lp = Number(this.actor.system?.lp?.value ?? 0);
      if (isCharacter && lp < cost) return ui.notifications.warn("Nicht genug Lernpunkte.");
      update[`system.${path}`] = true;
      const uses = GT.talentUsesConfig(nodeData);
      if (uses.max) {
        const usesMap = deepClone(this.actor.system?.talentTree?.uses ?? {});
        const poolKey = GT.talentUsePoolKey(tree, nodeData);
        const current = Number(usesMap[poolKey] ?? 0);
        usesMap[poolKey] = Math.max(current, uses.max);
        update["system.talentTree.uses"] = usesMap;
      }
      if (isCharacter) update["system.lp.value"] = lp - cost;
      await this.actor.update(update);
      this.render(false);
    });
  }
}

/** Spielerfenster für die Initiativeentscheidung im vorhandenen Gothic-Tales-Stil. */
class GothicTalesInitiativeDialog extends GothicTalesApplicationV2 {
  constructor(payload, actor) {
    super({window: {title: `Initiative: ${actor?.name || "Charakter"}`}, position: {width: 520, height: "auto"}});
    this.payload = payload;
    this.actor = actor;
    this.dialogKey = `${payload?.requestId}.${payload?.combatantId}`;
  }

  static DEFAULT_OPTIONS = {
    classes: ["gothic-tales", "gt-app", "gt-v2-window", "gt-dialog-window", "gt-initiative-window"],
    window: {title: "Initiative", resizable: true},
    position: {width: 520}
  };

  static PARTS = {body: {template: "systems/gothic-tales/templates/dialog-initiative.hbs", scrollable: [".gt-initiative-dialog"]}};

  getData() {
    const initiative = this.actor?.system?.initiative ?? {};
    const bonus = Number(initiative.bonus ?? 0);
    return {
      actor: this.actor,
      initiative,
      bonusText: `${bonus >= 0 ? "+" : ""}${bonus}`
    };
  }

  activateListeners(html) {
    super.activateListeners(html);
    const root = GT.htmlRoot(html);
    root.querySelector(".gt-dialog-cancel")?.addEventListener("click", ev => {
      ev.preventDefault();
      this.close();
    });
    root.querySelector(".gt-initiative-submit")?.addEventListener("click", ev => {
      ev.preventDefault();
      const method = String(root.querySelector('input[name="method"]:checked')?.value || "roll");
      const mode = String(root.querySelector('input[name="mode"]:checked')?.value || "normal");
      const level = Number(root.querySelector('select[name="level"]')?.value || 2);
      GT.submitInitiativeChoice({...this.payload, method, mode, level});
      this.close();
    });
    const updateModeState = () => {
      const yieldDie = root.querySelector('input[name="method"]:checked')?.value === "yield";
      root.querySelectorAll('input[name="mode"], select[name="level"]').forEach(control => { control.disabled = yieldDie; });
    };
    root.querySelectorAll('input[name="method"]').forEach(control => control.addEventListener("change", updateModeState));
    updateModeState();
  }

  async close(options = {}) {
    GT._openInitiativeDialogs?.delete?.(this.dialogKey);
    return super.close(options);
  }
}

/** Vollständiger Combat-Workflow für Gothic-Tales-Initiative. */
GT.primaryActiveGM = function(preferredId = null) {
  if (preferredId) {
    const preferred = game.users?.get?.(preferredId);
    if (preferred?.active && preferred.isGM) return preferred;
  }
  return Array.from(game.users ?? []).filter(user => user.active && user.isGM).sort((a, b) => String(a.id).localeCompare(String(b.id)))[0] ?? null;
};

GT.initiativeChoiceResult = function(actor, {method = "roll", mode = "normal", level = 2} = {}) {
  const initiative = actor?.system?.initiative ?? {};
  const bonus = Number(initiative.bonus ?? 0);
  if (method === "yield") return {method, mode: "normal", level: 0, formula: String(bonus), total: bonus, result: null};
  const formula = GT.initiativeFormula(actor);
  const rollOptions = mode === "normal" ? {} : {advantageMode: mode, advantageLevel: Number(level || 2)};
  const result = GT.rollGT(formula, rollOptions);
  return {method, mode, level: Number(level || 0), formula, total: result.total, result};
};

GT.initiativeChatContent = function(actor, choice = null, {fixed = false, combatant = null} = {}) {
  const ini = actor?.system?.initiative ?? {};
  const total = fixed ? Number(ini.value ?? 0) : Number(choice?.total ?? 0);
  const method = fixed ? "Festwert vom Bogen" : (choice?.method === "yield" ? "Würfel abgegeben – nur Bonus" : "Initiative gewürfelt");
  const mode = fixed ? "Gegner würfelt nicht" : GT.initiativeModeLabel(choice?.mode, choice?.level);
  const formula = fixed ? String(ini.value ?? 0) : (choice?.formula || "");
  const actorName = actor?.name || combatant?.name || "Initiative";
  const cardStateClass = fixed ? "gt-combat-fixed-card" : (choice?.method === "yield" ? "gt-combat-yield-card" : "gt-combat-initiative-card");
  const stateIcon = fixed ? "fa-shield-halved" : (choice?.method === "yield" ? "fa-hand" : "fa-swords");
  return `<div class="gothic-tales chat-card gt-roll-card gt-combat-roll-card ${cardStateClass}">
    <header class="gt-roll-card-header gt-combat-card-header">
      <div>
        <div class="gt-combat-card-kicker">Combat Encounter</div>
        <h2>${GT.escape(actorName)}</h2>
        <div class="gt-roll-actor">${GT.escape(method)}</div>
      </div>
      <div class="gt-roll-card-icon"><i class="fas ${stateIcon}"></i></div>
    </header>
    <div class="gt-roll-flavor gt-combat-card-flavor"><i class="fas fa-flag-checkered"></i> ${GT.escape(mode)}</div>
    <div class="gt-special-card-details gt-combat-card-details">
      <span><b>Grundwert</b>${Number(ini.value ?? 0)}</span>
      <span><b>Würfel</b>${GT.escape(ini.die || "—")}</span>
      <span><b>Bonus</b>${Number(ini.bonus ?? 0) >= 0 ? "+" : ""}${Number(ini.bonus ?? 0)}</span>
      <span><b>Methode</b>${GT.escape(method)}</span>
    </div>
    <div class="gt-roll-formula"><span>Formel</span><code>${GT.escape(formula || "—")}</code></div>
    <footer class="gt-roll-total gt-combat-card-total"><span>Initiative</span><strong>${total}</strong></footer>
  </div>`;
};

GT.postInitiativeCard = async function(actor, choice, {combatant = null, fixed = false, hidden = false} = {}) {
  const messageData = hidden && game.user?.isGM ? {whisper: ChatMessage.getWhisperRecipients("GM").map(user => user.id)} : {};
  return ChatMessage.create({
    speaker: ChatMessage.getSpeaker({actor}),
    content: GT.initiativeChatContent(actor, choice, {fixed, combatant}),
    flags: {"gothic-tales": {cardType: "initiative", combatId: combatant?.parent?.id || "", combatantId: combatant?.id || "", method: fixed ? "fixed" : choice?.method, total: fixed ? Number(actor.system?.initiative?.value || 0) : Number(choice?.total || 0)}},
    ...messageData
  });
};

GT.rollActorInitiative = async function(actor, options = {}) {
  if (!actor) return;
  if (actor.type !== "character" && (actor.system?.initiative?.fixed !== false || !String(actor.system?.initiative?.die || "").trim())) return GT.postInitiativeCard(actor, null, {fixed: true});
  const choice = GT.initiativeChoiceResult(actor, options);
  if (choice.result) GT.showDiceSoNice(choice.result).catch(err => console.warn(err));
  return GT.postInitiativeCard(actor, choice);
};

GT.ownedInitiativeUsers = function(actor) {
  const ownerLevel = CONST.DOCUMENT_OWNERSHIP_LEVELS?.OWNER ?? 3;
  return Array.from(game.users ?? []).filter(user => user.active && !user.isGM && (user.character?.id === actor?.id || actor?.testUserPermission?.(user, ownerLevel)));
};

GT.openInitiativeDialog = function(payload) {
  const combat = game.combats?.get?.(payload.combatId);
  const combatant = combat?.combatants?.get?.(payload.combatantId);
  const actor = combatant?.actor;
  if (!combat || !combatant || !actor) return;
  const key = `${payload.requestId}.${combatant.id}`;
  GT._openInitiativeDialogs ??= new Set();
  if (GT._openInitiativeDialogs.has(key)) return;
  GT._openInitiativeDialogs.add(key);
  new GothicTalesInitiativeDialog(payload, actor).render(true);
};

GT.submitInitiativeChoice = function({combatId, combatantId, requestId, gmUserId, method, mode, level}) {
  const payload = {type: "initiativeChoice", combatId, combatantId, requestId, gmUserId, userId: game.user.id, method, mode, level};
  if (game.user.id === gmUserId && game.user.isGM) return GT.resolveInitiativeChoice(payload);
  game.socket?.emit?.("system.gothic-tales", payload);
  ui.notifications.info("Initiativeauswahl wurde an die Spielleitung übermittelt.");
};

GT.resolveInitiativeChoice = async function(payload) {
  if (!game.user.isGM || game.user.id !== payload.gmUserId) return;
  const combat = game.combats?.get?.(payload.combatId);
  const combatant = combat?.combatants?.get?.(payload.combatantId);
  const actor = combatant?.actor;
  if (!combat || !combatant || !actor || actor.type !== "character") return;
  const state = combat.getFlag("gothic-tales", "initiativeRequest") ?? {};
  if (state.requestId !== payload.requestId || !Array.isArray(state.pending) || !state.pending.includes(combatant.id)) return;
  const submittingUser = game.users?.get?.(payload.userId);
  const ownerLevel = CONST.DOCUMENT_OWNERSHIP_LEVELS?.OWNER ?? 3;
  if (!submittingUser || !(submittingUser.isGM || submittingUser.character?.id === actor.id || actor.testUserPermission?.(submittingUser, ownerLevel))) return;
  const choice = GT.initiativeChoiceResult(actor, {method: payload.method === "yield" ? "yield" : "roll", mode: ["advantage", "disadvantage"].includes(payload.mode) ? payload.mode : "normal", level: Number(payload.level || 2)});
  if (choice.result) GT.showDiceSoNice(choice.result).catch(err => console.warn(err));
  await combat.setInitiative(combatant.id, choice.total);
  state.pending = state.pending.filter(id => id !== combatant.id);
  await combat.setFlag("gothic-tales", "initiativeRequest", state);
  await GT.postInitiativeCard(actor, choice, {combatant});
};

GT.enemyInitiativeFormula = function(actor) {
  const ini = actor?.system?.initiative ?? {};
  if (String(ini.die || "").trim()) return GT.initiativeFormula(actor);
  const derived = GT.attrFromValue(Number(ini.value ?? 10));
  return `${derived.die} ${derived.bonus >= 0 ? "+" : "-"} ${Math.abs(derived.bonus)}`;
};

GT.applyEnemyInitiative = async function(combat = game.combat, {roll = false} = {}) {
  if (!game.user.isGM || !combat) return;
  for (const combatant of Array.from(combat.combatants ?? [])) {
    const actor = combatant.actor;
    if (!actor || actor.type === "character") continue;
    if (!roll) {
      await combat.setInitiative(combatant.id, Number(actor.system?.initiative?.value ?? 0));
      await GT.postInitiativeCard(actor, null, {combatant, fixed: true, hidden: !!combatant.hidden});
    } else {
      const formula = GT.enemyInitiativeFormula(actor);
      const result = GT.rollGT(formula);
      GT.showDiceSoNice(result).catch(err => console.warn(err));
      const choice = {method: "roll", mode: "normal", level: 0, formula, total: result.total, result};
      await combat.setInitiative(combatant.id, result.total);
      await GT.postInitiativeCard(actor, choice, {combatant, hidden: !!combatant.hidden});
    }
  }
};

GT.requestCombatInitiative = async function(combat = game.combat) {
  if (!game.user.isGM) return ui.notifications.warn("Nur die Spielleitung kann Initiative anfordern.");
  if (!combat) return ui.notifications.warn("Es ist kein aktiver Kampf vorhanden.");
  const gm = GT.primaryActiveGM(game.user.id);
  const requestId = foundry.utils.randomID?.() ?? `${Date.now()}-${Math.random()}`;
  const pending = [], requests = [];
  let enemyCount = 0;
  for (const combatant of Array.from(combat.combatants ?? [])) {
    const actor = combatant.actor;
    if (!actor) continue;
    if (actor.type !== "character") {
      enemyCount += 1;
      await combat.setInitiative(combatant.id, Number(actor.system?.initiative?.value ?? 0));
      await GT.postInitiativeCard(actor, null, {combatant, fixed: true, hidden: !!combatant.hidden});
      continue;
    }
    pending.push(combatant.id);
    const owners = GT.ownedInitiativeUsers(actor);
    requests.push({type: "initiativeRequest", combatId: combat.id, combatantId: combatant.id, requestId, gmUserId: gm?.id || game.user.id, userIds: owners.length ? owners.map(u => u.id) : [game.user.id]});
  }
  await combat.setFlag("gothic-tales", "initiativeRequest", {requestId, pending, gmUserId: gm?.id || game.user.id, requestedAt: Date.now()});
  for (const request of requests) {
    game.socket?.emit?.("system.gothic-tales", request);
    if (request.userIds.includes(game.user.id)) GT.openInitiativeDialog(request);
  }
  await ChatMessage.create({content: `<div class="gothic-tales chat-card gt-roll-card gt-combat-request-card">
    <header class="gt-roll-card-header gt-combat-card-header">
      <div>
        <div class="gt-combat-card-kicker">Combat Encounter</div>
        <h2>Initiative angefordert</h2>
        <div class="gt-roll-actor">Die Schlacht beginnt</div>
      </div>
      <div class="gt-roll-card-icon"><i class="fas fa-bullhorn"></i></div>
    </header>
    <div class="gt-roll-flavor gt-combat-card-flavor"><i class="fas fa-users"></i> Alle Kampfteilnehmer werden auf ihre Initiative vorbereitet.</div>
    <div class="gt-special-card-details gt-combat-card-details gt-combat-request-details">
      <span><b>Spieler offen</b>${pending.length}</span>
      <span><b>Gegner-Festwerte</b>${enemyCount}</span>
    </div>
    <footer class="gt-combat-request-footer"><i class="fas fa-hourglass-half"></i><span>Warte auf die Initiativeentscheidungen der Spieler.</span></footer>
  </div>`, flags: {"gothic-tales": {cardType: "combat", combatId: combat.id, requestId}}});
};

GT.injectCombatTrackerControls = function(html) {
  if (!game.user?.isGM) return;
  const root = GT.htmlRoot(html);
  if (!root || root.querySelector(".gt-combat-controls")) return;
  const target = root.querySelector(".combat-tracker-header, .encounter-controls, header") || root;
  const controls = document.createElement("div");
  controls.className = "gt-combat-controls";
  controls.innerHTML = `<button type="button" data-action="request"><i class="fas fa-bullhorn"></i> Initiative anfordern</button><button type="button" data-action="fixed"><i class="fas fa-list-ol"></i> Gegnerwerte</button><button type="button" data-action="roll"><i class="fas fa-dice"></i> Gegner würfeln</button>`;
  controls.addEventListener("click", event => {
    const action = event.target.closest("button")?.dataset.action;
    if (action === "request") GT.requestCombatInitiative(game.combat);
    if (action === "fixed") GT.applyEnemyInitiative(game.combat, {roll: false});
    if (action === "roll") GT.applyEnemyInitiative(game.combat, {roll: true});
  });
  target.appendChild(controls);
};

/** Zustand der Gothic-Tales-Würfelablage. */
GT.manualDiceSides = Object.freeze([2, 4, 6, 8, 10, 12, 20]);
GT.createManualDiceState = () => Object.fromEntries(GT.manualDiceSides.map(sides => [sides, 0]));
GT.manualDiceState = GT.createManualDiceState();
GT.manualDiceBonus = 0;

/** Wendet Gothic-Tales-UI-Klassen und Hintergrundvariablen auf Foundry-Oberflächenelemente an. */
GT.applyTheme = function() {
  for (const node of [document.documentElement, document.body]) {
    if (!node) continue;
    node.classList.add("gt-system-ui", "gt-readable-ui");
    node.classList.remove("gt-theme-light", "gt-theme-dark");
    delete node.dataset.gtTheme;
  }
  document.documentElement?.style?.setProperty("--gt-system-background-image", "url('../assets/gt-background.webp')");
  GT.updateManualDiceDisplay?.();
};

GT.buildManualDiceFormula = function() {
  const parts = [];
  for (const die of GT.manualDiceSides) {
    const count = Number(GT.manualDiceState?.[die] || 0);
    if (count > 0) parts.push(`${count > 1 ? count : ""}w${die}`);
  }
  const bonus = Number(GT.manualDiceBonus || 0);
  let formula = parts.join(" + ");
  if (bonus > 0) formula += `${formula ? " + " : ""}${bonus}`;
  if (bonus < 0) formula += `${formula ? " - " : "-"}${Math.abs(bonus)}`;
  return formula.trim();
};

GT.manualDiceButtonMarkup = function(sides) {
  const die = Number(sides);
  return `<button type="button" class="gt-chat-die-button" data-die="${die}" aria-label="W${die} hinzufügen" title="W${die}: Linksklick hinzufügen, Rechtsklick entfernen">
    <span class="gt-die-count" aria-hidden="true">0</span>
    <span class="gt-tray-die-shape gt-tray-die-w${die}" aria-hidden="true"><span>${die}</span></span>
    <span class="gt-die-label">W${die}</span>
  </button>`;
};

GT.manualDiceTrayMarkup = function() {
  return `<section class="gt-chat-dice-tray gt-dice-tray-v2" data-gt-dice-tray="true" aria-label="Gothic Tales Würfelablage">
    <div class="gt-dice-tray-heading">
      <span class="gt-dice-tray-title"><i class="fas fa-dice"></i> Würfelablage</span>
      <code class="gt-chat-dice-formula" aria-live="polite">Bereit</code>
    </div>
    <div class="gt-chat-dice-buttons" role="group" aria-label="Würfel auswählen">
      ${GT.manualDiceSides.map(GT.manualDiceButtonMarkup).join("")}
    </div>
    <div class="gt-chat-dice-controls">
      <div class="gt-chat-modifier-control" role="group" aria-label="Modifikator">
        <button type="button" class="gt-chat-bonus-step" data-bonus="-1" title="Modifikator verringern"><i class="fas fa-minus"></i></button>
        <label class="gt-chat-bonus-wrap"><span>Mod.</span><input class="gt-chat-bonus" type="number" value="0" step="1" inputmode="numeric" aria-label="Wurfmodifikator"></label>
        <button type="button" class="gt-chat-bonus-step" data-bonus="1" title="Modifikator erhöhen"><i class="fas fa-plus"></i></button>
      </div>
      <button type="button" class="gt-chat-clear-button" title="Auswahl zurücksetzen" disabled><i class="fas fa-rotate-left"></i><span>Leeren</span></button>
      <button type="button" class="gt-chat-roll-button" title="Ausgewählte Formel würfeln" disabled><i class="fas fa-dice-d20"></i><span>Würfeln</span></button>
    </div>
    <div class="gt-dice-tray-help"><span>Linksklick <b>+1</b></span><span>Rechtsklick <b>−1</b></span><span>Mausrad auf Modifikator</span></div>
  </section>`;
};

GT.updateManualDiceDisplay = function() {
  const formula = GT.buildManualDiceFormula();
  const hasSelection = !!formula;
  for (const tray of document.querySelectorAll(".gt-chat-dice-tray")) {
    const display = tray.querySelector(".gt-chat-dice-formula");
    if (display) {
      display.textContent = formula || "Bereit";
      display.classList.toggle("is-empty", !formula);
    }
    for (const die of GT.manualDiceSides) {
      const btn = tray.querySelector(`[data-die="${die}"]`);
      if (!btn) continue;
      const count = Number(GT.manualDiceState?.[die] || 0);
      btn.classList.toggle("is-selected", count > 0);
      btn.setAttribute("aria-pressed", String(count > 0));
      btn.setAttribute("aria-label", `W${die}: ${count} ausgewählt. Linksklick hinzufügen, Rechtsklick entfernen.`);
      const countNode = btn.querySelector(".gt-die-count");
      if (countNode) {
        countNode.textContent = String(count);
        countNode.hidden = count <= 0;
      }
    }
    const bonus = tray.querySelector(".gt-chat-bonus");
    if (bonus && document.activeElement !== bonus) bonus.value = String(Number(GT.manualDiceBonus || 0));
    const roll = tray.querySelector(".gt-chat-roll-button");
    if (roll) roll.disabled = !hasSelection;
    const clear = tray.querySelector(".gt-chat-clear-button");
    if (clear) clear.disabled = !hasSelection;
    tray.classList.toggle("has-selection", hasSelection);
  }
};

GT.changeManualDie = function(sides, delta = 1) {
  const die = Number(sides);
  if (!GT.manualDiceSides.includes(die)) return;
  GT.manualDiceState[die] = Math.max(0, Number(GT.manualDiceState?.[die] || 0) + Number(delta || 0));
  GT.updateManualDiceDisplay();
};
GT.addManualDie = sides => GT.changeManualDie(sides, 1);
GT.removeManualDie = sides => GT.changeManualDie(sides, -1);
GT.changeManualBonus = delta => {
  GT.manualDiceBonus = Number(GT.manualDiceBonus || 0) + Number(delta || 0);
  GT.updateManualDiceDisplay();
};
GT.clearManualDice = function() {
  GT.manualDiceState = GT.createManualDiceState();
  GT.manualDiceBonus = 0;
  GT.updateManualDiceDisplay();
};
GT.rollManualDice = async function() {
  const formula = GT.buildManualDiceFormula();
  if (!formula) return ui.notifications?.warn?.("Bitte wähle mindestens einen Würfel oder einen Modifikator aus.");
  const message = await GT.chatRoll({formula, label: "Freier Würfelwurf", flavor: "Gothic-Tales-Würfelablage", configure: false});
  if (message) GT.clearManualDice();
  return message;
};

GT.bindDiceTray = function(tray) {
  if (!tray || tray.dataset.gtBound === "true") return tray;
  tray.dataset.gtBound = "true";
  tray.addEventListener("click", event => {
    const die = event.target.closest(".gt-chat-die-button");
    if (die) {
      event.preventDefault();
      event.stopPropagation();
      GT.addManualDie(die.dataset.die);
      return;
    }
    const step = event.target.closest(".gt-chat-bonus-step");
    if (step) {
      event.preventDefault();
      event.stopPropagation();
      GT.changeManualBonus(Number(step.dataset.bonus || 0));
      return;
    }
    if (event.target.closest(".gt-chat-clear-button")) {
      event.preventDefault();
      event.stopPropagation();
      GT.clearManualDice();
      return;
    }
    if (event.target.closest(".gt-chat-roll-button")) {
      event.preventDefault();
      event.stopPropagation();
      GT.rollManualDice();
    }
  });
  tray.addEventListener("contextmenu", event => {
    const die = event.target.closest(".gt-chat-die-button");
    if (!die) return;
    event.preventDefault();
    event.stopPropagation();
    GT.removeManualDie(die.dataset.die);
  });
  tray.addEventListener("input", event => {
    const input = event.target.closest(".gt-chat-bonus");
    if (!input) return;
    const value = Number(input.value);
    GT.manualDiceBonus = Number.isFinite(value) ? value : 0;
    GT.updateManualDiceDisplay();
  });
  tray.addEventListener("focusin", event => {
    const input = event.target.closest(".gt-chat-bonus");
    input?.select?.();
  });
  tray.addEventListener("wheel", event => {
    const input = event.target.closest(".gt-chat-bonus");
    if (!input) return;
    event.preventDefault();
    GT.changeManualBonus(event.deltaY < 0 ? 1 : -1);
  }, {passive: false});
  return tray;
};

GT.resolveChatTrayHost = function(html = null) {
  const supplied = GT.htmlRoot(html);
  if (supplied) {
    if (supplied.matches?.("#chat, #chat-popout, .chat-popout, [data-tab='chat']")) return supplied;
    const nested = supplied.closest?.("#chat, #chat-popout, .chat-popout, [data-tab='chat']")
      || supplied.querySelector?.("#chat, #chat-popout, .chat-popout, [data-tab='chat']");
    if (nested) return nested;
    if (supplied.querySelector?.("#chat-form, .chat-form, #chat-message")) return supplied;
  }
  return document.querySelector("#chat") || document.querySelector("#chat-popout, .chat-popout") || supplied;
};

GT.injectDiceTray = function(html = null) {
  if (GT.setting("chatDiceTrayMode") === "hidden") {
    document.querySelectorAll(".gt-chat-dice-tray").forEach(el => el.remove());
    return null;
  }
  const chat = GT.resolveChatTrayHost(html);
  if (!chat?.querySelector) return null;
  let tray = chat.querySelector(".gt-chat-dice-tray");
  if (!tray) {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = GT.manualDiceTrayMarkup().trim();
    tray = wrapper.firstElementChild;
    const messageInput = chat.querySelector("#chat-message");
    const form = messageInput?.closest?.("form") || chat.querySelector("#chat-form, form.chat-form, .chat-form");
    // Die Würfelablage gehört unter die vollständige Chateingabe – nicht zwischen Eingabefeld und Foundry-Steuerung.
    if (form?.insertAdjacentElement) form.insertAdjacentElement("afterend", tray);
    else if (messageInput?.insertAdjacentElement) messageInput.insertAdjacentElement("afterend", tray);
    else chat.append(tray);
  } else if (!tray.classList.contains("gt-dice-tray-v2")) {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = GT.manualDiceTrayMarkup().trim();
    const replacement = wrapper.firstElementChild;
    tray.replaceWith(replacement);
    tray = replacement;
  }
  const isPopout = !!chat.closest?.("#chat-popout, .chat-popout") || chat.matches?.("#chat-popout, .chat-popout");
  tray.id = isPopout ? "gt-dice-tray-popout" : "gt-dice-tray-main";
  GT.bindDiceTray(tray);
  GT.updateManualDiceDisplay();
  return tray;
};

/** Scrollt interne Nachschlagewerk-Anker innerhalb des Foundry-Journalfensters statt die Browser-URL zu ändern. */
GT.scrollReferenceAnchor = function(link) {
  const anchor = String(link?.dataset?.gtAnchor || link?.getAttribute?.("href") || "").replace(/^#/, "");
  if (!anchor) return false;
  const root = link.closest(".journal-entry-page, .journal-page-content, .window-content, .app, body") || document;
  const escaped = globalThis.CSS?.escape ? CSS.escape(anchor) : anchor.replace(/([ #;?%&,.+*~\':"!^$[\]()=>|/@])/g, "\\$1");
  const target = root.querySelector(`#${escaped}, [data-gt-anchor-target="${escaped}"], [data-gt-anchor-section="${escaped}"]`) || document.getElementById(anchor);
  if (!target) return false;
  target.scrollIntoView({behavior: "smooth", block: "start"});
  target.classList.add("gt-reference-target-flash");
  window.setTimeout(() => target.classList.remove("gt-reference-target-flash"), 1400);
  return true;
};

/** Fängt Klicks der Würfeltabelle ab, auch wenn Foundry den Chat neu rendert oder die Tabelle verschiebt. */
GT.installGlobalClickHandlers = function() {
  if (GT._globalClickHandlersInstalled) return;
  GT._globalClickHandlersInstalled = true;
  document.addEventListener("click", event => {
    const referenceLink = event.target?.closest?.(".gt-combined-reference a[data-gt-anchor], .gt-combined-reference a[href^='#']");
    if (referenceLink && GT.scrollReferenceAnchor(referenceLink)) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);
};

/** Foundry-init: registriert Helfer, Einstellungen, Bögen, Templates und öffentliche game.gothicTales-APIs. */


class GothicTalesProfessionTree extends GothicTalesApplicationV2 {
  constructor(actor, options = {}) { super(options); this.actor = actor; this.activeTree = "berufe"; }
  static DEFAULT_OPTIONS = {
    id: "gothic-tales-profession-tree",
    classes: ["gothic-tales", "gt-app", "gt-v2-window", "gt-talent-tree-window", "gt-profession-tree-window"],
    window: {title: "Gothic Tales Berufe", resizable: true},
    position: {width: 1040, height: 780}
  };
  static PARTS = {body: {template: "systems/gothic-tales/templates/talent-tree.hbs", scrollable: [".gt-talent-app"]}};
  async getData() {
    const data = await GT.getProfessionScaffold();
    const learnedRoot = this.actor.system?.professions?.learned ?? {};
    const lp = Number(this.actor.system?.lp?.value ?? 0);
    const isCharacter = this.actor.type === "character";
    const learnedCount = GT.learnedProfessionCount(this.actor.system, data);
    const trees = data.trees.map(tree => {
      const learned = learnedRoot[tree.id] ?? {};
      const nodes = tree.nodes.map(n => {
        const cost = isCharacter ? Number(n.lpCost || 0) : 0;
        const enoughLp = !isCharacter || lp >= cost;
        const learnedNode = !!learned[n.id];
        const reqsMet = (n.requires ?? []).every(r => learned[r]);
        const group = String(n.rankGroup || n.id);
        const groupAlreadyLearned = (tree.nodes ?? []).some(other => String(other.rankGroup || other.id) === group && !!learned[other.id]);
        const available = learnedNode || (reqsMet && enoughLp);
        const displayCost = isCharacter ? (Number(n.lpCost || 0) ? `${n.lpCost} LP` : "frei") : "NSC/Monster";
        const missingReason = [];
        if (!reqsMet) missingReason.push("Voraussetzung fehlt");
        if (!enoughLp) missingReason.push("nicht genug LP");
        if (!learnedNode && !groupAlreadyLearned && learnedCount >= 3) missingReason.push("normalerweise maximal 3 Berufe");
        const attributeText = GT.professionAttributeText(n);
        const tooltip = GT.talentDetailsHtml({descriptionHtml: n.descriptionHtml || GT.talentDescriptionHtml(n.description || ""), usageText: attributeText, attributeText: "Lehrer oder Lernmoment nötig"});
        const lockedInfo = missingReason.length ? `<p class="gt-tooltip-meta"><strong>Hinweis:</strong> ${GT.escape(missingReason.join("; "))}</p>` : "";
        return {...n, displayLabel: GT.talentDisplayLabel(n), learned: learnedNode, available, displayCost, attrRequirementText: attributeText, usesText: "Beruf", consumeText: "", tooltip: `${tooltip}${lockedInfo}`, missingReason: missingReason.join("; ")};
      });
      return {...tree, active: tree.id === this.activeTree, nodes};
    });
    return {actor: this.actor, system: this.actor.system, trees, isCharacter};
  }
  activateListeners(html) {
    super.activateListeners(html);
    html.find(".gt-tree-select").on("click", ev => { this.activeTree = ev.currentTarget.dataset.tree; GT.hideFloatingTooltip(); this.render(false); });
    html.find(".gt-talent-node")
      .on("mouseenter focus", ev => GT.showFloatingTooltip(ev.currentTarget, ev.currentTarget.dataset.gtTooltip))
      .on("mouseleave blur", () => GT.hideFloatingTooltip());
    html.find(".gt-talent-node").on("click", ev => {
      ev.preventDefault();
      const button = ev.currentTarget;
      GT.openProfessionDetail(this.actor, button.dataset.tree, button.dataset.node);
    });
  }
}

class GothicTalesProfessionDetail extends GothicTalesApplicationV2 {
  constructor(actor, treeId, nodeId, options = {}) {
    super(options);
    this.actor = actor;
    this.treeId = treeId || "berufe";
    this.nodeId = nodeId;
  }
  static DEFAULT_OPTIONS = {
    id: "gothic-tales-profession-detail",
    classes: ["gothic-tales", "gt-app", "gt-v2-window", "gt-dialog-window", "gt-profession-detail-window"],
    window: {title: "Beruf", resizable: true},
    position: {width: 760, height: "auto"}
  };
  static PARTS = {body: {template: "systems/gothic-tales/templates/dialog-profession-detail.hbs", scrollable: [".gt-profession-detail"]}};
  async getData() {
    const {tree, node} = await GT.findProfessionNode(this.treeId, this.nodeId);
    const learned = !!getProperty(this.actor.system, `professions.learned.${tree?.id}.${node?.id}`);
    const isCharacter = this.actor.type === "character";
    const cost = isCharacter ? Number(node?.lpCost || 0) : 0;
    return {
      actor: this.actor,
      tree,
      node,
      learned,
      isGM: !!game.user?.isGM,
      isLockpicking: node?.special === "lockpicking",
      displayCost: isCharacter ? (cost ? `${cost} LP` : "frei") : "NSC/Monster",
      attributeText: GT.professionAttributeText(node),
      formula: GT.professionFormula(this.actor, node)
    };
  }
  activateListeners(html) {
    super.activateListeners(html);
    const root = GT.htmlRoot(html);
    root.querySelector(".gt-dialog-cancel")?.addEventListener("click", ev => { ev.preventDefault(); this.close(); });
    root.querySelector(".gt-profession-learn")?.addEventListener("click", async ev => {
      ev.preventDefault();
      const changed = await GT.toggleProfessionLearned(this.actor, this.treeId, this.nodeId);
      if (changed) this.render(false);
    });
    root.querySelector(".gt-profession-roll")?.addEventListener("click", async ev => {
      ev.preventDefault();
      const {node} = await GT.findProfessionNode(this.treeId, this.nodeId);
      if (!node) return;
      GT.chatRoll({formula: GT.professionFormula(this.actor, node), label: node.label, actor: this.actor, flavor: "Berufswurf"});
    });
  }
}


class GothicTalesProfessionToolsDialog extends GothicTalesApplicationV2 {
  constructor(options = {}) { super(options); this.activeTab = options.activeTab || "professions"; }

  static DEFAULT_OPTIONS = {
    id: "gothic-tales-dm-tools",
    classes: ["gothic-tales", "gt-app", "gt-v2-window", "gt-dialog-window", "gt-profession-tools-window", "gt-dm-tools-window"],
    window: {title: "Gothic-Tales DM-Tools", resizable: false},
    position: {width: 640, height: "auto"}
  };
  static PARTS = {body: {template: "systems/gothic-tales/templates/dialog-profession-tools.hbs"}};

  getData() {
    return {
      isGM: !!game.user?.isGM,
      activeTab: this.activeTab,
      professionsActive: this.activeTab === "professions",
      generatorsActive: this.activeTab === "generators"
    };
  }

  activateListeners(html) {
    super.activateListeners(html);
    const root = GT.htmlRoot(html);
    const setTab = tab => {
      this.activeTab = tab || "professions";
      root.querySelectorAll(".gt-dm-tools-tab").forEach(btn => btn.classList.toggle("active", btn.dataset.tab === this.activeTab));
      root.querySelectorAll(".gt-dm-tools-panel").forEach(panel => panel.classList.toggle("active", panel.dataset.panel === this.activeTab));
    };

    root.querySelectorAll(".gt-dm-tools-tab").forEach(button => button.addEventListener("click", ev => {
      ev.preventDefault();
      setTab(ev.currentTarget.dataset.tab);
    }));

    root.querySelector(".gt-dialog-cancel")?.addEventListener("click", ev => { ev.preventDefault(); this.close(); });

    root.querySelector(".gt-dm-tools-open-professions")?.addEventListener("click", ev => {
      ev.preventDefault();
      setTab("professions");
    });

    root.querySelector(".gt-profession-tool-lockpicking")?.addEventListener("click", ev => {
      ev.preventDefault();
      this.close();
      new GothicTalesLockpickingGMDialog().render(true);
    });

    root.querySelector(".gt-profession-tool-haggling")?.addEventListener("click", ev => {
      ev.preventDefault();
      this.close();
      new GothicTalesHagglingGMDialog().render(true);
    });

    root.querySelector(".gt-profession-tool-pickpocketing")?.addEventListener("click", ev => {
      ev.preventDefault();
      this.close();
      new GothicTalesPickpocketingGMDialog().render(true);
    });

    root.querySelector(".gt-profession-tool-alchemy")?.addEventListener("click", ev => {
      ev.preventDefault();
      this.close();
      new GothicTalesAlchemyGMDialog().render(true);
    });

    root.querySelector(".gt-profession-tool-mining")?.addEventListener("click", ev => {
      ev.preventDefault();
      this.close();
      new GothicTalesMiningGMDialog().render(true);
    });

    root.querySelector(".gt-profession-tool-smithing")?.addEventListener("click", ev => {
      ev.preventDefault();
      this.close();
      new GothicTalesSmithingGMDialog().render(true);
    });

    root.querySelector(".gt-profession-tool-carving")?.addEventListener("click", ev => {
      ev.preventDefault();
      this.close();
      new GothicTalesCarvingGMDialog().render(true);
    });

    root.querySelector(".gt-profession-tool-herbalism")?.addEventListener("click", ev => {
      ev.preventDefault();
      this.close();
      new GothicTalesHerbalismGMDialog().render(true);
    });

    root.querySelector(".gt-dm-tools-character-creator")?.addEventListener("click", ev => {
      ev.preventDefault();
      const actor = canvas?.tokens?.controlled?.[0]?.actor ?? game.user?.character ?? null;
      this.close();
      new GothicTalesCharacterCreator({targetActor: actor}).render(true);
    });

    root.querySelector(".gt-dm-tools-npc-generator")?.addEventListener("click", ev => {
      ev.preventDefault();
      const actor = canvas?.tokens?.controlled?.[0]?.actor ?? game.user?.character ?? null;
      this.close();
      new GothicTalesNPCGenerator({targetActor: actor}).render(true);
    });

    setTab(this.activeTab);
  }
}

GT.openProfessionTools = function(options = {}) {
  if (!game.user?.isGM) return ui.notifications.warn("Nur der Spielleiter kann die Gothic-Tales DM-Tools öffnen.");
  return new GothicTalesProfessionToolsDialog(options || {}).render(true);
};

GT.openDMTools = GT.openProfessionTools;

GT.sidebarTabSelector = [
  "#sidebar-tabs",
  "#ui-right #sidebar-tabs",
  "#ui-right nav.tabs",
  "#ui-right menu.tabs",
  "#ui-right .tabs",
  "#sidebar nav.tabs",
  "#sidebar menu.tabs",
  "#sidebar .tabs",
  "nav.sidebar-tabs",
  ".sidebar-tabs",
  "[role='tablist']"
].join(", ");

GT.findSidebarEntry = function(kind) {
  const selectors = kind === "settings"
    ? [
        '[data-tab="settings"]',
        '[data-app="settings"]',
        '[data-tool="settings"]',
        '[aria-label="Settings"]',
        '[aria-label="Configure Settings"]',
        '[title="Settings"]',
        '[title="Configure Settings"]',
        '[data-tooltip="Settings"]',
        '[data-tooltip="Configure Settings"]'
      ]
    : [
        '[data-tab="compendium"]',
        '[data-tab="compendiums"]',
        '[data-app="compendium"]',
        '[data-app="compendiums"]',
        '[aria-label="Compendium Packs"]',
        '[title="Compendium Packs"]',
        '[data-tooltip="Compendium Packs"]'
      ];
  for (const selector of selectors) {
    const found = document.querySelector(selector);
    if (found) return found;
  }
  return null;
};

GT.findSidebarTabBar = function() {
  const settings = GT.findSidebarEntry("settings");
  const compendium = GT.findSidebarEntry("compendium");

  if (settings && compendium) {
    let parent = settings.parentElement;
    while (parent && parent !== document.body) {
      if (parent.contains(compendium)) return parent;
      parent = parent.parentElement;
    }
  }

  for (const bar of document.querySelectorAll(GT.sidebarTabSelector)) {
    const entries = bar.querySelectorAll("a, button, [role='tab'], [data-tab], [data-action]");
    if (entries.length >= 4) return bar;
  }

  return settings?.parentElement || compendium?.parentElement || null;
};

GT.makeDMSidebarButton = function(reference = null) {
  const tag = reference?.tagName?.toLowerCase?.() === "button" ? "button" : "a";
  const button = document.createElement(tag);
  button.id = "gt-dm-sidebar-tab";
  // Keine Klassen vom Settings-/Compendium-Button übernehmen, sonst können Foundry-Icons übereinander liegen.
  button.className = "item gt-dm-sidebar-tab";
  button.setAttribute("role", "button");
  button.setAttribute("aria-label", "Gothic-Tales DM-Tools");
  button.dataset.tooltip = "Gothic-Tales DM-Tools";
  button.dataset.tooltipDirection = "LEFT";
  button.title = "Gothic-Tales DM-Tools";
  if (tag === "a") button.href = "#";
  else button.type = "button";
  button.replaceChildren();
  const icon = document.createElement("i");
  icon.className = "fas fa-hammer";
  icon.setAttribute("aria-hidden", "true");
  button.appendChild(icon);
  button.dataset.gtDmToolsReady = "0.6.36";

  button.addEventListener("click", ev => {
    ev.preventDefault();
    ev.stopPropagation();
    ev.stopImmediatePropagation?.();
    GT.openDMTools();
  }, true);

  return button;
};

GT.injectProfessionToolsButton = function() {
  // Ab v0.6.34 sitzt das DM-Werkzeug zuverlässig in der rechten Sidebar.
  document.querySelector("#gt-dm-menu")?.remove();
  document.querySelector("#gt-profession-tools-control")?.remove();

  if (!game.user?.isGM || !GT.setting("dmToolsSidebar")) {
    document.querySelector("#gt-dm-sidebar-tab")?.remove();
    return false;
  }

  const tabBar = GT.findSidebarTabBar();
  if (!tabBar) return false;

  const existing = document.querySelector("#gt-dm-sidebar-tab");
  const settings = GT.findSidebarEntry("settings");
  const compendium = GT.findSidebarEntry("compendium");
  const reference = settings || compendium || tabBar.querySelector("a, button, [role='tab'], [data-tab]");
  const button = existing || GT.makeDMSidebarButton(reference);
  if (button.dataset.gtDmToolsReady !== "0.6.36") {
    button.className = "item gt-dm-sidebar-tab";
    button.setAttribute("role", "button");
    button.setAttribute("aria-label", "Gothic-Tales DM-Tools");
    button.dataset.tooltip = "Gothic-Tales DM-Tools";
    button.dataset.tooltipDirection = "LEFT";
    button.title = "Gothic-Tales DM-Tools";
    if (button.tagName?.toLowerCase?.() === "a") button.href = "#";
    else button.type = "button";
    button.replaceChildren();
    const icon = document.createElement("i");
    icon.className = "fas fa-hammer";
    icon.setAttribute("aria-hidden", "true");
    button.appendChild(icon);
    button.dataset.gtDmToolsReady = "0.6.36";
  }

  // Ziel: ganz unten zwischen Compendium und Settings. Wenn Settings gefunden wurde, direkt davor.
  if (settings && settings.parentElement === tabBar) {
    if (button.nextSibling !== settings) tabBar.insertBefore(button, settings);
  } else if (compendium && compendium.parentElement === tabBar && compendium.nextSibling) {
    if (button.previousSibling !== compendium) tabBar.insertBefore(button, compendium.nextSibling);
  } else if (!button.parentElement) {
    tabBar.appendChild(button);
  }

  button.hidden = false;
  button.style.display = "";
  return true;
};

GT.startProfessionToolsButtonObserver = function() {
  if (!GT.setting("dmToolsSidebar")) {
    document.querySelector("#gt-dm-sidebar-tab")?.remove();
    return;
  }
  if (GT._professionToolsObserverStarted) return;
  GT._professionToolsObserverStarted = true;

  const tryInject = () => {
    try { GT.injectProfessionToolsButton(); }
    catch (err) { console.warn("Gothic Tales | DM-Tools-Button konnte nicht eingefügt werden.", err); }
  };

  // Mehrere verzögerte Versuche, weil Foundry V14 die Sidebar teilweise später rendert.
  // Kein MutationObserver mehr: der konnte durch DOM-Rewrites den Ladevorgang stören.
  for (const delay of [100, 350, 800, 1500, 3000, 6000, 10000]) {
    setTimeout(tryInject, delay);
  }
};



GT.pickpocketSecondsFromMainRoll = function(total) {
  return Math.max(0, Math.floor(Number(total || 0) / 5) * 3);
};

GT.pickpocketSecondsFromSupportRoll = function(total) {
  return Math.max(0, Math.floor(Number(total || 0) / 5) * 2);
};

GT.pickpocketFormulaOptions = function(actor) {
  const node = GT.actorBestProfessionEntry(actor, "taschendiebstahl")?.node
    || GT._professionScaffold?.trees?.flatMap(t => t.nodes ?? [])?.find(n => n.id === "taschendiebstahl")
    || {id: "taschendiebstahl", label: "Taschendiebstahl", attributes: ["intu", "ge"]};
  const learned = GT.actorHasProfession(actor, "taschendiebstahl");
  return {
    formula: GT.professionFormula(actor, node),
    label: "Taschendiebstahl",
    summary: learned ? "Beruf gelernt" : "Taschendiebstahl nicht gelernt – SL entscheidet"
  };
};

GT.pickpocketAdvantageData = function(mode = "none", level = 1) {
  const m = String(mode || "none");
  const l = Math.max(1, Math.min(3, Number(level || 1)));
  return {
    mode: m,
    level: l,
    label: m === "none" ? "Normal" : (GT.advantageLabel(m, l) || "Normal")
  };
};

GT.startPickpocketingSession = function(options = {}) {
  if (!game.user?.isGM) return ui.notifications.warn("Nur der Spielleiter kann Taschendiebstahl vorbereiten.");
  const userId = String(options.userId || "");
  const target = game.users?.get?.(userId);
  if (!target?.active) return ui.notifications.warn("Der gewählte Spieler ist nicht aktiv.");
  const difficulty = Math.max(1, Number(options.difficulty || 10));
  const windowAdv = GT.pickpocketAdvantageData(options.windowMode, options.windowLevel);
  const grabAdv = GT.pickpocketAdvantageData(options.grabMode, options.grabLevel);
  const payload = {
    type: "pickpocketingStart",
    userId,
    session: {
      id: foundry?.utils?.randomID?.() || String(Date.now()),
      gmId: game.user.id,
      targetName: String(options.targetName || "Ziel"),
      loot: String(options.loot || "Beute"),
      theftType: String(options.theftType || "concrete"),
      security: String(options.security || "normal"),
      difficulty,
      windowMode: windowAdv.mode,
      windowLevel: windowAdv.level,
      windowLabel: windowAdv.label,
      grabMode: grabAdv.mode,
      grabLevel: grabAdv.level,
      grabLabel: grabAdv.label,
      note: String(options.note || "")
    }
  };
  game.socket?.emit?.("system.gothic-tales", payload);
  GT.handleSocketMessage(payload);
  ui.notifications.info(`Taschendiebstahl an ${target.name} gesendet.`);
};

class GothicTalesPickpocketingGMDialog extends GothicTalesApplicationV2 {
  constructor(options = {}) {
    super(options);
    this.settings = {
      userId: String(options.userId || ""),
      targetName: String(options.targetName || "Ziel"),
      loot: String(options.loot || "Geldbeutel"),
      theftType: String(options.theftType || "concrete"),
      security: String(options.security || "normal"),
      difficulty: Number(options.difficulty || 15),
      windowMode: String(options.windowMode || "none"),
      windowLevel: Number(options.windowLevel || 1),
      grabMode: String(options.grabMode || "none"),
      grabLevel: Number(options.grabLevel || 1),
      note: String(options.note || "")
    };
  }
  static DEFAULT_OPTIONS = {
    id: "gothic-tales-pickpocketing-gm",
    classes: ["gothic-tales", "gt-app", "gt-v2-window", "gt-dialog-window", "gt-pickpocketing-gm-window"],
    window: {title: "Taschendiebstahl vorbereiten", resizable: true},
    position: {width: 700, height: "auto"}
  };
  static PARTS = {body: {template: "systems/gothic-tales/templates/dialog-pickpocketing-gm.hbs"}};
  getData() {
    return {
      ...this.settings,
      users: GT.lockpickingOnlineUsers(this.settings.userId),
      theftTypes: [
        {id: "concrete", label: "konkreter Gegenstand", selected: this.settings.theftType === "concrete"},
        {id: "random", label: "auf gut Glück", selected: this.settings.theftType === "random"}
      ],
      securityOptions: [
        {id: "easy", label: "leicht zu greifen", selected: this.settings.security === "easy"},
        {id: "normal", label: "normal gesichert", selected: this.settings.security === "normal"},
        {id: "hard", label: "schwer gesichert", selected: this.settings.security === "hard"},
        {id: "locked", label: "befestigt/verschlossen", selected: this.settings.security === "locked"}
      ],
      advantageModes: [
        {id: "none", label: "Normal"},
        {id: "advantage", label: "Vorteil"},
        {id: "disadvantage", label: "Nachteil"}
      ],
      advantageLevels: [
        {value: 1, label: "klein"},
        {value: 2, label: "mittel"},
        {value: 3, label: "groß"}
      ]
    };
  }
  readForm(root) {
    return {
      userId: String(root.querySelector(".gt-pickpocket-user")?.value || ""),
      targetName: String(root.querySelector(".gt-pickpocket-target")?.value || "Ziel"),
      loot: String(root.querySelector(".gt-pickpocket-loot")?.value || "Beute"),
      theftType: String(root.querySelector(".gt-pickpocket-type")?.value || "concrete"),
      security: String(root.querySelector(".gt-pickpocket-security")?.value || "normal"),
      difficulty: Math.max(1, Number(root.querySelector(".gt-pickpocket-difficulty")?.value || 10)),
      windowMode: String(root.querySelector(".gt-pickpocket-window-mode")?.value || "none"),
      windowLevel: Number(root.querySelector(".gt-pickpocket-window-level")?.value || 1),
      grabMode: String(root.querySelector(".gt-pickpocket-grab-mode")?.value || "none"),
      grabLevel: Number(root.querySelector(".gt-pickpocket-grab-level")?.value || 1),
      note: String(root.querySelector(".gt-pickpocket-note")?.value || "")
    };
  }
  activateListeners(html) {
    super.activateListeners(html);
    const root = GT.htmlRoot(html);
    root.addEventListener("submit", ev => {
      ev.preventDefault();
      this.settings = this.readForm(root);
      GT.startPickpocketingSession(this.settings);
      this.close();
    });
    root.querySelector(".gt-dialog-cancel")?.addEventListener("click", ev => { ev.preventDefault(); this.close(); });
  }
}

class GothicTalesPickpocketingPlayerDialog extends GothicTalesApplicationV2 {
  constructor(actor, session = {}, options = {}) {
    super(options);
    this.actor = actor;
    this.session = session;
    this.windowRolled = false;
    this.windowSeconds = 0;
    this.supports = [];
    this.started = false;
    this.finished = false;
    this.endsAt = 0;
    this.grabLockedUntil = 0;
    this.grabInProgress = false;
    this.searchChallenge = null;
    this.countdownTimer = null;
  }
  static DEFAULT_OPTIONS = {
    id: "gothic-tales-pickpocketing-player",
    classes: ["gothic-tales", "gt-app", "gt-v2-window", "gt-dialog-window", "gt-pickpocketing-player-window"],
    window: {title: "Taschendiebstahl", resizable: true},
    position: {width: 740, height: "auto"}
  };
  static PARTS = {body: {template: "systems/gothic-tales/templates/dialog-pickpocketing-player.hbs", scrollable: [".gt-pickpocketing-player"]}};
  get totalSeconds() {
    return Number(this.windowSeconds || 0) + this.supports.reduce((t, s) => t + Number(s.seconds || 0), 0);
  }
  get remainingSeconds() {
    if (!this.started || !this.endsAt || this.finished) return 0;
    return Math.max(0, Math.ceil((this.endsAt - Date.now()) / 1000));
  }
  getData() {
    const opts = GT.pickpocketFormulaOptions(this.actor);
    return {
      actor: this.actor,
      session: this.session,
      targetName: this.session.targetName || "Ziel",
      loot: this.session.loot || "Beute",
      theftType: this.session.theftType === "random" ? "auf gut Glück" : "konkreter Gegenstand",
      security: this.session.security || "normal",
      difficulty: Number(this.session.difficulty || 10),
      note: this.session.note || "",
      learned: GT.actorHasProfession(this.actor, "taschendiebstahl"),
      formula: opts.formula,
      summary: opts.summary,
      windowRolled: this.windowRolled,
      windowSeconds: this.windowSeconds,
      supports: this.supports,
      supportSeconds: this.supports.reduce((t, s) => t + Number(s.seconds || 0), 0),
      totalSeconds: this.totalSeconds,
      started: this.started,
      finished: this.finished,
      remainingSeconds: this.remainingSeconds,
      canStart: !this.started && !this.finished && this.totalSeconds > 0,
      grabCooldown: Math.max(0, Math.ceil((this.grabLockedUntil - Date.now()) / 1000)),
      gateMode: GT.pickpocketGateMode(),
      isCooldownGate: GT.pickpocketGateMode() !== "search",
      isSearchGate: GT.pickpocketGateMode() === "search",
      searchNumberCount: GT.pickpocketSearchNumberCount(),
      searchChallenge: this.searchChallenge,
      hasSearchChallenge: !!this.searchChallenge?.active,
      searchWrongCount: Number(this.searchChallenge?.wrong || 0),
      windowLabel: this.session.windowLabel || "Normal",
      grabLabel: this.session.grabLabel || "Normal"
    };
  }
  clearTimers() {
    if (this.countdownTimer) clearInterval(this.countdownTimer);
    this.countdownTimer = null;
  }
  updateLiveState(root) {
    const remaining = this.remainingSeconds;
    const remainingEl = root.querySelector(".gt-pickpocket-remaining");
    if (remainingEl) remainingEl.textContent = String(remaining);
    const grabButton = root.querySelector(".gt-pickpocket-grab");
    const searchActive = !!this.searchChallenge?.active;
    const cooldownMode = GT.pickpocketGateMode() !== "search";
    const locked = cooldownMode && Date.now() < Number(this.grabLockedUntil || 0);
    const cooldown = Math.max(0, Math.ceil((Number(this.grabLockedUntil || 0) - Date.now()) / 1000));
    if (grabButton) {
      const disabled = this.finished || !this.started || remaining <= 0 || locked || this.grabInProgress || searchActive;
      grabButton.disabled = disabled;
      const label = searchActive ? "Ergebnis suchen" : (locked ? `Zugreifen (${cooldown}s)` : "Zugreifen!");
      const labelSpan = grabButton.querySelector("span");
      if (labelSpan) labelSpan.textContent = label;
    }
    if (this.started && !this.finished && remaining <= 0) {
      this.finished = true;
      this.clearTimers();
      ChatMessage.create({
        speaker: ChatMessage.getSpeaker({actor: this.actor}),
        content: `<div class="gothic-tales chat-card gt-pickpocket-result"><h2><i class="fas fa-hourglass-end"></i> Taschendiebstahl gescheitert</h2><p>Das Zeitfenster ist vorbei. <strong>${GT.escape(this.actor.name)}</strong> konnte ${GT.escape(this.session.loot || "die Beute")} nicht stehlen.</p></div>`
      });
      this.render(false);
    }
  }
  startLiveTimer(root) {
    this.clearTimers();
    if (!this.started || this.finished) return;
    this.updateLiveState(root);
    this.countdownTimer = setInterval(() => this.updateLiveState(root), 250);
  }
  async postWindowResult(total, seconds) {
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({actor: this.actor}),
      content: `<div class="gothic-tales chat-card gt-pickpocket-result">
        <h2><i class="fas fa-stopwatch"></i> Zeitfenster</h2>
        <p><strong>${GT.escape(this.actor.name)}</strong> verschafft sich ein Zeitfenster für den Taschendiebstahl.</p>
        <p>Wurf: <strong>${Number(total || 0)}</strong> → <strong>+${Number(seconds || 0)} Sekunden</strong>.</p>
      </div>`
    });
  }
  async postGrabResult({total, criticalFailure, success}) {
    let html = "";
    if (criticalFailure) {
      this.finished = true;
      this.clearTimers();
      html = `<h2><i class="fas fa-eye"></i> Taschendiebstahl bemerkt!</h2><p>Kritischer Fehlschlag. Das Opfer bemerkt den Diebstahlversuch.</p>`;
    } else if (success) {
      this.finished = true;
      this.clearTimers();
      html = `<h2><i class="fas fa-hand-sparkles"></i> Taschendiebstahl gelungen</h2><p><strong>${GT.escape(this.actor.name)}</strong> stiehlt: <strong>${GT.escape(this.session.loot || "Beute")}</strong>.</p>`;
    } else {
      html = `<h2><i class="fas fa-hand"></i> Griff misslungen</h2><p>Der Griff scheitert. Solange Zeit bleibt, kann weiter versucht werden.</p>`;
    }
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({actor: this.actor}),
      content: `<div class="gothic-tales chat-card gt-pickpocket-result">
        ${html}
        <p>Wurf: <strong>${Number(total || 0)}</strong> gegen SchwG <strong>${Number(this.session.difficulty || 10)}</strong>.</p>
        <p class="gt-chat-note">${GT.pickpocketGateMode() === "search" ? "Ergebnis-Suche: Vor dem nächsten Wurf muss das Wurfergebnis im Spielerfenster gefunden werden." : `Zugreifen-Sperre: ${GT.pickpocketCooldownSeconds()} Sekunden zwischen den Versuchen.`}</p>
      </div>`
    });
  }
  activateListeners(html) {
    super.activateListeners(html);
    const root = GT.htmlRoot(html);
    this.startLiveTimer(root);

    root.querySelector(".gt-pickpocket-window-roll")?.addEventListener("click", async ev => {
      ev.preventDefault();
      if (this.started) return ui.notifications.warn("Das Zeitfenster läuft bereits.");
      const opts = GT.pickpocketFormulaOptions(this.actor);
      await GT.chatRoll({
        formula: opts.formula,
        label: "Taschendiebstahl: Zeitfenster",
        actor: this.actor,
        flavor: `${opts.summary} · ${this.session.windowLabel || "Normal"}`,
        advantageMode: this.session.windowMode || "none",
        advantageLevel: Number(this.session.windowLevel || 1),
        onRoll: async message => {
          const total = Number(message?.getFlag?.("gothic-tales", "rollTotal") ?? 0);
          const seconds = GT.pickpocketSecondsFromMainRoll(total);
          this.windowRolled = true;
          this.windowSeconds = seconds;
          await this.postWindowResult(total, seconds);
          this.render(false);
        }
      });
    });

    root.querySelector(".gt-pickpocket-support-add")?.addEventListener("click", ev => {
      ev.preventDefault();
      const name = String(root.querySelector(".gt-pickpocket-support-name")?.value || "Unterstützung").trim();
      const action = String(root.querySelector(".gt-pickpocket-support-action")?.value || "").trim();
      const total = Number(root.querySelector(".gt-pickpocket-support-total")?.value || 0);
      const seconds = GT.pickpocketSecondsFromSupportRoll(total);
      if (total <= 0) return ui.notifications.warn("Bitte ein Unterstützungsergebnis eintragen.");
      this.supports.push({name, action, total, seconds});
      this.render(false);
    });

    root.querySelector(".gt-pickpocket-start")?.addEventListener("click", async ev => {
      ev.preventDefault();
      if (this.totalSeconds <= 0) return ui.notifications.warn("Es wurde noch kein Zeitfenster erzeugt.");
      this.started = true;
      this.finished = false;
      this.searchChallenge = null;
      this.endsAt = Date.now() + this.totalSeconds * 1000;
      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({actor: this.actor}),
        content: `<div class="gothic-tales chat-card gt-pickpocket-result">
          <h2><i class="fas fa-person-running"></i> Diebstahl startet</h2>
          <p>Ziel: <strong>${GT.escape(this.session.targetName || "Ziel")}</strong> · Beute: <strong>${GT.escape(this.session.loot || "Beute")}</strong></p>
          <p>Zeitfenster: <strong>${this.totalSeconds} Sekunden</strong>. SchwG: <strong>${Number(this.session.difficulty || 10)}</strong>.</p>
          <p class="gt-chat-note">${GT.pickpocketGateMode() === "search" ? `Ergebnis-Suche aktiv: Nach einem misslungenen Griff muss das Wurfergebnis aus ${GT.pickpocketSearchNumberCount()} Zahlen gefunden werden.` : `Jeder Zugreifen-Wurf ist durch eine ${GT.pickpocketCooldownSeconds()}-Sekunden-Sperre geschützt.`}</p>
        </div>`
      });
      this.render(false);
    });

    root.querySelector(".gt-pickpocket-grab")?.addEventListener("click", async ev => {
      ev.preventDefault();
      if (!this.started || this.finished) return;
      if (this.remainingSeconds <= 0) return this.updateLiveState(root);
      const gateMode = GT.pickpocketGateMode();
      if (this.searchChallenge?.active) return ui.notifications.warn("Finde zuerst dein letztes Wurfergebnis.");
      const now = Date.now();
      if (gateMode !== "search" && now < Number(this.grabLockedUntil || 0)) {
        const left = Math.ceil((Number(this.grabLockedUntil || 0) - now) / 1000);
        return ui.notifications.warn(`Erst in ${left} Sek. erneut zugreifen.`);
      }
      if (gateMode !== "search") this.grabLockedUntil = now + GT.pickpocketCooldownMs();
      this.grabInProgress = true;
      this.updateLiveState(root);
      const opts = GT.pickpocketFormulaOptions(this.actor);
      const message = await GT.chatRoll({
        formula: opts.formula,
        label: "Taschendiebstahl: Zugreifen",
        actor: this.actor,
        flavor: `Gegen SchwG ${Number(this.session.difficulty || 10)} · feste Würfel: ${this.session.grabLabel || "Normal"}`,
        configure: false,
        rollOptions: {advantageMode: this.session.grabMode || "none", advantageLevel: Number(this.session.grabLevel || 1)}
      });
      const total = Number(message?.getFlag?.("gothic-tales", "rollTotal") ?? 0);
      const criticalFailure = !!message?.getFlag?.("gothic-tales", "rollCriticalFailure");
      const success = total >= Number(this.session.difficulty || 10);
      await this.postGrabResult({total, criticalFailure, success});
      if (!success && !criticalFailure && !this.finished && gateMode === "search") {
        this.searchChallenge = GT.pickpocketSearchChallenge(total);
      }
      this.grabInProgress = false;
      this.render(false);
    });

    root.querySelectorAll(".gt-pickpocket-search-number").forEach(button => button.addEventListener("click", ev => {
      ev.preventDefault();
      if (!this.searchChallenge?.active || this.finished) return;
      const picked = Number(ev.currentTarget.dataset.value || 0);
      if (picked === Number(this.searchChallenge.target || 0)) {
        this.searchChallenge = null;
        ui.notifications.info("Richtiges Ergebnis gefunden. Du kannst wieder zugreifen.");
        this.render(false);
        return;
      }
      this.searchChallenge.wrong = Number(this.searchChallenge.wrong || 0) + 1;
      this.endsAt = Math.max(Date.now(), Number(this.endsAt || Date.now()) - 1000);
      ui.notifications.warn("Falsche Zahl: -1 Sekunde.");
      this.updateLiveState(root);
      if (!this.finished) this.render(false);
    }));

    root.querySelector(".gt-dialog-cancel")?.addEventListener("click", ev => {
      ev.preventDefault();
      this.clearTimers();
      this.close();
    });
  }
}


/* ------------------------------------------------------------------------- */
/* Berufs-Minispiele: Schürfen, Alchemie, Schmiedekunst, Schnitzkunst        */
/* ------------------------------------------------------------------------- */

GT.safeRandomID = function() {
  return foundry?.utils?.randomID?.() || String(Date.now()) + String(Math.floor(Math.random() * 9999));
};

GT.stackOrCreateItem = async function(actor, {name, type = "consumable", quantity = 1, value = "", category = "", description = "", properties = "", img = "", system = {}} = {}) {
  if (!actor || !name) return null;
  if (!GT.setting("autoInventory")) {
    ui.notifications?.info?.(`Automatische Inventar-Erstellung ist deaktiviert: ${name} wurde nicht angelegt.`);
    return null;
  }
  const qty = Math.max(1, Number(quantity || 1));
  const existing = Array.from(actor.items ?? []).find(i => i.name === name && i.type === type);
  if (existing && Number(existing.system?.quantity ?? 0) >= 0) {
    await existing.update({"system.quantity": Number(existing.system?.quantity || 0) + qty});
    return existing;
  }
  const [item] = await actor.createEmbeddedDocuments("Item", [{
    name,
    type,
    img: img || GT.itemImage?.(type, name, category) || GT.CONFIG?.icons?.default || "icons/svg/item-bag.svg",
    system: {
      quantity: qty,
      value: String(value ?? ""),
      category,
      description,
      properties,
      ...system
    }
  }]);
  return item;
};

GT.professionEntryOrDefault = function(actor, group, fallback = {}) {
  return GT.actorBestProfessionEntry(actor, group)?.node
    || GT._professionScaffold?.trees?.flatMap(t => t.nodes ?? [])?.find(n => n.id === group || n.rankGroup === group)
    || fallback;
};

GT.professionFormulaWithoutD20 = function(actor, node = {}) {
  const formula = GT.professionFormula(actor, node);
  const stripped = String(formula || "").replace(/(?:^|\+)\s*w20\s*/i, "").replace(/^\s*\+\s*/, "").trim();
  return stripped || "w2";
};

GT.criticalFailureFromMessage = function(message) {
  return !!message?.getFlag?.("gothic-tales", "rollCriticalFailure");
};

GT.criticalSuccessFromMessage = function(message) {
  return !!message?.getFlag?.("gothic-tales", "rollCritical");
};

GT.rankInfoForProfession = function(actor, group, ranks = []) {
  const entry = GT.actorBestProfessionEntry(actor, group);
  if (!entry) return {learned: false, rank: -1, label: "nicht gelernt", node: {attributes: []}, data: ranks[0] ?? {}};
  const rank = Math.max(0, Number(entry.node.rank || 0));
  const data = ranks.find(r => Number(r.rank) === rank) ?? ranks[0] ?? {};
  return {learned: true, rank, label: data.label || entry.node.label || "gelernt", node: entry.node, data};
};

/* ----------------------------- Schürfen --------------------------------- */

GT.MINING_RANKS = [
  {rank: 0, label: "Grundrang", maxSearches: 2},
  {rank: 1, label: "geübt", maxSearches: 3},
  {rank: 2, label: "gelehrt", maxSearches: 4},
  {rank: 3, label: "gemeistert", maxSearches: 5}
];

GT.miningRankInfo = function(actor) {
  const info = GT.rankInfoForProfession(actor, "schuerfen", GT.MINING_RANKS);
  return {...info, maxSearches: info.data?.maxSearches || 0};
};

GT.miningState = function(actor) {
  const state = actor?.system?.professions?.uses?.schuerfen ?? {};
  return {
    successes: Math.max(0, Number(state.successes || 0)),
    nextAllowed: Math.max(0, Number(state.nextAllowed || 0))
  };
};

GT.updateMiningState = async function(actor, patch = {}) {
  const state = {...GT.miningState(actor), ...patch};
  await actor.update({"system.professions.uses.schuerfen": state});
  return state;
};

GT.resetMiningState = async function(actor, {timer = true, successes = true} = {}) {
  const state = GT.miningState(actor);
  if (timer) state.nextAllowed = 0;
  if (successes) state.successes = 0;
  await actor.update({"system.professions.uses.schuerfen": state});
  return state;
};

GT.miningCooldownText = function(nextAllowed) {
  const remaining = Number(nextAllowed || 0) - Date.now();
  if (remaining <= 0) return "bereit";
  return `${Math.ceil(remaining / 60000)} Min.`;
};

GT.miningOreFromRoll = function(total) {
  const t = Number(total || 0);
  if (t <= 10) return {id: "none", label: "Kein Fund", valueMultiplier: 0};
  if (t <= 24) return {id: "iron", label: "Eisenerz", valueMultiplier: 1};
  return {id: "magic", label: "Magisches Erz", valueMultiplier: 3};
};

GT.miningOreById = function(id) {
  if (id === "magic") return {id: "magic", label: "Magisches Erz", valueMultiplier: 3};
  if (id === "iron") return {id: "iron", label: "Eisenerz", valueMultiplier: 1};
  return {id: "none", label: "Kein Fund", valueMultiplier: 0};
};

GT.hasItemNamed = function(actor, pattern) {
  const rx = pattern instanceof RegExp ? pattern : new RegExp(String(pattern || ""), "i");
  return Array.from(actor?.items ?? []).some(i => rx.test(i.name || "") && Number(i.system?.quantity ?? 1) > 0);
};

GT.startMiningSession = function(options = {}) {
  if (!game.user?.isGM) return ui.notifications.warn("Nur der Spielleiter kann Schürfen vorbereiten.");
  const userId = String(options.userId || "");
  const target = game.users?.get?.(userId);
  if (!target?.active) return ui.notifications.warn("Der gewählte Spieler ist nicht aktiv.");
  const payload = {
    type: "miningStart",
    userId,
    session: {
      id: GT.safeRandomID(),
      gmId: game.user.id,
      suitable: !!options.suitable,
      existingDeposit: !!options.existingDeposit,
      oreId: String(options.oreId || "iron"),
      deposits: Math.max(1, Number(options.deposits || 1)),
      note: String(options.note || "")
    }
  };
  game.socket?.emit?.("system.gothic-tales", payload);
  GT.handleSocketMessage(payload);
  ui.notifications.info(`Schürfen an ${target.name} gesendet.`);
};

GT.resetMiningForUser = function(userId) {
  if (!game.user?.isGM) return ui.notifications.warn("Nur der Spielleiter kann Schürfen zurücksetzen.");
  const target = game.users?.get?.(String(userId || ""));
  if (!target?.active) return ui.notifications.warn("Der gewählte Spieler ist nicht aktiv.");
  const payload = {type: "miningReset", userId: target.id};
  game.socket?.emit?.("system.gothic-tales", payload);
  GT.handleSocketMessage(payload);
};

class GothicTalesMiningGMDialog extends GothicTalesApplicationV2 {
  constructor(options = {}) {
    super(options);
    this.settings = {
      userId: String(options.userId || ""),
      suitable: options.suitable !== false,
      existingDeposit: !!options.existingDeposit,
      oreId: String(options.oreId || "iron"),
      deposits: Number(options.deposits || 1),
      note: String(options.note || "")
    };
  }
  static DEFAULT_OPTIONS = {
    id: "gothic-tales-mining-gm",
    classes: ["gothic-tales", "gt-app", "gt-v2-window", "gt-dialog-window", "gt-mining-gm-window"],
    window: {title: "Schürfen vorbereiten", resizable: true},
    position: {width: 660, height: "auto"}
  };
  static PARTS = {body: {template: "systems/gothic-tales/templates/dialog-mining-gm.hbs"}};
  getData() {
    return {
      ...this.settings,
      users: GT.lockpickingOnlineUsers(this.settings.userId),
      oreOptions: [
        {id: "iron", label: "Eisenerz", selected: this.settings.oreId === "iron"},
        {id: "magic", label: "Magisches Erz", selected: this.settings.oreId === "magic"}
      ]
    };
  }
  readForm(root) {
    return {
      userId: String(root.querySelector(".gt-mining-user")?.value || ""),
      suitable: !!root.querySelector(".gt-mining-suitable")?.checked,
      existingDeposit: !!root.querySelector(".gt-mining-existing")?.checked,
      oreId: String(root.querySelector(".gt-mining-ore")?.value || "iron"),
      deposits: Math.max(1, Number(root.querySelector(".gt-mining-deposits")?.value || 1)),
      note: String(root.querySelector(".gt-mining-note")?.value || "")
    };
  }
  activateListeners(html) {
    super.activateListeners(html);
    const root = GT.htmlRoot(html);
    root.addEventListener("submit", ev => {
      ev.preventDefault();
      this.settings = this.readForm(root);
      GT.startMiningSession(this.settings);
      this.close();
    });
    root.querySelector(".gt-mining-reset")?.addEventListener("click", ev => {
      ev.preventDefault();
      this.settings = this.readForm(root);
      GT.resetMiningForUser(this.settings.userId);
    });
    root.querySelector(".gt-dialog-cancel")?.addEventListener("click", ev => { ev.preventDefault(); this.close(); });
  }
}

class GothicTalesMiningPlayerDialog extends GothicTalesApplicationV2 {
  constructor(actor, session = {}, options = {}) {
    super(options);
    this.actor = actor;
    this.session = session;
    this.step = session.existingDeposit ? "mine" : "search";
    this.ore = session.existingDeposit ? GT.miningOreById(session.oreId) : null;
    this.deposits = session.existingDeposit ? Math.max(1, Number(session.deposits || 1)) : 0;
    this.currentMineRoll = 0;
    this.minedTotal = 0;
    this.done = false;
  }
  static DEFAULT_OPTIONS = {
    id: "gothic-tales-mining-player",
    classes: ["gothic-tales", "gt-app", "gt-v2-window", "gt-dialog-window", "gt-mining-player-window"],
    window: {title: "Schürfen", resizable: true},
    position: {width: 700, height: "auto"}
  };
  static PARTS = {body: {template: "systems/gothic-tales/templates/dialog-mining-player.hbs", scrollable: [".gt-mining-player"]}};
  getData() {
    const rank = GT.miningRankInfo(this.actor);
    const state = GT.miningState(this.actor);
    const blocked = [];
    if (!rank.learned) blocked.push("Schürfen nicht gelernt");
    if (!this.session.suitable) blocked.push("Ort ist nicht als geeignet markiert");
    if (!GT.hasItemNamed(this.actor, /spitzhacke/i)) blocked.push("keine Spitzhacke im Inventar gefunden");
    if (state.successes >= rank.maxSearches && rank.learned) blocked.push("Schürfen pro Sitzung aufgebraucht");
    if (state.nextAllowed > Date.now()) blocked.push(`Timer aktiv: ${GT.miningCooldownText(state.nextAllowed)}`);
    return {
      actor: this.actor,
      rank,
      state,
      successes: state.successes,
      maxSearches: rank.maxSearches,
      remaining: Math.max(0, rank.maxSearches - state.successes),
      cooldownText: GT.miningCooldownText(state.nextAllowed),
      suitable: !!this.session.suitable,
      note: this.session.note || "",
      blocked: blocked.length > 0 && this.step === "search",
      blockedReason: blocked.join("; "),
      step: this.step,
      ore: this.ore,
      deposits: this.deposits,
      currentMineRoll: this.currentMineRoll,
      minedTotal: this.minedTotal,
      done: this.done,
      canSearch: this.step === "search" && !this.done,
      canAmount: this.step === "amount" && !this.done,
      canMine: this.step === "mine" && !this.done && this.currentMineRoll < this.deposits
    };
  }
  async miningFormulaRoll(label, flavor, onRoll) {
    const rank = GT.miningRankInfo(this.actor);
    return GT.chatRoll({
      formula: GT.professionFormula(this.actor, rank.node || {attributes: ["st", "ausd"]}),
      label,
      actor: this.actor,
      flavor,
      onRoll
    });
  }
  async finishNoFund(total) {
    await GT.updateMiningState(this.actor, {nextAllowed: Date.now() + GT.miningCooldownMs()});
    this.done = true;
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({actor: this.actor}),
      content: `<div class="gothic-tales chat-card gt-crafting-result"><h2><i class="fas fa-mountain"></i> Schürfen</h2><p>Wurf ${Number(total || 0)}: Kein brauchbares Erz gefunden. Der erfolgreiche Suchzähler wird nicht verbraucht.</p><p class="gt-chat-note">Nächste Suche in ${GT.setting("miningCooldownMinutes")} Minuten.</p></div>`
    });
  }
  async finishMining() {
    if (!this.ore || this.ore.id === "none") return;
    const qty = Math.max(1, Number(this.minedTotal || 1));
    const value = this.ore.valueMultiplier === 3 ? qty * 3 : qty;
    await GT.stackOrCreateItem(this.actor, {
      name: this.ore.label,
      type: "consumable",
      quantity: qty,
      value,
      category: "Material",
      properties: "Erz",
      description: `<p>${GT.escape(this.ore.label)} aus dem Schürfen. Handelswert: ${value}.</p>`
    });
    const rank = GT.miningRankInfo(this.actor);
    const state = GT.miningState(this.actor);
    await GT.updateMiningState(this.actor, {
      successes: Math.min(rank.maxSearches, state.successes + 1),
      nextAllowed: Date.now() + GT.miningCooldownMs()
    });
    this.done = true;
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({actor: this.actor}),
      content: `<div class="gothic-tales chat-card gt-crafting-result"><h2><i class="fas fa-gem"></i> Erz abgebaut</h2><p><strong>${GT.escape(this.actor.name)}</strong> erhält <strong>${qty}× ${GT.escape(this.ore.label)}</strong>.</p><p>Handelswert: <strong>${value}</strong>.</p><p class="gt-chat-note">Nächste Suche in ${GT.setting("miningCooldownMinutes")} Minuten.</p></div>`
    });
  }
  activateListeners(html) {
    super.activateListeners(html);
    const root = GT.htmlRoot(html);
    root.querySelector(".gt-mining-search")?.addEventListener("click", ev => {
      ev.preventDefault();
      const data = this.getData();
      if (data.blocked) return ui.notifications.warn(data.blockedReason);
      this.miningFormulaRoll("Schürfen: Erz suchen", "Schritt 1: Erzader suchen", async message => {
        const total = Number(message?.getFlag?.("gothic-tales", "rollTotal") ?? 0);
        const ore = GT.miningOreFromRoll(total);
        this.ore = ore;
        if (ore.id === "none") await this.finishNoFund(total);
        else {
          this.step = "amount";
          await ChatMessage.create({speaker: ChatMessage.getSpeaker({actor: this.actor}), content: `<div class="gothic-tales chat-card gt-crafting-result"><h2><i class="fas fa-mountain"></i> Erzader gefunden</h2><p>Wurf ${total}: <strong>${GT.escape(ore.label)}</strong>.</p></div>`});
        }
        this.render(false);
      });
    });
    root.querySelector(".gt-mining-amount")?.addEventListener("click", ev => {
      ev.preventDefault();
      this.miningFormulaRoll("Schürfen: Menge bestimmen", "Schritt 2: Vorkommen bestimmen", async message => {
        const total = Number(message?.getFlag?.("gothic-tales", "rollTotal") ?? 0);
        this.deposits = 1 + Math.floor(Math.max(0, total) / 10);
        this.step = "mine";
        await ChatMessage.create({speaker: ChatMessage.getSpeaker({actor: this.actor}), content: `<div class="gothic-tales chat-card gt-crafting-result"><h2><i class="fas fa-layer-group"></i> Vorkommen</h2><p>Wurf ${total}: <strong>${this.deposits}</strong> Vorkommen.</p></div>`});
        this.render(false);
      });
    });
    root.querySelector(".gt-mining-mine")?.addEventListener("click", ev => {
      ev.preventDefault();
      if (this.currentMineRoll >= this.deposits) return;
      this.miningFormulaRoll("Schürfen: Erz abbauen", `Schritt 3: Vorkommen ${this.currentMineRoll + 1}/${this.deposits}`, async message => {
        const total = Number(message?.getFlag?.("gothic-tales", "rollTotal") ?? 0);
        this.currentMineRoll += 1;
        this.minedTotal += Math.max(0, total);
        if (this.currentMineRoll >= this.deposits) await this.finishMining();
        this.render(false);
      });
    });
    root.querySelector(".gt-dialog-cancel")?.addEventListener("click", ev => { ev.preventDefault(); this.close(); });
  }
}

/* ----------------------------- Alchemie --------------------------------- */

GT.ALCHEMY_RANKS = [
  {rank: 0, label: "Anfänger", modes: ["heiltrank", "manatrank"]},
  {rank: 1, label: "geübt", modes: ["heiltrank", "manatrank", "reinigung", "erholung"]},
  {rank: 2, label: "gelehrt", modes: ["heiltrank", "manatrank", "reinigung", "erholung", "geschwindigkeit", "hast"]},
  {rank: 3, label: "gemeistert", modes: ["heiltrank", "manatrank", "reinigung", "erholung", "geschwindigkeit", "hast", "permanent"]}
];

GT.alchemyRankInfo = function(actor) {
  const info = GT.rankInfoForProfession(actor, "alchemie", GT.ALCHEMY_RANKS);
  return {...info, modes: info.data?.modes || []};
};

GT.ALCHEMY_TASKS = {
  heiltrank: [
    {min: 1, max: 1, difficulty: 5, task: "Koch den Feldknöterich", success: "+1", failure: "Durchfall: Erschöpfung +1 für 1 Tag"},
    {min: 2, max: 2, difficulty: 10, task: "Zerstampfe das Heilblatt", success: "+w2", failure: "0"},
    {min: 3, max: 3, difficulty: 5, task: "Dünste das Heilblatt", success: "+w4", failure: "-1"},
    {min: 4, max: 4, difficulty: 10, task: "Entsafte die Weidenbeere", success: "+w4", failure: "0"},
    {min: 5, max: 5, difficulty: 15, task: "Erhitze das Ogerblatt", success: "+w6", failure: "0"},
    {min: 6, max: 6, difficulty: 10, task: "Zerkleinere das Ogerblatt", success: "+w6", failure: "-1"},
    {min: 7, max: 7, difficulty: 15, task: "Klopf den Eisenhalm weich", success: "+w8", failure: "-2"},
    {min: 8, max: 8, difficulty: 10, task: "Entfasere den Eisenhalm", success: "+w8", failure: "-2"},
    {min: 9, max: 9, difficulty: 15, task: "Dampfe Sonnenkraut ab", success: "+w10", failure: "-2"},
    {min: 10, max: 10, difficulty: 15, task: "Entnehme Sonnenkrautmark", success: "+w10", failure: "-1"},
    {min: 11, max: 11, difficulty: 20, task: "Schleudere Heilwurzel", success: "+w12", failure: "-3"},
    {min: 12, max: 12, difficulty: 20, task: "Entziehe Heilwurzelextrakt", success: "+w6 +w4", failure: "-3"},
    {min: 13, max: 999, difficulty: 25, task: "Destilliere Heilwurzelextrakt", success: "+2w6", failure: "SL notiert eine geheime negative Konsequenz"}
  ],
  manatrank: [
    {min: 1, max: 1, difficulty: 5, task: "Koch den Feldknöterich", success: "+1", failure: "Du verlierst all dein Mana, danach regeneriert dieser Trank"},
    {min: 2, max: 2, difficulty: 10, task: "Zerstampfe die Feuernessel", success: "+1", failure: "0"},
    {min: 3, max: 3, difficulty: 5, task: "Dünste die Feuernessel", success: "+w2", failure: "-1"},
    {min: 4, max: 4, difficulty: 10, task: "Entsafte das Seraphiskraut", success: "+w2", failure: "0"},
    {min: 5, max: 5, difficulty: 15, task: "Erhitze den Morgentaupilz", success: "+w4", failure: "0"},
    {min: 6, max: 6, difficulty: 10, task: "Zerkleinere Morgentaupilz", success: "+w4", failure: "-1"},
    {min: 7, max: 7, difficulty: 15, task: "Klopfe Mondschatten weich", success: "+w6", failure: "-2"},
    {min: 8, max: 8, difficulty: 10, task: "Entfasere Mondschatten", success: "+w6", failure: "-2"},
    {min: 9, max: 9, difficulty: 15, task: "Dampfe Rabenkraut ab", success: "+w8", failure: "-2"},
    {min: 10, max: 10, difficulty: 15, task: "Entnimm Rabenkrautmark", success: "+w8", failure: "-1"},
    {min: 11, max: 11, difficulty: 20, task: "Schleudere Feuerwurzel", success: "+w10", failure: "-3"},
    {min: 12, max: 12, difficulty: 20, task: "Entziehe Feuerwurzelextrakt", success: "+w10", failure: "-2"},
    {min: 13, max: 999, difficulty: 25, task: "Destilliere Feuerwurzelextrakt", success: "+w4 +w6", failure: "SL notiert eine geheime negative Konsequenz"}
  ]
};

GT.alchemyTaskForRoll = function(kind, total) {
  const t = Number(total || 1);
  return (GT.ALCHEMY_TASKS[kind] || GT.ALCHEMY_TASKS.heiltrank).find(row => t >= row.min && t <= row.max);
};

GT.ALCHEMY_SIMPLE_RECIPES = [
  {id: "reinigung", label: "Trank der Reinigung", rank: 1, difficulty: 20, value: 60, description: "Kuriert Erkrankungen und Gifte nach SL-Entscheid."},
  {id: "erholung", label: "Trank der Erholung", rank: 1, difficulty: 20, value: 60, description: "Lindert körperliche Erschöpfung nach SL-Entscheid."},
  {id: "geschwindigkeit", label: "Trank der Geschwindigkeit", rank: 2, difficulty: 25, value: 90, description: "Trank der Geschwindigkeit."},
  {id: "hast", label: "Trank der Hast", rank: 2, difficulty: 25, value: 90, description: "Trank der Hast."}
];

GT.ALCHEMY_PERMANENT = [
  {id: "kraft", label: "Trank der Kraft", herb: "Drachenwurzel", attribute: "Stärke"},
  {id: "geschick", label: "Trank der Geschicklichkeit", herb: "Goblinbeere", attribute: "Geschick"},
  {id: "ausdauer", label: "Trank der Ausdauer", herb: "Harnischkraut", attribute: "Ausdauer"},
  {id: "konzentration", label: "Trank der Konzentration", herb: "Königsdistel", attribute: "Konzentration"},
  {id: "intuition", label: "Trank der Intuition", herb: "Blutschilf", attribute: "Intuition"},
  {id: "erfahrung", label: "Trank der Erfahrung", herb: "Sonnenmoos", attribute: "Erfahrung"},
  {id: "leben", label: "Trank des Lebens", herb: "Herrscherkraut", attribute: "TP"},
  {id: "mana", label: "Trank des Manas", herb: "Flammenbeere", attribute: "Mana"},
  {id: "initiative", label: "Trank der Initiative", herb: "Blitzblatt", attribute: "Initiative"}
];

GT.startAlchemySession = function(options = {}) {
  if (!game.user?.isGM) return ui.notifications.warn("Nur der Spielleiter kann Alchemie vorbereiten.");
  const userId = String(options.userId || "");
  const target = game.users?.get?.(userId);
  if (!target?.active) return ui.notifications.warn("Der gewählte Spieler ist nicht aktiv.");
  const payload = {
    type: "alchemyStart",
    userId,
    session: {
      id: GT.safeRandomID(),
      gmId: game.user.id,
      hasTable: !!options.hasTable,
      note: String(options.note || "")
    }
  };
  game.socket?.emit?.("system.gothic-tales", payload);
  GT.handleSocketMessage(payload);
  ui.notifications.info(`Alchemie an ${target.name} gesendet.`);
};

class GothicTalesAlchemyGMDialog extends GothicTalesApplicationV2 {
  constructor(options = {}) {
    super(options);
    this.settings = {userId: String(options.userId || ""), hasTable: options.hasTable !== false, note: String(options.note || "")};
  }
  static DEFAULT_OPTIONS = {
    id: "gothic-tales-alchemy-gm",
    classes: ["gothic-tales", "gt-app", "gt-v2-window", "gt-dialog-window", "gt-alchemy-gm-window"],
    window: {title: "Alchemie vorbereiten", resizable: true},
    position: {width: 660, height: "auto"}
  };
  static PARTS = {body: {template: "systems/gothic-tales/templates/dialog-alchemy-gm.hbs"}};
  getData() { return {...this.settings, users: GT.lockpickingOnlineUsers(this.settings.userId)}; }
  readForm(root) {
    return {
      userId: String(root.querySelector(".gt-alchemy-user")?.value || ""),
      hasTable: !!root.querySelector(".gt-alchemy-table")?.checked,
      note: String(root.querySelector(".gt-alchemy-note")?.value || "")
    };
  }
  activateListeners(html) {
    super.activateListeners(html);
    const root = GT.htmlRoot(html);
    root.addEventListener("submit", ev => {
      ev.preventDefault();
      this.settings = this.readForm(root);
      GT.startAlchemySession(this.settings);
      this.close();
    });
    root.querySelector(".gt-dialog-cancel")?.addEventListener("click", ev => { ev.preventDefault(); this.close(); });
  }
}

class GothicTalesAlchemyPlayerDialog extends GothicTalesApplicationV2 {
  constructor(actor, session = {}, options = {}) {
    super(options);
    this.actor = actor;
    this.session = session;
    this.mode = "heiltrank";
    this.batches = 1;
    this.tasks = [];
    this.effects = [];
    this.done = false;
  }
  static DEFAULT_OPTIONS = {
    id: "gothic-tales-alchemy-player",
    classes: ["gothic-tales", "gt-app", "gt-v2-window", "gt-dialog-window", "gt-alchemy-player-window"],
    window: {title: "Alchemie", resizable: true},
    position: {width: 760, height: "auto"}
  };
  static PARTS = {body: {template: "systems/gothic-tales/templates/dialog-alchemy-player.hbs", scrollable: [".gt-alchemy-player"]}};
  get recipeOptions() {
    const rank = GT.alchemyRankInfo(this.actor);
    const options = [
      {id: "heiltrank", label: "Heiltrank", minRank: 0},
      {id: "manatrank", label: "Manatrank", minRank: 0},
      ...GT.ALCHEMY_SIMPLE_RECIPES.map(r => ({id: r.id, label: r.label, minRank: r.rank})),
      {id: "permanent", label: "Permanenter Trank", minRank: 3}
    ];
    return options.filter(o => rank.rank >= o.minRank).map(o => ({...o, selected: this.mode === o.id}));
  }
  getData() {
    const rank = GT.alchemyRankInfo(this.actor);
    const blocked = [];
    if (!rank.learned) blocked.push("Alchemie nicht gelernt");
    if (!this.session.hasTable) blocked.push("kein Alchemietisch vorhanden");
    const simple = GT.ALCHEMY_SIMPLE_RECIPES.find(r => r.id === this.mode);
    return {
      actor: this.actor,
      rank,
      note: this.session.note || "",
      hasTable: !!this.session.hasTable,
      blocked: blocked.length > 0,
      blockedReason: blocked.join("; "),
      recipeOptions: this.recipeOptions,
      mode: this.mode,
      isTaskPotion: this.mode === "heiltrank" || this.mode === "manatrank",
      isPermanent: this.mode === "permanent",
      simpleRecipe: simple,
      batches: this.batches,
      maxBatches: this.mode === "manatrank" ? 4 : 5,
      herbCostText: this.mode === "manatrank" ? "8 Manakräuter je Ansatz" : "10 Heilkräuter je Ansatz",
      tasks: this.tasks,
      effects: this.effects,
      effectText: this.effects.length ? this.effects.join(" ") : "noch keine Wirkung",
      done: this.done,
      permanentOptions: GT.ALCHEMY_PERMANENT.map(p => ({...p}))
    };
  }
  async createPotion(name, description, value = "") {
    await GT.stackOrCreateItem(this.actor, {
      name,
      type: "consumable",
      quantity: 1,
      value,
      category: "Trank",
      properties: "Alchemie",
      description
    });
  }
  async generateTasks(root) {
    this.tasks = [];
    this.effects = [];
    this.done = false;
    const max = this.mode === "manatrank" ? 4 : 5;
    this.batches = Math.max(1, Math.min(max, Number(root.querySelector(".gt-alchemy-batches")?.value || 1)));
    const rank = GT.alchemyRankInfo(this.actor);
    const formula = GT.professionFormulaWithoutD20(this.actor, rank.node || {attributes: ["konz", "ge"]});
    for (let i = 0; i < this.batches; i++) {
      const message = await GT.chatRoll({
        formula,
        label: "Alchemie: Aufgabe bestimmen",
        actor: this.actor,
        flavor: `Ansatz ${i + 1}/${this.batches} · FähW&B ohne W20`,
        configure: false
      });
      const total = Number(message?.getFlag?.("gothic-tales", "rollTotal") ?? 1);
      const task = GT.alchemyTaskForRoll(this.mode, total);
      this.tasks.push({index: i, roll: total, ...task, solved: false, result: ""});
    }
    this.render(false);
  }
  async solveTask(index) {
    const task = this.tasks[Number(index)];
    if (!task || task.solved) return;
    const rank = GT.alchemyRankInfo(this.actor);
    await GT.chatRoll({
      formula: GT.professionFormula(this.actor, rank.node || {attributes: ["konz", "ge"]}),
      label: `Alchemie: ${task.task}`,
      actor: this.actor,
      flavor: `SchwG ${task.difficulty}`,
      onRoll: async message => {
        const total = Number(message?.getFlag?.("gothic-tales", "rollTotal") ?? 0);
        const success = total >= Number(task.difficulty || 0);
        task.solved = true;
        task.result = success ? task.success : task.failure;
        this.effects.push(task.result);
        await ChatMessage.create({speaker: ChatMessage.getSpeaker({actor: this.actor}), content: `<div class="gothic-tales chat-card gt-crafting-result"><h2><i class="fas fa-flask"></i> Alchemie-Aufgabe</h2><p>${GT.escape(task.task)} · Wurf ${total} gegen SchwG ${task.difficulty}</p><p>${success ? "Erfolg" : "Fehlschlag"}: <strong>${GT.escape(task.result)}</strong></p></div>`});
        if (this.tasks.every(t => t.solved)) await this.finishTaskPotion();
        this.render(false);
      }
    });
  }
  async finishTaskPotion() {
    if (this.done) return;
    this.done = true;
    const name = this.mode === "manatrank" ? "Manatrank" : "Heiltrank";
    const effectText = this.effects.join(" ") || "keine Wirkung";
    await this.createPotion(`${name} (${effectText})`, `<p>Selbst gebrauter ${name}.</p><p>Wirkung: <strong>${GT.escape(effectText)}</strong></p>`);
    await ChatMessage.create({speaker: ChatMessage.getSpeaker({actor: this.actor}), content: `<div class="gothic-tales chat-card gt-crafting-result"><h2><i class="fas fa-flask-vial"></i> ${GT.escape(name)} fertig</h2><p>Wirkung: <strong>${GT.escape(effectText)}</strong></p><p>Der Trank wurde ins Inventar gelegt.</p></div>`});
  }
  async brewSimple() {
    const recipe = GT.ALCHEMY_SIMPLE_RECIPES.find(r => r.id === this.mode);
    if (!recipe) return;
    const rank = GT.alchemyRankInfo(this.actor);
    await GT.chatRoll({
      formula: GT.professionFormula(this.actor, rank.node || {attributes: ["konz", "ge"]}),
      label: `Alchemie: ${recipe.label}`,
      actor: this.actor,
      flavor: `SchwG ${recipe.difficulty}`,
      onRoll: async message => {
        const total = Number(message?.getFlag?.("gothic-tales", "rollTotal") ?? 0);
        const criticalFailure = GT.criticalFailureFromMessage(message);
        if (total >= recipe.difficulty) {
          await this.createPotion(recipe.label, `<p>${GT.escape(recipe.description)}</p>`, recipe.value);
          ui.notifications.info(`${recipe.label} wurde ins Inventar gelegt.`);
        }
        await ChatMessage.create({speaker: ChatMessage.getSpeaker({actor: this.actor}), content: `<div class="gothic-tales chat-card gt-crafting-result"><h2><i class="fas fa-flask"></i> ${GT.escape(recipe.label)}</h2><p>Wurf ${total} gegen SchwG ${recipe.difficulty}.</p><p>${total >= recipe.difficulty ? "Erfolg: Trank hergestellt." : (criticalFailure ? "Kritischer Fehlschlag: alle Ingredienzien verloren." : "Fehlschlag: eine Ingredienz verloren.")}</p></div>`});
        this.render(false);
      }
    });
  }
  async brewPermanent(root) {
    const id = String(root.querySelector(".gt-alchemy-permanent")?.value || "kraft");
    const recipe = GT.ALCHEMY_PERMANENT.find(r => r.id === id) || GT.ALCHEMY_PERMANENT[0];
    const rank = GT.alchemyRankInfo(this.actor);
    await GT.chatRoll({
      formula: GT.professionFormula(this.actor, rank.node || {attributes: ["konz", "ge"]}),
      label: `Alchemie: ${recipe.label}`,
      actor: this.actor,
      flavor: `SchwG 30 · benötigt Kronstöckel und ${recipe.herb}`,
      onRoll: async message => {
        const total = Number(message?.getFlag?.("gothic-tales", "rollTotal") ?? 0);
        const criticalFailure = GT.criticalFailureFromMessage(message);
        if (total >= 30) await this.createPotion(recipe.label, `<p>Permanenter Trank für ${GT.escape(recipe.attribute)}.</p><p>Benötigt: Kronstöckel und ${GT.escape(recipe.herb)}.</p>`, 120);
        await ChatMessage.create({speaker: ChatMessage.getSpeaker({actor: this.actor}), content: `<div class="gothic-tales chat-card gt-crafting-result"><h2><i class="fas fa-vial-circle-check"></i> ${GT.escape(recipe.label)}</h2><p>Wurf ${total} gegen SchwG 30.</p><p>${total >= 30 ? "Erfolg: Permanenter Trank hergestellt." : (criticalFailure ? "Kritischer Fehlschlag: beide Ingredienzien verloren." : "Fehlschlag: eine Ingredienz nach Wahl verloren.")}</p></div>`});
        this.render(false);
      }
    });
  }
  activateListeners(html) {
    super.activateListeners(html);
    const root = GT.htmlRoot(html);
    root.querySelector(".gt-alchemy-mode")?.addEventListener("change", ev => {
      this.mode = ev.currentTarget.value || "heiltrank";
      this.tasks = [];
      this.effects = [];
      this.done = false;
      this.render(false);
    });
    root.querySelector(".gt-alchemy-generate")?.addEventListener("click", ev => {
      ev.preventDefault();
      const data = this.getData();
      if (data.blocked) return ui.notifications.warn(data.blockedReason);
      this.generateTasks(root);
    });
    root.querySelectorAll(".gt-alchemy-solve").forEach(button => button.addEventListener("click", ev => {
      ev.preventDefault();
      const data = this.getData();
      if (data.blocked) return ui.notifications.warn(data.blockedReason);
      this.solveTask(ev.currentTarget.dataset.index);
    }));
    root.querySelector(".gt-alchemy-simple")?.addEventListener("click", ev => {
      ev.preventDefault();
      const data = this.getData();
      if (data.blocked) return ui.notifications.warn(data.blockedReason);
      this.brewSimple();
    });
    root.querySelector(".gt-alchemy-permanent-roll")?.addEventListener("click", ev => {
      ev.preventDefault();
      const data = this.getData();
      if (data.blocked) return ui.notifications.warn(data.blockedReason);
      this.brewPermanent(root);
    });
    root.querySelector(".gt-dialog-cancel")?.addEventListener("click", ev => { ev.preventDefault(); this.close(); });
  }
}

/* ---------------------------- Schmiedekunst ------------------------------ */

GT.SMITHING_TASKS = [
  {id: 1, label: "Erz einschichten", skills: "Objekte Bewegen / Gewandtheit"},
  {id: 2, label: "Kohle schaufeln", skills: "Objekte Bewegen / Durchhalten"},
  {id: 3, label: "Hitze kontrollieren", skills: "Gewandtheit / Wahrnehmen"},
  {id: 4, label: "Rohling wenden und halten", skills: "Gewandtheit / Objekte Bewegen"},
  {id: 5, label: "Blasebalg betätigen", skills: "Durchhalten"}
];

GT.SMITHING_TYPES = [
  {id: "einhand-schwert", label: "Einhand (Schwert)", difficulty: 10, attribute: "st", bonus: ""},
  {id: "einhand-axt", label: "Einhand (Axt)", difficulty: 10, attribute: "st", bonus: ""},
  {id: "einhand-streitkolben", label: "Einhand (Streitkolben)", difficulty: 10, attribute: "st", bonus: ""},
  {id: "einhand-messer", label: "Einhand (Messer, Agil)", difficulty: 15, attribute: "ge", bonus: "Agil"},
  {id: "zweihand-schwert", label: "Zweihand (Schwert, +1)", difficulty: 15, attribute: "st", bonus: "+1"},
  {id: "zweihand-axt", label: "Zweihand (Axt, +1)", difficulty: 15, attribute: "st", bonus: "+1"},
  {id: "zweihand-hammer", label: "Zweihand (Hammer, +1)", difficulty: 15, attribute: "st", bonus: "+1"}
];

GT.SMITHING_DICE = [
  {id: "w2", label: "w2", difficulty: 5},
  {id: "w4", label: "w4", difficulty: 10},
  {id: "w6", label: "w6", difficulty: 15},
  {id: "w8", label: "w8", difficulty: 20},
  {id: "w10", label: "w10", difficulty: 25},
  {id: "w12", label: "w12", difficulty: 30}
];

GT.SMITHING_BONUS = [
  {id: "0", label: "0", difficulty: 5},
  {id: "+1", label: "+1", difficulty: 10},
  {id: "+2", label: "+2", difficulty: 15},
  {id: "+3", label: "+3", difficulty: 20},
  {id: "+4", label: "+4", difficulty: 25},
  {id: "+5", label: "+5", difficulty: 30}
];

GT.SMITHING_PROPERTIES = [
  {id: "lang", label: "Lang", difficulty: 20},
  {id: "weiter-hieb-1", label: "Weiter Hieb I", difficulty: 20},
  {id: "weiter-hieb-2", label: "Weiter Hieb II", difficulty: 25},
  {id: "garstig", label: "Garstig", difficulty: 20},
  {id: "wucht", label: "Wucht", difficulty: 20},
  {id: "stossen-1", label: "Stoßen 1", difficulty: 15},
  {id: "stossen-2", label: "Stoßen 2", difficulty: 20},
  {id: "stossen-3", label: "Stoßen 3", difficulty: 25},
  {id: "erzwaffe", label: "Erzwaffe", difficulty: 20}
];

GT.startSmithingSession = function(options = {}) {
  if (!game.user?.isGM) return ui.notifications.warn("Nur der Spielleiter kann Schmiedekunst vorbereiten.");
  const userId = String(options.userId || "");
  const target = game.users?.get?.(userId);
  if (!target?.active) return ui.notifications.warn("Der gewählte Spieler ist nicht aktiv.");
  const payload = {
    type: "smithingStart",
    userId,
    session: {id: GT.safeRandomID(), gmId: game.user.id, hasForge: !!options.hasForge, hasHammer: !!options.hasHammer, note: String(options.note || "")}
  };
  game.socket?.emit?.("system.gothic-tales", payload);
  GT.handleSocketMessage(payload);
  ui.notifications.info(`Schmiedekunst an ${target.name} gesendet.`);
};

class GothicTalesSmithingGMDialog extends GothicTalesApplicationV2 {
  constructor(options = {}) {
    super(options);
    this.settings = {userId: String(options.userId || ""), hasForge: options.hasForge !== false, hasHammer: options.hasHammer !== false, note: String(options.note || "")};
  }
  static DEFAULT_OPTIONS = {
    id: "gothic-tales-smithing-gm",
    classes: ["gothic-tales", "gt-app", "gt-v2-window", "gt-dialog-window", "gt-smithing-gm-window"],
    window: {title: "Schmiedekunst vorbereiten", resizable: true},
    position: {width: 660, height: "auto"}
  };
  static PARTS = {body: {template: "systems/gothic-tales/templates/dialog-smithing-gm.hbs"}};
  getData() { return {...this.settings, users: GT.lockpickingOnlineUsers(this.settings.userId)}; }
  readForm(root) {
    return {
      userId: String(root.querySelector(".gt-smithing-user")?.value || ""),
      hasForge: !!root.querySelector(".gt-smithing-forge")?.checked,
      hasHammer: !!root.querySelector(".gt-smithing-hammer")?.checked,
      note: String(root.querySelector(".gt-smithing-note")?.value || "")
    };
  }
  activateListeners(html) {
    super.activateListeners(html);
    const root = GT.htmlRoot(html);
    root.addEventListener("submit", ev => {
      ev.preventDefault();
      this.settings = this.readForm(root);
      GT.startSmithingSession(this.settings);
      this.close();
    });
    root.querySelector(".gt-dialog-cancel")?.addEventListener("click", ev => { ev.preventDefault(); this.close(); });
  }
}

class GothicTalesSmithingPlayerDialog extends GothicTalesApplicationV2 {
  constructor(actor, session = {}, options = {}) {
    super(options);
    this.actor = actor;
    this.session = session;
    this.prep = GT.SMITHING_TASKS.map(t => ({...t, enabled: false, material: "iron", difficulty: null, helperTotal: 0, helperDie: "w4", success: false, awarded: ""}));
    this.weapon = {name: "Geschmiedete Waffe", type: null, die: null, bonus: null, secondDie: "", properties: [], malus: 0};
  }
  static DEFAULT_OPTIONS = {
    id: "gothic-tales-smithing-player",
    classes: ["gothic-tales", "gt-app", "gt-v2-window", "gt-dialog-window", "gt-smithing-player-window"],
    window: {title: "Schmiedekunst", resizable: true},
    position: {width: 820, height: "auto"}
  };
  static PARTS = {body: {template: "systems/gothic-tales/templates/dialog-smithing-player.hbs", scrollable: [".gt-smithing-player"]}};
  get dicePool() {
    return this.prep.flatMap(p => p.awarded ? [p.awarded] : []);
  }
  getData() {
    const rank = GT.rankInfoForProfession(this.actor, "schmiedekunst", [{rank: 0, label: "gelernt"}]);
    const blocked = [];
    if (!rank.learned) blocked.push("Schmiedekunst nicht gelernt");
    if (!this.session.hasForge) blocked.push("keine Schmiede vorhanden");
    if (!this.session.hasHammer && !GT.hasItemNamed(this.actor, /schmiedehammer/i)) blocked.push("kein Schmiedehammer bestätigt/gefunden");
    return {
      actor: this.actor,
      rank,
      blocked: blocked.length > 0,
      blockedReason: blocked.join("; "),
      note: this.session.note || "",
      prep: this.prep,
      dicePool: this.dicePool,
      typeOptions: GT.SMITHING_TYPES.map(o => ({...o, selected: this.weapon.type === o.id})),
      dieOptions: GT.SMITHING_DICE.map(o => ({...o, selected: this.weapon.die === o.id})),
      bonusOptions: GT.SMITHING_BONUS.map(o => ({...o, selected: this.weapon.bonus === o.id})),
      secondDieOptions: [{id: "", label: "kein zweiter Waffen-W", difficulty: 0}, ...GT.SMITHING_DICE.map(d => ({...d, difficulty: d.difficulty + 25}))].map(o => ({...o, selected: this.weapon.secondDie === o.id})),
      propertyOptions: GT.SMITHING_PROPERTIES.map(o => ({...o, selected: this.weapon.properties.includes(o.id)})),
      weapon: this.weapon,
      resultText: this.weaponResultText()
    };
  }
  weaponResultText() {
    const type = GT.SMITHING_TYPES.find(o => o.id === this.weapon.type)?.label || "Art offen";
    const die = this.weapon.die || "Waffen-W offen";
    const second = this.weapon.secondDie ? ` + ${this.weapon.secondDie}` : "";
    const bonus = this.weapon.bonus || "Bonus offen";
    const props = this.weapon.properties.map(id => GT.SMITHING_PROPERTIES.find(p => p.id === id)?.label || id).join(", ") || "keine Eigenschaften";
    const malus = this.weapon.malus ? ` · Malus ${this.weapon.malus}` : "";
    return `${type} · ${die}${second} · ${bonus} · ${props}${malus}`;
  }
  async smithFormulaRoll(label, difficulty, extraFormula, onRoll) {
    const rank = GT.rankInfoForProfession(this.actor, "schmiedekunst", [{rank: 0, label: "gelernt"}]);
    const formula = `${GT.professionFormula(this.actor, rank.node || {attributes: ["st", "erf"]})}${extraFormula ? ` + ${extraFormula}` : ""}`;
    return GT.chatRoll({formula, label, actor: this.actor, flavor: `SchwG ${difficulty}${extraFormula ? ` · Zusatz: ${extraFormula}` : ""}`, onRoll});
  }
  readCurrentSelections(root) {
    this.weapon.name = String(root.querySelector(".gt-smithing-name")?.value || "Geschmiedete Waffe");
    this.weapon.type = String(root.querySelector(".gt-smithing-type")?.value || this.weapon.type || "");
    this.weapon.die = String(root.querySelector(".gt-smithing-die")?.value || this.weapon.die || "");
    this.weapon.bonus = String(root.querySelector(".gt-smithing-bonus")?.value || this.weapon.bonus || "");
    this.weapon.secondDie = String(root.querySelector(".gt-smithing-second-die")?.value || "");
    this.weapon.properties = Array.from(root.querySelectorAll(".gt-smithing-property:checked")).map(cb => cb.value);
  }
  async forgeStep(root, kind) {
    this.readCurrentSelections(root);
    const extra = String(root.querySelector(".gt-smithing-extra-dice")?.value || "").trim();
    let opt = null;
    if (kind === "type") opt = GT.SMITHING_TYPES.find(o => o.id === this.weapon.type);
    if (kind === "die") opt = GT.SMITHING_DICE.find(o => o.id === this.weapon.die);
    if (kind === "bonus") opt = GT.SMITHING_BONUS.find(o => o.id === this.weapon.bonus);
    if (kind === "second") opt = [{id: "", label: "kein zweiter Waffen-W", difficulty: 0}, ...GT.SMITHING_DICE.map(d => ({...d, difficulty: d.difficulty + 25}))].find(o => o.id === this.weapon.secondDie);
    if (!opt || !opt.difficulty) return ui.notifications.warn("Bitte eine gültige Auswahl mit SchwG wählen.");
    await this.smithFormulaRoll(`Schmiedekunst: ${opt.label}`, opt.difficulty, extra, async message => {
      const total = Number(message?.getFlag?.("gothic-tales", "rollTotal") ?? 0);
      const success = total >= opt.difficulty;
      if (!success) this.weapon.malus -= 1;
      await ChatMessage.create({speaker: ChatMessage.getSpeaker({actor: this.actor}), content: `<div class="gothic-tales chat-card gt-crafting-result"><h2><i class="fas fa-hammer"></i> Schmiedephase</h2><p>${GT.escape(opt.label)} · Wurf ${total} gegen SchwG ${opt.difficulty}</p><p>${success ? "Erfolg: Auswahl steht." : "Fehlschlag: Waffe erhält Malus -1."}</p></div>`});
      this.render(false);
    });
  }
  async createWeapon(root) {
    this.readCurrentSelections(root);
    const type = GT.SMITHING_TYPES.find(o => o.id === this.weapon.type);
    const props = this.weapon.properties.map(id => GT.SMITHING_PROPERTIES.find(p => p.id === id)?.label || id);
    const damage = `${this.weapon.die || "w2"}${this.weapon.secondDie ? ` + ${this.weapon.secondDie}` : ""}${this.weapon.bonus && this.weapon.bonus !== "0" ? ` ${this.weapon.bonus}` : ""}${this.weapon.malus ? ` ${this.weapon.malus}` : ""}`;
    await GT.stackOrCreateItem(this.actor, {
      name: this.weapon.name || "Geschmiedete Waffe",
      type: "weapon",
      quantity: 1,
      category: "Nahkampfwaffe",
      properties: props.join(", "),
      description: `<p>Geschmiedete Waffe.</p><p>${GT.escape(this.weaponResultText())}</p><p>Gesammelte Vorbereitungswürfel: ${GT.escape(this.dicePool.join(", ") || "keine")}.</p>`,
      system: {
        damage,
        attribute: type?.attribute || "st",
        requirements: `${type?.attribute === "ge" ? "Geschick" : "Stärke"} des Schmieds`,
        equipped: false
      }
    });
    await ChatMessage.create({speaker: ChatMessage.getSpeaker({actor: this.actor}), content: `<div class="gothic-tales chat-card gt-crafting-result"><h2><i class="fas fa-sword"></i> Waffe fertig</h2><p><strong>${GT.escape(this.weapon.name || "Geschmiedete Waffe")}</strong> wurde ins Inventar gelegt.</p><p>${GT.escape(this.weaponResultText())}</p></div>`});
    this.render(false);
  }
  activateListeners(html) {
    super.activateListeners(html);
    const root = GT.htmlRoot(html);
    root.querySelectorAll(".gt-smithing-prep-roll").forEach(button => button.addEventListener("click", ev => {
      ev.preventDefault();
      const idx = Number(ev.currentTarget.dataset.index || 0);
      const prep = this.prep[idx];
      prep.enabled = true;
      prep.material = String(root.querySelector(`.gt-smithing-prep-material[data-index="${idx}"]`)?.value || "iron");
      this.smithFormulaRoll(`Schmiedekunst: Vorbereitung ${idx + 1}`, 0, "", async message => {
        const total = Number(message?.getFlag?.("gothic-tales", "rollTotal") ?? 0);
        prep.difficulty = Math.max(0, 30 - total);
        await ChatMessage.create({speaker: ChatMessage.getSpeaker({actor: this.actor}), content: `<div class="gothic-tales chat-card gt-crafting-result"><h2><i class="fas fa-fire"></i> Vorbereitungsaufgabe</h2><p>${GT.escape(prep.label)}: 30 - ${total} = <strong>SchwG ${prep.difficulty}</strong>.</p><p>Material: ${prep.material === "magic" ? "Magisches Erz" : "Eisenerz"}.</p></div>`});
        this.render(false);
      });
    }));
    root.querySelectorAll(".gt-smithing-helper-save").forEach(button => button.addEventListener("click", ev => {
      ev.preventDefault();
      const idx = Number(ev.currentTarget.dataset.index || 0);
      const prep = this.prep[idx];
      prep.helperTotal = Number(root.querySelector(`.gt-smithing-helper-total[data-index="${idx}"]`)?.value || 0);
      prep.helperDie = String(root.querySelector(`.gt-smithing-helper-die[data-index="${idx}"]`)?.value || "w4");
      prep.success = prep.difficulty !== null && prep.helperTotal >= Number(prep.difficulty || 0);
      prep.awarded = prep.success ? (prep.material === "magic" ? `${prep.helperDie} + ${prep.helperDie}` : prep.helperDie) : "";
      this.render(false);
    }));
    root.querySelectorAll(".gt-smithing-forge-step").forEach(button => button.addEventListener("click", ev => {
      ev.preventDefault();
      const data = this.getData();
      if (data.blocked) return ui.notifications.warn(data.blockedReason);
      this.forgeStep(root, ev.currentTarget.dataset.step);
    }));
    root.querySelector(".gt-smithing-create")?.addEventListener("click", ev => {
      ev.preventDefault();
      const data = this.getData();
      if (data.blocked) return ui.notifications.warn(data.blockedReason);
      this.createWeapon(root);
    });
    root.querySelector(".gt-dialog-cancel")?.addEventListener("click", ev => { ev.preventDefault(); this.close(); });
  }
}

/* ----------------------------- Schnitzkunst ------------------------------ */

GT.CARVING_RANKS = [
  {rank: 0, label: "Anfänger"},
  {rank: 1, label: "geübt"},
  {rank: 2, label: "gelehrt"}
];

GT.carvingRankInfo = function(actor) {
  return GT.rankInfoForProfession(actor, "schnitzkunst", GT.CARVING_RANKS);
};

GT.SPECIAL_AMMO = [
  {id: "reisszahn", label: "Reißzahn", difficulty: 10, material: "3 / 7 Zähne, Krallen und Klauen"},
  {id: "breitkopf", label: "Breitkopf", difficulty: 10, material: "2 Eisenerz"},
  {id: "erzbreitkopf", label: "Erzbreitkopf", difficulty: 15, material: "2 magisches Erz"},
  {id: "widerhaken", label: "Widerhaken", difficulty: 15, material: "4 Eisenerz"},
  {id: "bodkin", label: "Bodkin", difficulty: 15, material: "3 Eisenerz"}
];

GT.carvingDieFromPoints = function(points) {
  const p = Number(points || 0);
  if (p >= 19) return "w12 + w2";
  if (p >= 17) return "w10 + w2";
  if (p >= 15) return "w12";
  if (p >= 12) return "w10";
  if (p >= 10) return "w8";
  if (p >= 8) return "w6";
  if (p >= 4) return "w4";
  return "w2";
};

GT.carvingBonusFromPoints = function(points) {
  const p = Number(points || 0);
  if (p >= 14) return "+5";
  if (p >= 11) return "+4";
  if (p >= 8) return "+3";
  if (p >= 5) return "+2";
  if (p >= 3) return "+1";
  return "0";
};

GT.startCarvingSession = function(options = {}) {
  if (!game.user?.isGM) return ui.notifications.warn("Nur der Spielleiter kann Schnitzkunst vorbereiten.");
  const userId = String(options.userId || "");
  const target = game.users?.get?.(userId);
  if (!target?.active) return ui.notifications.warn("Der gewählte Spieler ist nicht aktiv.");
  const payload = {
    type: "carvingStart",
    userId,
    session: {id: GT.safeRandomID(), gmId: game.user.id, hasKnife: !!options.hasKnife, suitableWood: !!options.suitableWood, note: String(options.note || "")}
  };
  game.socket?.emit?.("system.gothic-tales", payload);
  GT.handleSocketMessage(payload);
  ui.notifications.info(`Schnitzkunst an ${target.name} gesendet.`);
};

class GothicTalesCarvingGMDialog extends GothicTalesApplicationV2 {
  constructor(options = {}) {
    super(options);
    this.settings = {userId: String(options.userId || ""), hasKnife: options.hasKnife !== false, suitableWood: options.suitableWood !== false, note: String(options.note || "")};
  }
  static DEFAULT_OPTIONS = {
    id: "gothic-tales-carving-gm",
    classes: ["gothic-tales", "gt-app", "gt-v2-window", "gt-dialog-window", "gt-carving-gm-window"],
    window: {title: "Schnitzkunst vorbereiten", resizable: true},
    position: {width: 660, height: "auto"}
  };
  static PARTS = {body: {template: "systems/gothic-tales/templates/dialog-carving-gm.hbs"}};
  getData() { return {...this.settings, users: GT.lockpickingOnlineUsers(this.settings.userId)}; }
  readForm(root) {
    return {
      userId: String(root.querySelector(".gt-carving-user")?.value || ""),
      hasKnife: !!root.querySelector(".gt-carving-knife")?.checked,
      suitableWood: !!root.querySelector(".gt-carving-wood")?.checked,
      note: String(root.querySelector(".gt-carving-note")?.value || "")
    };
  }
  activateListeners(html) {
    super.activateListeners(html);
    const root = GT.htmlRoot(html);
    root.addEventListener("submit", ev => {
      ev.preventDefault();
      this.settings = this.readForm(root);
      GT.startCarvingSession(this.settings);
      this.close();
    });
    root.querySelector(".gt-dialog-cancel")?.addEventListener("click", ev => { ev.preventDefault(); this.close(); });
  }
}

class GothicTalesCarvingPlayerDialog extends GothicTalesApplicationV2 {
  constructor(actor, session = {}, options = {}) {
    super(options);
    this.actor = actor;
    this.session = session;
    this.mode = "basic";
    this.specialSuccesses = 0;
    this.bow = {woodQuality: 0, woodSteps: 0, woodPoints: 0, stringQuality: 0, stringSteps: 0, stringPoints: 0, range: "10/20", property: ""};
  }
  static DEFAULT_OPTIONS = {
    id: "gothic-tales-carving-player",
    classes: ["gothic-tales", "gt-app", "gt-v2-window", "gt-dialog-window", "gt-carving-player-window"],
    window: {title: "Schnitzkunst", resizable: true},
    position: {width: 800, height: "auto"}
  };
  static PARTS = {body: {template: "systems/gothic-tales/templates/dialog-carving-player.hbs", scrollable: [".gt-carving-player"]}};
  getData() {
    const rank = GT.carvingRankInfo(this.actor);
    const blocked = [];
    if (!rank.learned) blocked.push("Schnitzkunst nicht gelernt");
    if (!this.session.hasKnife && !GT.hasItemNamed(this.actor, /schnitzmesser/i)) blocked.push("kein Schnitzmesser bestätigt/gefunden");
    const modeOptions = [
      {id: "basic", label: "Pfeile/Bolzen", minRank: 0},
      {id: "special", label: "Besondere Munition", minRank: 1},
      {id: "bow", label: "Bogenbau", minRank: 2}
    ].filter(o => rank.rank >= o.minRank).map(o => ({...o, selected: this.mode === o.id}));
    return {
      actor: this.actor,
      rank,
      blocked: blocked.length > 0,
      blockedReason: blocked.join("; "),
      note: this.session.note || "",
      mode: this.mode,
      modeOptions,
      isBasic: this.mode === "basic",
      isSpecial: this.mode === "special",
      isBow: this.mode === "bow",
      ammoOptions: GT.SPECIAL_AMMO.map(a => ({...a})),
      specialSuccesses: this.specialSuccesses,
      bow: this.bow,
      bowDie: GT.carvingDieFromPoints(this.bow.woodPoints),
      bowBonus: GT.carvingBonusFromPoints(this.bow.stringPoints)
    };
  }
  async carvingRoll(label, flavor, onRoll) {
    const rank = GT.carvingRankInfo(this.actor);
    return GT.chatRoll({formula: GT.professionFormula(this.actor, rank.node || {attributes: ["ge", "ausd"]}), label, actor: this.actor, flavor, onRoll});
  }
  async handleCritFail(message) {
    if (GT.criticalFailureFromMessage(message)) {
      await ChatMessage.create({speaker: ChatMessage.getSpeaker({actor: this.actor}), content: `<div class="gothic-tales chat-card gt-crafting-result"><h2><i class="fas fa-bandage"></i> Kritischer Fehlschlag</h2><p>${GT.escape(this.actor.name)} schneidet sich in den Finger und erhält <strong>5 Schaden</strong>.</p></div>`});
      return true;
    }
    return false;
  }
  async craftBasic(root) {
    const kind = String(root.querySelector(".gt-carving-basic-kind")?.value || "Pfeile");
    await this.carvingRoll(`Schnitzkunst: ${kind}`, "Pfeile/Bolzen während einer Rast schnitzen", async message => {
      await this.handleCritFail(message);
      const total = Number(message?.getFlag?.("gothic-tales", "rollTotal") ?? 0);
      const qty = Math.max(0, Math.floor(total / 3));
      if (qty > 0) await GT.stackOrCreateItem(this.actor, {name: kind, type: "consumable", quantity: qty, value: "", category: "Munition", properties: "Munition", description: `<p>Geschnitzte ${GT.escape(kind)}.</p>`});
      await ChatMessage.create({speaker: ChatMessage.getSpeaker({actor: this.actor}), content: `<div class="gothic-tales chat-card gt-crafting-result"><h2><i class="fas fa-feather-pointed"></i> Schnitzkunst</h2><p>Wurf ${total}: <strong>${qty}× ${GT.escape(kind)}</strong> hergestellt.</p></div>`});
      this.render(false);
    });
  }
  async craftSpecial(root) {
    const ammo = GT.SPECIAL_AMMO.find(a => a.id === String(root.querySelector(".gt-carving-ammo")?.value || "")) || GT.SPECIAL_AMMO[0];
    const amount = Math.max(1, Math.min(6, Number(root.querySelector(".gt-carving-ammo-count")?.value || 1)));
    this.specialSuccesses = 0;
    for (let i = 0; i < amount; i++) {
      const message = await GT.chatRoll({
        formula: GT.professionFormula(this.actor, GT.carvingRankInfo(this.actor).node || {attributes: ["ge", "ausd"]}),
        label: `Schnitzkunst: ${ammo.label}`,
        actor: this.actor,
        flavor: `${i + 1}/${amount} · SchwG ${ammo.difficulty}`,
        configure: false
      });
      await this.handleCritFail(message);
      const total = Number(message?.getFlag?.("gothic-tales", "rollTotal") ?? 0);
      const critical = GT.criticalSuccessFromMessage(message);
      if (critical) {
        this.specialSuccesses = amount;
        break;
      }
      if (total >= ammo.difficulty) this.specialSuccesses += 1;
    }
    if (this.specialSuccesses > 0) await GT.stackOrCreateItem(this.actor, {name: ammo.label, type: "consumable", quantity: this.specialSuccesses, value: "", category: "Besondere Munition", properties: ammo.material, description: `<p>${GT.escape(ammo.label)}.</p><p>Material: ${GT.escape(ammo.material)}.</p>`});
    await ChatMessage.create({speaker: ChatMessage.getSpeaker({actor: this.actor}), content: `<div class="gothic-tales chat-card gt-crafting-result"><h2><i class="fas fa-location-crosshairs"></i> Besondere Munition</h2><p>${GT.escape(ammo.label)}: <strong>${this.specialSuccesses}/${amount}</strong> hergestellt.</p><p>Materialhinweis: ${GT.escape(ammo.material)}</p></div>`});
    this.render(false);
  }
  async processMaterial(kind) {
    const quality = kind === "wood" ? this.bow.woodQuality : this.bow.stringQuality;
    if (!quality) return ui.notifications.warn("Es wurde noch keine Qualität bestimmt.");
    await this.carvingRoll(`Schnitzkunst: ${kind === "wood" ? "Holz bearbeiten" : "Sehne drehen"}`, `SchwG ${quality}`, async message => {
      await this.handleCritFail(message);
      const total = Number(message?.getFlag?.("gothic-tales", "rollTotal") ?? 0);
      const critical = GT.criticalSuccessFromMessage(message);
      const success = total >= quality;
      const points = Math.floor(quality / (success ? 5 : 10)) + (critical ? 4 : 0);
      if (kind === "wood") {
        this.bow.woodSteps = Math.min(3, this.bow.woodSteps + 1);
        this.bow.woodPoints += points;
      } else {
        this.bow.stringSteps = Math.min(3, this.bow.stringSteps + 1);
        this.bow.stringPoints += points;
      }
      await ChatMessage.create({speaker: ChatMessage.getSpeaker({actor: this.actor}), content: `<div class="gothic-tales chat-card gt-crafting-result"><h2><i class="fas fa-tree"></i> Bogenbau</h2><p>Wurf ${total} gegen Qualität ${quality}: <strong>+${points} Punkte</strong>.</p></div>`});
      this.render(false);
    });
  }
  async createBow(root) {
    this.bow.range = String(root.querySelector(".gt-carving-bow-range")?.value || "10/20");
    this.bow.property = String(root.querySelector(".gt-carving-bow-property")?.value || "");
    const die = GT.carvingDieFromPoints(this.bow.woodPoints);
    const bonus = GT.carvingBonusFromPoints(this.bow.stringPoints);
    const property = this.bow.property || "keine";
    await GT.stackOrCreateItem(this.actor, {
      name: "Geschnitzter Bogen",
      type: "weapon",
      quantity: 1,
      category: "Fernkampfwaffe",
      properties: property,
      description: `<p>Selbst geschnitzter Bogen.</p><p>Holzpunkte: ${this.bow.woodPoints}; Sehnenpunkte: ${this.bow.stringPoints}; Reichweite: ${GT.escape(this.bow.range)}; Eigenschaft: ${GT.escape(property)}.</p>`,
      system: {damage: `${die}${bonus !== "0" ? ` ${bonus}` : ""}`, attribute: "ge", range: this.bow.range, targetDefense: "rk"}
    });
    await ChatMessage.create({speaker: ChatMessage.getSpeaker({actor: this.actor}), content: `<div class="gothic-tales chat-card gt-crafting-result"><h2><i class="fas fa-bow-arrow"></i> Bogen fertig</h2><p>Waffen-W: <strong>${GT.escape(die)}</strong> · Bonus: <strong>${GT.escape(bonus)}</strong> · Reichweite: <strong>${GT.escape(this.bow.range)}</strong></p><p>Der Bogen wurde ins Inventar gelegt.</p></div>`});
    this.render(false);
  }
  activateListeners(html) {
    super.activateListeners(html);
    const root = GT.htmlRoot(html);
    root.querySelector(".gt-carving-mode")?.addEventListener("change", ev => {
      this.mode = ev.currentTarget.value || "basic";
      this.render(false);
    });
    root.querySelector(".gt-carving-basic-roll")?.addEventListener("click", ev => {
      ev.preventDefault();
      const data = this.getData();
      if (data.blocked) return ui.notifications.warn(data.blockedReason);
      this.craftBasic(root);
    });
    root.querySelector(".gt-carving-special-roll")?.addEventListener("click", ev => {
      ev.preventDefault();
      const data = this.getData();
      if (data.blocked) return ui.notifications.warn(data.blockedReason);
      this.craftSpecial(root);
    });
    root.querySelector(".gt-carving-wood-search")?.addEventListener("click", ev => {
      ev.preventDefault();
      const data = this.getData();
      if (data.blocked) return ui.notifications.warn(data.blockedReason);
      if (!this.session.suitableWood) return ui.notifications.warn("Die Umgebung ist nicht als geeignet für Bogenholz markiert.");
      this.carvingRoll("Schnitzkunst: Holz suchen", "Qualität des Bogenholzes bestimmen", async message => {
        await this.handleCritFail(message);
        this.bow.woodQuality = Number(message?.getFlag?.("gothic-tales", "rollTotal") ?? 0);
        await ChatMessage.create({speaker: ChatMessage.getSpeaker({actor: this.actor}), content: `<div class="gothic-tales chat-card gt-crafting-result"><h2><i class="fas fa-tree"></i> Bogenholz</h2><p>Qualität: <strong>${this.bow.woodQuality}</strong>.</p><p class="gt-chat-note">Nächste Holzsuche in ${GT.bowWoodCooldownMinutes()} Minuten.</p></div>`});
        this.render(false);
      });
    });
    root.querySelector(".gt-carving-string-quality")?.addEventListener("change", ev => {
      this.bow.stringQuality = Math.max(0, Number(ev.currentTarget.value || 0));
      this.render(false);
    });
    root.querySelector(".gt-carving-wood-process")?.addEventListener("click", ev => { ev.preventDefault(); this.processMaterial("wood"); });
    root.querySelector(".gt-carving-string-process")?.addEventListener("click", ev => { ev.preventDefault(); this.processMaterial("string"); });
    root.querySelector(".gt-carving-bow-create")?.addEventListener("click", ev => {
      ev.preventDefault();
      const data = this.getData();
      if (data.blocked) return ui.notifications.warn(data.blockedReason);
      this.createBow(root);
    });
    root.querySelector(".gt-dialog-cancel")?.addEventListener("click", ev => { ev.preventDefault(); this.close(); });
  }
}

GT.hagglingDifficulty = function(price) {
  const p = Number(price || 0);
  if (p < 100) return 10;
  if (p <= 200) return 15;
  if (p <= 500) return 20;
  if (p <= 1500) return 25;
  return 30;
};

GT.hagglingCurrentPrice = function(basePrice, tenths) {
  return Math.max(0, Math.ceil(Number(basePrice || 0) * Number(tenths || 10) / 10));
};

GT.hagglingAdvantageLabel = function(mode, level) {
  if (!mode || mode === "none") return "Normal";
  return GT.advantageLabel(mode, level) || "Normal";
};

GT.hagglingFormulaOptions = function(actor) {
  const node = GT.actorBestProfessionEntry(actor, "feilschen")?.node
    || GT._professionScaffold?.trees?.flatMap(t => t.nodes ?? [])?.find(n => n.id === "feilschen")
    || {id: "feilschen", label: "Feilschen", attributes: ["intu", "erf"]};
  const learned = GT.actorHasProfession(actor, "feilschen");
  return {
    formula: GT.professionFormula(actor, node),
    label: "Feilschen",
    summary: learned ? "Beruf gelernt" : "Feilschen nicht gelernt – SL entscheidet"
  };
};

GT.startHagglingSession = function(options = {}) {
  if (!game.user?.isGM) return ui.notifications.warn("Nur der Spielleiter kann Feilschen vorbereiten.");
  const userId = String(options.userId || "");
  const target = game.users?.get?.(userId);
  if (!target?.active) return ui.notifications.warn("Der gewählte Spieler ist nicht aktiv.");
  const basePrice = Math.max(1, Number(options.basePrice || 1));
  const maxFailures = Math.max(1, Number(options.maxFailures || 3));
  const minTenths = Math.max(1, Math.min(10, Number(options.minTenths || 5)));
  const payload = {
    type: "hagglingStart",
    userId,
    session: {
      id: foundry?.utils?.randomID?.() || String(Date.now()),
      gmId: game.user.id,
      merchant: String(options.merchant || "Händler"),
      basePrice,
      difficulty: GT.hagglingDifficulty(basePrice),
      maxFailures,
      minTenths,
      note: String(options.note || "")
    }
  };
  game.socket?.emit?.("system.gothic-tales", payload);
  GT.handleSocketMessage(payload);
  ui.notifications.info(`Feilschen an ${target.name} gesendet.`);
};

class GothicTalesHagglingGMDialog extends GothicTalesApplicationV2 {
  constructor(options = {}) {
    super(options);
    this.settings = {
      merchant: String(options.merchant || "Händler"),
      basePrice: Number(options.basePrice || 100),
      maxFailures: Number(options.maxFailures || 3),
      minTenths: Number(options.minTenths || 5),
      userId: String(options.userId || ""),
      note: String(options.note || "")
    };
  }
  static DEFAULT_OPTIONS = {
    id: "gothic-tales-haggling-gm",
    classes: ["gothic-tales", "gt-app", "gt-v2-window", "gt-dialog-window", "gt-haggling-gm-window"],
    window: {title: "Feilschen vorbereiten", resizable: true},
    position: {width: 660, height: "auto"}
  };
  static PARTS = {body: {template: "systems/gothic-tales/templates/dialog-haggling-gm.hbs"}};
  getData() {
    return {
      ...this.settings,
      difficulty: GT.hagglingDifficulty(this.settings.basePrice),
      users: GT.lockpickingOnlineUsers(this.settings.userId)
    };
  }
  readForm(root) {
    return {
      merchant: String(root.querySelector(".gt-haggling-merchant")?.value || "Händler"),
      basePrice: Math.max(1, Number(root.querySelector(".gt-haggling-price")?.value || 1)),
      maxFailures: Math.max(1, Number(root.querySelector(".gt-haggling-max-fails")?.value || 3)),
      minTenths: Math.max(1, Math.min(10, Number(root.querySelector(".gt-haggling-min-tenths")?.value || 5))),
      userId: String(root.querySelector(".gt-haggling-user")?.value || ""),
      note: String(root.querySelector(".gt-haggling-note")?.value || "")
    };
  }
  activateListeners(html) {
    super.activateListeners(html);
    const root = GT.htmlRoot(html);
    const syncDifficulty = () => {
      this.settings = this.readForm(root);
      const badge = root.querySelector(".gt-haggling-difficulty");
      if (badge) badge.textContent = String(GT.hagglingDifficulty(this.settings.basePrice));
    };
    root.querySelector(".gt-haggling-price")?.addEventListener("input", syncDifficulty);
    root.addEventListener("submit", ev => {
      ev.preventDefault();
      this.settings = this.readForm(root);
      GT.startHagglingSession(this.settings);
      this.close();
    });
    root.querySelector(".gt-dialog-cancel")?.addEventListener("click", ev => { ev.preventDefault(); this.close(); });
  }
}

class GothicTalesHagglingPlayerDialog extends GothicTalesApplicationV2 {
  constructor(actor, session = {}, options = {}) {
    super(options);
    this.actor = actor;
    this.session = session;
    this.priceTenths = 10;
    this.failures = 0;
    this.ended = false;
    this.lastArgument = "";
  }
  static DEFAULT_OPTIONS = {
    id: "gothic-tales-haggling-player",
    classes: ["gothic-tales", "gt-app", "gt-v2-window", "gt-dialog-window", "gt-haggling-player-window"],
    window: {title: "Feilschen", resizable: true},
    position: {width: 660, height: "auto"}
  };
  static PARTS = {body: {template: "systems/gothic-tales/templates/dialog-haggling-player.hbs"}};
  getData() {
    const basePrice = Number(this.session.basePrice || 0);
    const minTenths = Number(this.session.minTenths || 5);
    const currentPrice = GT.hagglingCurrentPrice(basePrice, this.priceTenths);
    const nextTenths = Math.max(minTenths, this.priceTenths - 1);
    return {
      actor: this.actor,
      merchant: this.session.merchant || "Händler",
      basePrice,
      difficulty: Number(this.session.difficulty || GT.hagglingDifficulty(basePrice)),
      maxFailures: Number(this.session.maxFailures || 3),
      minTenths,
      priceTenths: this.priceTenths,
      currentPrice,
      nextPrice: GT.hagglingCurrentPrice(basePrice, nextTenths),
      failures: this.failures,
      ended: this.ended,
      note: this.session.note || "",
      canImprove: this.priceTenths > minTenths,
      learned: GT.actorHasProfession(this.actor, "feilschen"),
      lastArgument: this.lastArgument,
      advantageLevels: [
        {value: 1, label: "klein"},
        {value: 2, label: "mittel"},
        {value: 3, label: "groß"}
      ]
    };
  }
  async postResult({success, total, critical, argument, advantageText}) {
    const basePrice = Number(this.session.basePrice || 0);
    const beforeTenths = this.priceTenths;
    let resultText = "";
    let icon = "fa-comments-dollar";

    if (success) {
      if (this.priceTenths > Number(this.session.minTenths || 5)) this.priceTenths -= 1;
      const before = GT.hagglingCurrentPrice(basePrice, beforeTenths);
      const after = GT.hagglingCurrentPrice(basePrice, this.priceTenths);
      resultText = this.priceTenths < beforeTenths
        ? `Erfolg! Der Preis sinkt von ${before} auf ${after} Erz.`
        : `Erfolg! Der Mindestpreis von ${after} Erz ist bereits erreicht.`;
      icon = "fa-handshake";
    } else {
      this.failures += 1;
      resultText = `Fehlschlag. Der Händler bleibt hart. Fehlschläge: ${this.failures}/${Number(this.session.maxFailures || 3)}.`;
      icon = "fa-face-angry";
      if (this.failures >= Number(this.session.maxFailures || 3)) {
        this.ended = true;
        this.priceTenths = 10;
        resultText = `Der Händler ist verärgert. Das Feilschen endet und der Normalpreis von ${GT.hagglingCurrentPrice(basePrice, 10)} Erz gilt wieder.`;
      }
    }

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({actor: this.actor}),
      content: `<div class="gothic-tales chat-card gt-haggling-result">
        <h2><i class="fas ${icon}"></i> Feilschen</h2>
        <p><strong>${GT.escape(this.actor.name)}</strong> feilscht mit <strong>${GT.escape(this.session.merchant || "Händler")}</strong>.</p>
        <p><em>${GT.escape(argument)}</em></p>
        <p>Wurf: <strong>${Number(total || 0)}</strong> gegen SchwG <strong>${Number(this.session.difficulty || 10)}</strong>${critical ? " · Kritischer Erfolg" : ""}</p>
        <p>${GT.escape(resultText)}</p>
        <p class="gt-chat-note">Modus: ${GT.escape(advantageText || "Normal")}</p>
      </div>`
    });
  }
  activateListeners(html) {
    super.activateListeners(html);
    const root = GT.htmlRoot(html);
    root.querySelector(".gt-haggling-roll")?.addEventListener("click", async ev => {
      ev.preventDefault();
      if (this.ended) return ui.notifications.warn("Diese Verhandlung ist bereits beendet.");
      const argument = String(root.querySelector(".gt-haggling-argument")?.value || "").trim();
      if (!argument) return ui.notifications.warn("Jeder Feilschen-Wurf braucht ein Argument.");
      this.lastArgument = argument;
      const mode = String(root.querySelector(".gt-haggling-advantage-mode")?.value || "none");
      const level = Number(root.querySelector(".gt-haggling-advantage-level")?.value || 1);
      const advantageText = GT.hagglingAdvantageLabel(mode, level);
      const opts = GT.hagglingFormulaOptions(this.actor);
      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({actor: this.actor}),
        content: `<div class="gothic-tales chat-card gt-haggling-argument"><h3><i class="fas fa-comment-dots"></i> Feilschen-Argument</h3><p><strong>${GT.escape(this.actor.name)}:</strong> ${GT.escape(argument)}</p><p>${GT.escape(advantageText)}</p></div>`
      });
      await GT.chatRoll({
        formula: opts.formula,
        label: "Feilschen",
        actor: this.actor,
        flavor: `Feilschen gegen SchwG ${Number(this.session.difficulty || 10)} · ${opts.summary}`,
        advantageMode: mode,
        advantageLevel: level,
        onRoll: async message => {
          const total = Number(message?.getFlag?.("gothic-tales", "rollTotal") ?? 0);
          const critical = !!message?.getFlag?.("gothic-tales", "rollCritical");
          await this.postResult({success: total >= Number(this.session.difficulty || 10), total, critical, argument, advantageText});
          this.render(false);
        }
      });
    });
    root.querySelector(".gt-haggling-end")?.addEventListener("click", async ev => {
      ev.preventDefault();
      this.ended = true;
      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({actor: this.actor}),
        content: `<div class="gothic-tales chat-card gt-haggling-result"><h2><i class="fas fa-coins"></i> Feilschen beendet</h2><p>${GT.escape(this.actor.name)} beendet die Verhandlung.</p><p>Endpreis: <strong>${GT.hagglingCurrentPrice(Number(this.session.basePrice || 0), this.priceTenths)} Erz</strong>.</p></div>`
      });
      this.close();
    });
    root.querySelector(".gt-dialog-cancel")?.addEventListener("click", ev => { ev.preventDefault(); this.close(); });
  }
};

GT.HERBALISM_HERBS = [
  {id: "heilkraeuter", label: "Heilkräuter", difficulty: 10, use: "Heiltränke", value: "Menge", quantityFromRoll: true},
  {id: "manakraeuter", label: "Manakräuter", difficulty: 10, use: "Manatränke", value: "Menge", quantityFromRoll: true},
  {id: "snapperkraut", label: "Snapperkraut", difficulty: 15, use: "Geschwindigkeit", value: 30},
  {id: "blitzblatt", label: "Blitzblatt", difficulty: 20, use: "Initiative+", value: 40},
  {id: "herrscherkraut", label: "Herrscherkraut", difficulty: 20, use: "TP+", value: 40},
  {id: "flammenbeere", label: "Flammenbeere", difficulty: 20, use: "Mana+", value: 40},
  {id: "drachenwurzel", label: "Drachenwurzel", difficulty: 25, use: "St+", value: 50},
  {id: "goblinbeere", label: "Goblinbeere", difficulty: 25, use: "Ge+", value: 50},
  {id: "harnischkraut", label: "Harnischkraut", difficulty: 25, use: "Ausd+", value: 50},
  {id: "koenigsdistel", label: "Königsdistel", difficulty: 25, use: "Konz+", value: 50},
  {id: "blutschilf", label: "Blutschilf", difficulty: 25, use: "Intu+", value: 50},
  {id: "sonnenmoos", label: "Sonnenmoos", difficulty: 25, use: "Erf+", value: 50}
];

GT.HERBALISM_CROWN_HERB = {id: "kronstoeckel", label: "Kronstöckel", difficulty: 0, use: "Permanente Tränke", value: 120};

GT.herbalismRankInfo = function(actor) {
  const entry = GT.actorBestProfessionEntry(actor, "kraeuterkunde");
  if (!entry) return {learned: false, rank: -1, label: "nicht gelernt", maxSearches: 0, node: {attributes: ["intu", "konz"], label: "Kräuterkunde"}};
  const rank = Math.max(0, Math.min(3, Number(entry.node.rank || 0)));
  const labels = ["Grundrang", "geübt", "gelehrt", "gemeistert"];
  const maxByRank = [2, 3, 4, 5];
  return {learned: true, rank, label: labels[rank] || "Grundrang", maxSearches: maxByRank[rank] || 2, node: entry.node};
};

GT.herbalismState = function(actor) {
  const state = actor?.system?.professions?.uses?.kraeuterkunde ?? {};
  return {
    successes: Math.max(0, Number(state.successes || 0)),
    nextAllowed: Math.max(0, Number(state.nextAllowed || 0))
  };
};

GT.herbalismCooldownText = function(nextAllowed) {
  const remaining = Number(nextAllowed || 0) - Date.now();
  if (remaining <= 0) return "bereit";
  const minutes = Math.ceil(remaining / 60000);
  return `${minutes} Min.`;
};

GT.updateHerbalismState = async function(actor, patch = {}) {
  const state = {...GT.herbalismState(actor), ...patch};
  await actor.update({"system.professions.uses.kraeuterkunde": state});
  return state;
};

GT.resetHerbalismState = async function(actor, {timer = true, successes = true} = {}) {
  const state = GT.herbalismState(actor);
  if (timer) state.nextAllowed = 0;
  if (successes) state.successes = 0;
  await actor.update({"system.professions.uses.kraeuterkunde": state});
  return state;
};

GT.herbalismHerbById = function(id) {
  return GT.HERBALISM_HERBS.find(h => h.id === id) || GT.HERBALISM_HERBS[0];
};

GT.addHerbToActor = async function(actor, herb, quantity = 1) {
  if (!GT.setting("autoInventory")) {
    ui.notifications?.info?.(`Automatische Inventar-Erstellung ist deaktiviert: ${herb?.label || "Kraut"} wurde nicht angelegt.`);
    return null;
  }
  const qty = Math.max(1, Number(quantity || 1));
  const existing = Array.from(actor?.items ?? []).find(i => i.name === herb.label && i.type === "consumable");
  if (existing) {
    await existing.update({"system.quantity": Number(existing.system?.quantity || 0) + qty});
    return existing;
  }
  const value = herb.quantityFromRoll ? String(qty) : String(herb.value ?? "");
  const [item] = await actor.createEmbeddedDocuments("Item", [{
    name: herb.label,
    type: "consumable",
    img: GT.itemImage?.("consumable", herb.label) || "systems/gothic-tales/assets/icons/verbrauchbar.svg",
    system: {
      quantity: qty,
      value,
      category: "Kräuter",
      description: `<p><strong>${GT.escape(herb.label)}</strong></p><p>Nutzung: ${GT.escape(herb.use || "")}. Handelswert: ${GT.escape(value)}.</p>`,
      properties: "Kraut"
    }
  }]);
  return item;
};

GT.startHerbalismSession = function(options = {}) {
  if (!game.user?.isGM) return ui.notifications.warn("Nur der Spielleiter kann Kräuterkunde vorbereiten.");
  const userId = String(options.userId || "");
  const target = game.users?.get?.(userId);
  if (!target?.active) return ui.notifications.warn("Der gewählte Spieler ist nicht aktiv.");
  const payload = {
    type: "herbalismStart",
    userId,
    session: {
      id: foundry?.utils?.randomID?.() || String(Date.now()),
      gmId: game.user.id,
      outdoors: !!options.outdoors,
      note: String(options.note || "")
    }
  };
  game.socket?.emit?.("system.gothic-tales", payload);
  GT.handleSocketMessage(payload);
  ui.notifications.info(`Kräuterkunde an ${target.name} gesendet.`);
};

GT.resetHerbalismForUser = function(userId) {
  if (!game.user?.isGM) return ui.notifications.warn("Nur der Spielleiter kann Kräuterkunde zurücksetzen.");
  const target = game.users?.get?.(String(userId || ""));
  if (!target?.active) return ui.notifications.warn("Der gewählte Spieler ist nicht aktiv.");
  const payload = {type: "herbalismReset", userId: target.id};
  game.socket?.emit?.("system.gothic-tales", payload);
  GT.handleSocketMessage(payload);
};

class GothicTalesHerbalismGMDialog extends GothicTalesApplicationV2 {
  constructor(options = {}) {
    super(options);
    this.settings = {
      userId: String(options.userId || ""),
      outdoors: options.outdoors !== false,
      note: String(options.note || "")
    };
  }
  static DEFAULT_OPTIONS = {
    id: "gothic-tales-herbalism-gm",
    classes: ["gothic-tales", "gt-app", "gt-v2-window", "gt-dialog-window", "gt-herbalism-gm-window"],
    window: {title: "Kräuterkunde vorbereiten", resizable: true},
    position: {width: 660, height: "auto"}
  };
  static PARTS = {body: {template: "systems/gothic-tales/templates/dialog-herbalism-gm.hbs"}};
  getData() {
    return {...this.settings, users: GT.lockpickingOnlineUsers(this.settings.userId)};
  }
  readForm(root) {
    return {
      userId: String(root.querySelector(".gt-herbalism-user")?.value || ""),
      outdoors: !!root.querySelector(".gt-herbalism-outdoors")?.checked,
      note: String(root.querySelector(".gt-herbalism-note")?.value || "")
    };
  }
  activateListeners(html) {
    super.activateListeners(html);
    const root = GT.htmlRoot(html);
    root.addEventListener("submit", ev => {
      ev.preventDefault();
      this.settings = this.readForm(root);
      GT.startHerbalismSession(this.settings);
      this.close();
    });
    root.querySelector(".gt-herbalism-reset")?.addEventListener("click", ev => {
      ev.preventDefault();
      this.settings = this.readForm(root);
      GT.resetHerbalismForUser(this.settings.userId);
    });
    root.querySelector(".gt-dialog-cancel")?.addEventListener("click", ev => { ev.preventDefault(); this.close(); });
  }
}

class GothicTalesHerbalismPlayerDialog extends GothicTalesApplicationV2 {
  constructor(actor, session = {}, options = {}) {
    super(options);
    this.actor = actor;
    this.session = session;
    this.selectedHerb = session.herbId || "heilkraeuter";
  }
  static DEFAULT_OPTIONS = {
    id: "gothic-tales-herbalism-player",
    classes: ["gothic-tales", "gt-app", "gt-v2-window", "gt-dialog-window", "gt-herbalism-player-window"],
    window: {title: "Kräuterkunde", resizable: true},
    position: {width: 700, height: "auto"}
  };
  static PARTS = {body: {template: "systems/gothic-tales/templates/dialog-herbalism-player.hbs", scrollable: [".gt-herbalism-player"]}};
  getData() {
    const rank = GT.herbalismRankInfo(this.actor);
    const state = GT.herbalismState(this.actor);
    const herb = GT.herbalismHerbById(this.selectedHerb);
    const now = Date.now();
    const blockedReasons = [];
    if (!rank.learned) blockedReasons.push("Kräuterkunde nicht gelernt");
    if (!this.session.outdoors) blockedReasons.push("Ort ist nicht als freie Natur markiert");
    if (state.successes >= rank.maxSearches && rank.learned) blockedReasons.push("Suchen pro Sitzung aufgebraucht");
    if (state.nextAllowed > now) blockedReasons.push(`Timer aktiv: ${GT.herbalismCooldownText(state.nextAllowed)}`);
    return {
      actor: this.actor,
      herbs: GT.HERBALISM_HERBS.map(h => ({...h, selected: h.id === herb.id, valueText: h.value})),
      selectedHerb: herb,
      rank,
      state,
      successes: state.successes,
      maxSearches: rank.maxSearches,
      remaining: Math.max(0, rank.maxSearches - state.successes),
      cooldownText: GT.herbalismCooldownText(state.nextAllowed),
      outdoors: !!this.session.outdoors,
      note: this.session.note || "",
      blocked: blockedReasons.length > 0,
      blockedReason: blockedReasons.join("; "),
      isGM: !!game.user?.isGM
    };
  }
  async applyResult({herb, total, critical, success}) {
    const rank = GT.herbalismRankInfo(this.actor);
    const state = GT.herbalismState(this.actor);
    const nextAllowed = Date.now() + GT.herbalismCooldownMs();
    let foundText = "";
    const created = [];

    if (success) {
      const quantity = herb.quantityFromRoll ? Math.max(1, Number(total || 1)) : 1;
      await GT.addHerbToActor(this.actor, herb, quantity);
      created.push(`${quantity}× ${herb.label}`);
      const newSuccesses = Math.min(rank.maxSearches, state.successes + 1);
      await GT.updateHerbalismState(this.actor, {successes: newSuccesses, nextAllowed});
      foundText = herb.quantityFromRoll
        ? `Erfolg! Gefunden: ${quantity}× ${herb.label}.`
        : `Erfolg! Gefunden: ${herb.label}.`;

      if (critical) {
        await GT.addHerbToActor(this.actor, GT.HERBALISM_CROWN_HERB, 1);
        created.push("1× Kronstöckel");
        foundText += " Kritischer Erfolg: Zusätzlich wurde ein Kronstöckel gefunden.";
      }
    } else {
      await GT.updateHerbalismState(this.actor, {nextAllowed});
      foundText = "Fehlschlag. Es wurden keine brauchbaren Kräuter gefunden. Der erfolgreiche Suchzähler wird nicht verbraucht.";
    }

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({actor: this.actor}),
      content: `<div class="gothic-tales chat-card gt-herbalism-result">
        <h2><i class="fas fa-seedling"></i> Kräuterkunde</h2>
        <p><strong>${GT.escape(this.actor.name)}</strong> sucht nach <strong>${GT.escape(herb.label)}</strong>.</p>
        <p>Wurf: <strong>${Number(total || 0)}</strong> gegen SchwG <strong>${Number(herb.difficulty || 0)}</strong>${critical ? " · Kritischer Erfolg" : ""}</p>
        <p>${GT.escape(foundText)}</p>
        ${created.length ? `<p>Inventar: <strong>${GT.escape(created.join(", "))}</strong></p>` : ""}
        <p class="gt-chat-note">Nächste Suche in ${GT.setting("herbalismCooldownMinutes")} Minuten. Unterstützung ist nicht möglich.</p>
      </div>`
    });
  }
  activateListeners(html) {
    super.activateListeners(html);
    const root = GT.htmlRoot(html);
    root.querySelector(".gt-herbalism-herb")?.addEventListener("change", ev => {
      this.selectedHerb = ev.currentTarget.value || "heilkraeuter";
      this.render(false);
    });
    root.querySelector(".gt-herbalism-search")?.addEventListener("click", async ev => {
      ev.preventDefault();
      const data = this.getData();
      if (data.blocked) return ui.notifications.warn(data.blockedReason);
      const herb = GT.herbalismHerbById(root.querySelector(".gt-herbalism-herb")?.value || this.selectedHerb);
      const opts = GT.herbalismRankInfo(this.actor);
      await GT.chatRoll({
        formula: GT.professionFormula(this.actor, opts.node || {attributes: ["intu", "konz"]}),
        label: "Kräuterkunde",
        actor: this.actor,
        flavor: `Kräutersuche nach ${herb.label} gegen SchwG ${herb.difficulty}`,
        onRoll: async message => {
          const total = Number(message?.getFlag?.("gothic-tales", "rollTotal") ?? 0);
          const critical = !!message?.getFlag?.("gothic-tales", "rollCritical");
          await this.applyResult({herb, total, critical, success: total >= Number(herb.difficulty || 0)});
          this.render(false);
        }
      });
    });
    root.querySelector(".gt-herbalism-reset-timer")?.addEventListener("click", async ev => {
      ev.preventDefault();
      await GT.resetHerbalismState(this.actor, {timer: true, successes: false});
      this.render(false);
    });
    root.querySelector(".gt-herbalism-reset-session")?.addEventListener("click", async ev => {
      ev.preventDefault();
      await GT.resetHerbalismState(this.actor, {timer: true, successes: true});
      this.render(false);
    });
    root.querySelector(".gt-dialog-cancel")?.addEventListener("click", ev => { ev.preventDefault(); this.close(); });
  }
}

class GothicTalesLockpickingGMDialog extends GothicTalesApplicationV2 {
  constructor(options = {}) {
    super(options);
    this.settings = {
      difficulty: Number(options.difficulty || 15),
      hideCount: !!options.hideCount,
      switches: Array.isArray(options.switches) && options.switches.length ? options.switches : ["left", "right", "left"],
      userId: String(options.userId || "")
    };
  }
  static DEFAULT_OPTIONS = {
    id: "gothic-tales-lockpicking-gm",
    classes: ["gothic-tales", "gt-app", "gt-v2-window", "gt-dialog-window", "gt-lockpicking-gm-window"],
    window: {title: "Schlösserknacken vorbereiten", resizable: true},
    position: {width: 720, height: "auto"}
  };
  static PARTS = {body: {template: "systems/gothic-tales/templates/dialog-lockpicking-gm.hbs", scrollable: [".gt-lockpicking-gm"]}};
  getData() {
    const count = Math.max(1, Number(this.settings.count || this.settings.switches?.length || 3));
    const rows = Array.from({length: count}, (_, index) => {
      const value = String(this.settings.switches?.[index] || "left") === "right" ? "right" : "left";
      return {index, number: index + 1, isLeft: value === "left", isRight: value === "right"};
    });
    return {difficulty: this.settings.difficulty, count, hideCount: this.settings.hideCount, users: GT.lockpickingOnlineUsers(this.settings.userId), switchRows: rows};
  }
  readForm(root) {
    const count = Math.max(1, Number(root.querySelector(".gt-lock-count")?.value || 1));
    const switches = [];
    for (let i = 0; i < count; i++) {
      const value = root.querySelector(`.gt-lock-switch-row select[data-index="${i}"]`)?.value || this.settings.switches?.[i] || "left";
      switches.push(value === "right" ? "right" : "left");
    }
    return {
      difficulty: Number(root.querySelector(".gt-lock-difficulty")?.value || 10),
      hideCount: !!root.querySelector(".gt-lock-hide")?.checked,
      userId: String(root.querySelector(".gt-lock-user")?.value || ""),
      count,
      switches
    };
  }
  activateListeners(html) {
    super.activateListeners(html);
    const root = GT.htmlRoot(html);
    root.querySelector(".gt-lock-count")?.addEventListener("change", ev => {
      ev.preventDefault();
      this.settings = this.readForm(root);
      this.render(false);
    });
    root.addEventListener("submit", ev => {
      ev.preventDefault();
      this.settings = this.readForm(root);
      GT.startLockpickingSession(this.settings);
      this.close();
    });
    root.querySelector(".gt-dialog-cancel")?.addEventListener("click", ev => { ev.preventDefault(); this.close(); });
    root.querySelector(".gt-lock-copy-macro")?.addEventListener("click", async ev => {
      ev.preventDefault();
      this.settings = this.readForm(root);
      const macro = GT.professionMacroText(this.settings);
      try {
        await navigator.clipboard?.writeText(macro);
        ui.notifications.info("Schlösserknacken-Makro in die Zwischenablage kopiert.");
      } catch (err) {
        console.log(macro);
        ui.notifications.warn("Zwischenablage nicht verfügbar. Makro wurde in die Konsole geschrieben.");
      }
    });
  }
}

class GothicTalesLockpickingPlayerDialog extends GothicTalesApplicationV2 {
  constructor(actor, session = {}, options = {}) {
    super(options);
    this.actor = actor;
    this.session = session;
    this.progress = 0;
    this.failed = false;
  }
  static DEFAULT_OPTIONS = {
    id: "gothic-tales-lockpicking-player",
    classes: ["gothic-tales", "gt-app", "gt-v2-window", "gt-dialog-window", "gt-lockpicking-player-window"],
    window: {title: "Schloss knacken", resizable: false},
    position: {width: 560, height: "auto"}
  };
  static PARTS = {body: {template: "systems/gothic-tales/templates/dialog-lockpicking-player.hbs"}};
  getData() {
    const count = Number(this.session?.switches?.length || 0);
    return {
      actor: this.actor,
      difficulty: Number(this.session?.difficulty || 10),
      hideCount: !!this.session?.hideCount,
      count,
      failed: this.failed,
      progressDots: Array.from({length: count}, (_, i) => ({done: i < this.progress}))
    };
  }
  async wrongChoice() {
    this.failed = true;
    this.progress = 0;
    this.render(false);
    ui.notifications.warn("Fehlgeschlagen! Prüfe, ob der Dietrich hält.");
    const opts = GT.lockpickingFormulaOptions(this.actor);
    await GT.chatRoll({
      formula: opts.formula,
      label: opts.label,
      actor: this.actor,
      flavor: `Schlösserknacken gegen SchwG ${Number(this.session.difficulty || 10)}`,
      advantageMode: opts.advantageMode || "none",
      advantageLevel: opts.advantageLevel || 1,
      rollSummary: opts.summary || "",
      onRoll: async message => {
        const total = Number(message?.getFlag?.("gothic-tales", "rollTotal") ?? 0);
        if (total >= Number(this.session.difficulty || 10)) {
          this.failed = false;
          this.progress = 0;
          ui.notifications.info("Der Dietrich hält. Beginne von vorn.");
          await ChatMessage.create({speaker: ChatMessage.getSpeaker({actor: this.actor}), content: `<div class="gothic-tales chat-card"><h3>Dietrich hält</h3><p>${GT.escape(this.actor.name)} darf beim Schloss von vorne beginnen.</p></div>`});
          this.render(false);
          return;
        }
        const useNew = await GT.confirm({title: "Dietrich zerbrochen", content: "<p>Der Wurf ist misslungen. Neuen Dietrich verwenden?</p>", yesLabel: "Ja", noLabel: "Nein"});
        if (!useNew) return this.close();
        const consumed = await GT.consumeLockpick(this.actor);
        if (!consumed) return this.close();
        this.failed = false;
        this.progress = 0;
        this.render(false);
      }
    });
  }
  async success() {
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({actor: this.actor}),
      content: `<div class="gothic-tales chat-card gt-lockpicking-success"><h2><i class="fas fa-key"></i> Schloss geknackt!</h2><p>${GT.escape(this.actor.name)} hat die Schalterfolge richtig gelöst.</p></div>`
    });
    ui.notifications.info("Schloss geknackt!");
    return this.close();
  }
  activateListeners(html) {
    super.activateListeners(html);
    const root = GT.htmlRoot(html);
    root.querySelectorAll(".gt-lock-choice").forEach(button => button.addEventListener("click", async ev => {
      ev.preventDefault();
      const direction = ev.currentTarget.dataset.direction;
      const expected = this.session?.switches?.[this.progress];
      if (direction !== expected) return this.wrongChoice();
      this.failed = false;
      this.progress += 1;
      if (this.progress >= (this.session?.switches?.length || 0)) return this.success();
      this.render(false);
    }));
    root.querySelector(".gt-lock-abandon")?.addEventListener("click", ev => { ev.preventDefault(); this.close(); });
  }
}

class GothicTalesMagicCircleTree extends GothicTalesApplicationV2 {
  constructor(actor, options = {}) { super(options); this.actor = actor; this.activeTree = "magie"; }
  static DEFAULT_OPTIONS = {
    id: "gothic-tales-magic-circle-tree",
    classes: ["gothic-tales", "gt-app", "gt-v2-window", "gt-talent-tree-window", "gt-magic-tree-window"],
    window: {title: "Gothic Tales Magiekreise", resizable: true},
    position: {width: 1040, height: 780}
  };
  static PARTS = {body: {template: "systems/gothic-tales/templates/talent-tree.hbs", scrollable: [".gt-talent-app"]}};
  async getData() {
    const data = await GT.getMagicCircleScaffold();
    const learnedRoot = this.actor.system?.magicCircles?.learned ?? {};
    const lp = Number(this.actor.system?.lp?.value ?? 0);
    const isCharacter = this.actor.type === "character";
    const trees = data.trees.map(tree => {
      const learned = learnedRoot[tree.id] ?? {};
      const nodes = tree.nodes.map(n => {
        const reqsMet = (n.requires ?? []).every(r => learned[r]);
        const attrCheck = GT.actorMeetsTalentAttributeRequirements(this.actor, n);
        const attrText = GT.talentAttributeRequirementText(n, this.actor);
        const cost = isCharacter ? Number(n.lpCost || 0) : 0;
        const enoughLp = !isCharacter || lp >= cost;
        const available = !!learned[n.id] || (reqsMet && attrCheck.met && enoughLp);
        const displayCost = isCharacter ? (Number(n.lpCost || 0) ? `${n.lpCost} LP` : "frei") : "NSC/Monster";
        const diceText = GT.magicCircleDiceConfig(n).map(d => d.toUpperCase()).join(" · ");
        const missingReason = [];
        if (!reqsMet) missingReason.push("Magiekreis fehlt");
        if (!attrCheck.met) missingReason.push(`Attribute fehlen: ${attrCheck.missing.map(m => `${m.label} ${m.current}/${m.min}`).join(", ")}`);
        if (!enoughLp) missingReason.push("nicht genug LP");
        const tooltip = GT.talentDetailsHtml({descriptionHtml: n.descriptionHtml || GT.talentDescriptionHtml(n.description || ""), usageText: diceText ? `Würfel: ${diceText}` : "", attributeText: attrText});
        const lockedInfo = missingReason.length ? `Gesperrt: ${missingReason.join("; ")}` : "";
        const tooltipHtml = `${tooltip}${lockedInfo ? `<p class="gt-tooltip-meta"><strong>Gesperrt:</strong> ${GT.escape(missingReason.join("; "))}</p>` : ""}`;
        return {...n, displayLabel: GT.talentDisplayLabel(n), learned: !!learned[n.id], available, displayCost, attrRequirementText: attrText, usesText: diceText ? `Würfel: ${diceText}` : "", consumeText: "", tooltip: tooltipHtml, missingReason: missingReason.join("; ")};
      });
      return {...tree, active: tree.id === this.activeTree, nodes};
    });
    return {actor: this.actor, system: this.actor.system, trees, isCharacter};
  }
  activateListeners(html) {
    super.activateListeners(html);
    html.find(".gt-tree-select").on("click", ev => { this.activeTree = ev.currentTarget.dataset.tree; GT.hideFloatingTooltip(); this.render(false); });
    html.find(".gt-talent-node")
      .on("mouseenter focus", ev => GT.showFloatingTooltip(ev.currentTarget, ev.currentTarget.dataset.gtTooltip))
      .on("mouseleave blur", () => GT.hideFloatingTooltip());
    html.find(".gt-talent-node").on("click", async ev => {
      ev.preventDefault();
      if (this.actor.system?.sheetLocked) return ui.notifications.warn("Der Charakterbogen ist gesperrt.");
      const button = ev.currentTarget;
      const tree = button.dataset.tree;
      const node = button.dataset.node;
      const data = await GT.getMagicCircleScaffold();
      const treeData = data.trees.find(t => t.id === tree);
      const nodeData = treeData?.nodes.find(n => n.id === node);
      if (!nodeData) return;
      const path = `magicCircles.learned.${tree}.${node}`;
      const isLearned = !!getProperty(this.actor.system, path);
      const update = {};
      if (isLearned) {
        const isCharacter = this.actor.type === "character";
        update[`system.${path}`] = false;
        if (isCharacter) update["system.lp.value"] = Number(this.actor.system?.lp?.value ?? 0) + Number(nodeData.lpCost || 0);
        await this.actor.update(update); return this.render(false);
      }
      const learnedTree = getProperty(this.actor.system, `magicCircles.learned.${tree}`) ?? {};
      const reqsMet = (nodeData.requires ?? []).every(r => learnedTree[r]);
      if (!reqsMet) return ui.notifications.warn("Voraussetzungen sind noch nicht erfüllt.");
      const isCharacter = this.actor.type === "character";
      const attrCheck = GT.actorMeetsTalentAttributeRequirements(this.actor, nodeData);
      if (isCharacter && !attrCheck.met) return ui.notifications.warn(`Mindestattribute nicht erfüllt: ${attrCheck.missing.map(m => `${m.label} ${m.current}/${m.min}`).join(", ")}.`);
      const cost = isCharacter ? Number(nodeData.lpCost || 0) : 0;
      const lp = Number(this.actor.system?.lp?.value ?? 0);
      if (isCharacter && lp < cost) return ui.notifications.warn("Nicht genug Lernpunkte.");
      update[`system.${path}`] = true;
      if (isCharacter) update["system.lp.value"] = lp - cost;
      await this.actor.update(update);
      this.render(false);
    });
  }
}


Hooks.on("renderSidebar", () => setTimeout(() => GT.injectProfessionToolsButton(), 50));
Hooks.on("renderSidebarTab", () => setTimeout(() => GT.injectProfessionToolsButton(), 50));
Hooks.once("ready", () => GT.startProfessionToolsButtonObserver());

Hooks.once("init", async function() {
  GT.registerSystemSettings();
  Handlebars.registerHelper("eq", (a, b) => a === b);
  Handlebars.registerHelper("not", a => !a);
  Handlebars.registerHelper("or", (...args) => args.slice(0, -1).some(Boolean));
  Handlebars.registerHelper("inc", value => Number(value || 0) + 1);
  Handlebars.registerHelper("lookupType", (obj, key) => obj?.[key] ?? key);
  CONFIG.GT = GT.CONFIG;
  CONFIG.Actor.documentClass = GT.DataModels.Documents.Actor;
  if (CONFIG.Combatant && BaseCombatantDocument) CONFIG.Combatant.documentClass = GothicTalesCombatant;
  CONFIG.Item.documentClass = GT.DataModels.Documents.Item;
  CONFIG.Actor.dataModels = GT.DataModels.Actor;
  CONFIG.Item.dataModels = GT.DataModels.Item;
  CONFIG.Actor.trackableAttributes = {
    character: {bar: ["hp", "mana", "lp"], value: ["stufe", "movement.value", "initiative.value"]},
    npc: {bar: ["hp", "mana"], value: ["stufe", "movement.value", "initiative.value", "actions"]},
    monster: {bar: ["hp", "mana"], value: ["monsterstufe", "movement.value", "initiative.value"]}
  };
  game.gothicTales = GT;
  game.gothicTales.creator = {open: actor => new GothicTalesCharacterCreator({targetActor: actor}).render(true)};
  game.gothicTales.npcGenerator = {open: actor => new GothicTalesNPCGenerator({targetActor: actor}).render(true)};
  game.gothicTales.talentTree = {open: actor => new GothicTalesTalentTree(actor ?? canvas.tokens?.controlled?.[0]?.actor ?? game.user.character).render(true)};
  game.gothicTales.magicCircles = {open: actor => new GothicTalesMagicCircleTree(actor ?? canvas.tokens?.controlled?.[0]?.actor ?? game.user.character).render(true)};
  game.gothicTales.professions = {
    open: actor => new GothicTalesProfessionTree(actor ?? canvas.tokens?.controlled?.[0]?.actor ?? game.user.character).render(true),
    detail: (actor, treeId, nodeId) => GT.openProfessionDetail(actor ?? canvas.tokens?.controlled?.[0]?.actor ?? game.user.character, treeId || "berufe", nodeId),
    tools: {open: options => GT.openDMTools(options || {})},
    alchemy: {open: options => new GothicTalesAlchemyGMDialog(options || {}).render(true)},
    mining: {open: options => new GothicTalesMiningGMDialog(options || {}).render(true)},
    smithing: {open: options => new GothicTalesSmithingGMDialog(options || {}).render(true)},
    carving: {open: options => new GothicTalesCarvingGMDialog(options || {}).render(true)},
    haggling: {open: options => new GothicTalesHagglingGMDialog(options || {}).render(true)},
    pickpocketing: {open: options => new GothicTalesPickpocketingGMDialog(options || {}).render(true)},
    herbalism: {open: options => new GothicTalesHerbalismGMDialog(options || {}).render(true)},
    lockpicking: {open: options => new GothicTalesLockpickingGMDialog(options || {}).render(true), macroText: options => GT.professionMacroText(options || {})}
  };
  game.gothicTales.combat = {requestInitiative: combat => GT.requestCombatInitiative(combat), applyEnemyInitiative: (combat, options) => GT.applyEnemyInitiative(combat, options)};
  game.gothicTales.dmTools = {open: options => GT.openDMTools(options || {})};
  game.gothicTales.alchemy = game.gothicTales.professions.alchemy;
  game.gothicTales.mining = game.gothicTales.professions.mining;
  game.gothicTales.smithing = game.gothicTales.professions.smithing;
  game.gothicTales.carving = game.gothicTales.professions.carving;
  game.gothicTales.haggling = game.gothicTales.professions.haggling;
  game.gothicTales.pickpocketing = game.gothicTales.professions.pickpocketing;
  game.gothicTales.herbalism = game.gothicTales.professions.herbalism;
  game.gothicTales.lockpicking = game.gothicTales.professions.lockpicking;
  game.socket?.on?.("system.gothic-tales", payload => GT.handleSocketMessage(payload));
  GT.installGlobalClickHandlers();
  await foundry.applications.handlebars.loadTemplates([
    "systems/gothic-tales/templates/actor/parts/attributes.hbs",
    "systems/gothic-tales/templates/actor/parts/items.hbs",
    "systems/gothic-tales/templates/actor/parts/source.hbs"
  ]);
  const DocumentSheetConfig = foundry?.applications?.apps?.DocumentSheetConfig;
  if (DocumentSheetConfig && BaseActorSheet) {
    try { DocumentSheetConfig.unregisterSheet(Actor, "core", BaseActorSheet); } catch (err) {}
    DocumentSheetConfig.registerSheet(Actor, "gothic-tales", GothicTalesActorSheet, {types: ["character", "npc", "monster"], makeDefault: true, label: "Gothic Tales Bogen"});
  } else if (BaseActorSheet) {
    const ActorSheets = foundry.documents.collections.Actors;
    try { ActorSheets.unregisterSheet("core", BaseActorSheet); } catch (err) {}
    ActorSheets.registerSheet("gothic-tales", GothicTalesActorSheet, {types: ["character", "npc", "monster"], makeDefault: true, label: "Gothic Tales Bogen"});
  }
  if (DocumentSheetConfig && BaseItemSheet) {
    try { DocumentSheetConfig.unregisterSheet(Item, "core", BaseItemSheet); } catch (err) {}
    DocumentSheetConfig.registerSheet(Item, "gothic-tales", GothicTalesItemSheet, {types: Object.keys(GT.CONFIG.itemTypes), makeDefault: true, label: "Gothic Tales Gegenstand"});
  } else if (BaseItemSheet) {
    const ItemSheets = foundry.documents.collections.Items;
    try { ItemSheets.unregisterSheet("core", BaseItemSheet); } catch (err) {}
    ItemSheets.registerSheet("gothic-tales", GothicTalesItemSheet, {types: Object.keys(GT.CONFIG.itemTypes), makeDefault: true, label: "Gothic Tales Gegenstand"});
  }
});

GT.htmlRoot = function(html) {
  return html instanceof HTMLElement ? html : html?.[0] ?? html;
};

GT.activateSheetTabs = function(root, options = {}) {
  if (!root) return;
  const groups = new Set(Array.from(root.querySelectorAll(".tabs[data-group]")).map(nav => nav.dataset.group || "primary"));
  if (!groups.size) groups.add("primary");

  const findFirstTab = (group = "primary") => root.querySelector(`.tabs[data-group="${group}"] [data-tab]`)?.dataset.tab
    || root.querySelector(`.tab[data-group="${group}"]`)?.dataset.tab
    || "main";

  const activate = (group = "primary", tab = "main", {notify = true} = {}) => {
    const target = tab || findFirstTab(group);
    root.querySelectorAll(`.tab[data-group="${group}"]`).forEach(panel => panel.classList.toggle("active", panel.dataset.tab === target));
    root.querySelectorAll(`.tabs[data-group="${group}"] [data-tab]`).forEach(link => {
      const isActive = link.dataset.tab === target;
      link.classList.toggle("active", isActive);
      link.setAttribute("aria-selected", isActive ? "true" : "false");
      if (isActive) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
    if (notify) options.onChange?.(target, group);
  };

  root.querySelectorAll(".tabs [data-tab]").forEach(link => {
    link.addEventListener("click", event => {
      event.preventDefault();
      const group = link.closest(".tabs")?.dataset.group || "primary";
      activate(group, link.dataset.tab || findFirstTab(group));
    });
  });

  for (const group of groups) {
    const requested = typeof options.initial === "object" ? options.initial?.[group] : options.initial;
    const active = requested
      || root.querySelector(`.tabs[data-group="${group}"] [data-tab].active`)?.dataset.tab
      || root.querySelector(`.tab[data-group="${group}"].active`)?.dataset.tab
      || findFirstTab(group);
    activate(group, active, {notify: false});
  }
};

GT.makeToolButton = function(icon, label, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.innerHTML = `<i class="fas ${icon}"></i> ${label}`;
  button.addEventListener("click", onClick);
  return button;
};

/** Fügt Gothic-Tales-Werkzeugbuttons in den Foundry-Einstellungen für SL hinzu. */
Hooks.on("renderSettings", (app, html) => {
  if (!game.user.isGM) return;
  const root = GT.htmlRoot(html);
  const target = root?.querySelector?.("#settings-game, .settings-list");
  if (!target || target.querySelector(".gt-settings-tools")) return;
  const tools = document.createElement("div");
  tools.className = "gt-settings-tools";
  tools.append(
    GT.makeToolButton("fa-book", "GT System-Compendien anzeigen", () => ui.sidebar?.activateTab?.("compendium")),
    GT.makeToolButton("fa-user-plus", "Gothic Tales Charakter-Assistent", () => new GothicTalesCharacterCreator().render(true)),
    GT.makeToolButton("fa-users", "Gothic Tales NSC-Generator", () => new GothicTalesNPCGenerator().render(true))
  );
  target.append(tools);
});

/** Fügt Schnellbuttons zur Actor-Verwaltung hinzu, um SL-Arbeitsabläufe zu beschleunigen. */
Hooks.on("renderActorDirectory", (app, html) => {
  if (!game.user.isGM) return;
  const root = GT.htmlRoot(html);
  const header = root?.querySelector?.(".directory-header");
  if (!header || root.querySelector(".gt-directory-tools")) return;
  const bar = document.createElement("div");
  bar.className = "gt-directory-tools";
  bar.append(
    GT.makeToolButton("fa-user-plus", "Charakter-Editor", () => new GothicTalesCharacterCreator().render(true)),
    GT.makeToolButton("fa-users", "NSC-Generator", () => new GothicTalesNPCGenerator().render(true))
  );
  header.insertAdjacentElement("afterend", bar);
});

Hooks.on("renderChatLog", (app, html) => {
  GT.injectDiceTray(html);
});
Hooks.on("renderChatPopout", (app, html) => GT.injectDiceTray(html));
Hooks.on("renderCombatTracker", (app, html) => GT.injectCombatTrackerControls(html));

Hooks.on("renderChatMessageHTML", (message, html) => {
  GT.applyTheme();
  const root = GT.htmlRoot(html);
  const druidCard = root?.querySelector?.(".gt-druid-card, .gt-druid-spell-roll-card");
  if (!druidCard) return;
  const messageElement = druidCard.closest?.(".message") || root;
  druidCard.addEventListener("pointerdown", () => {
    document.querySelectorAll(".message.gt-druid-message-front, [data-message-id].gt-druid-message-front").forEach(element => element.classList.remove("gt-druid-message-front"));
    messageElement?.classList?.add("gt-druid-message-front");
    messageElement?.scrollIntoView?.({block: "nearest", behavior: "smooth"});
  });
});

/** Foundry-ready: richtet Theme/Chat ein. Die Kerninhalte liegen als System-Compendien im Manifest. */
Hooks.once("ready", async () => {
  GT.applyTheme();
  GT.installGlobalClickHandlers();
  setTimeout(() => GT.injectDiceTray(), 250);
});
