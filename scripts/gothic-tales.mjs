/**
 * Gothic-Tales-System-Namespace. Alle Helfer, Konfigurationen, Bögen, Importeure
 * und UI-Anbindungen liegen hier gebündelt, damit Foundry sie während init über
 * game.gothicTales bereitstellen kann.
 */
const GT = {};
GT.SYSTEM_VERSION = "0.6.22";

// Foundry-Utility-Aliase halten den folgenden Code lesbar und bündeln Kompatibilitäts-Fallbacks.
const mergeObject = foundry.utils.mergeObject;
const deepClone = foundry.utils.deepClone ?? (obj => JSON.parse(JSON.stringify(obj ?? {})));
const setProperty = foundry.utils.setProperty;
const getProperty = foundry.utils.getProperty;
const flattenObject = foundry.utils.flattenObject;

GT.sheetTabState = new Map();
GT.sheetTabKey = document => document?.uuid || document?.id || document?.name || "unknown";

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
        bonus: GT.dataField.number(1)
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
      equipped: GT.dataField.boolean(false)
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
      range: GT.dataField.string("")
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
GT.executeChatRoll = async function({formula, label = "Gothic Tales Wurf", actor = null, flavor = "", rollOptions = {}, rollSummary = ""} = {}) {
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
  const critical = result.critical ? `<div class="gt-critical"><i class="fa-solid fa-burst"></i> Kritischer Treffer/Erfolg</div>` : "";
  const actorName = actor?.name ? `<div class="gt-roll-actor">${GT.escape(actor.name)}</div>` : "";
  const summaryHtml = rollSummary ? `<div class="gt-roll-options"><i class="fa-solid fa-sliders"></i> ${GT.escape(rollSummary)}</div>` : "";
  const content = `<div class="gothic-tales chat-card gt-roll-card">
    <header class="gt-roll-card-header">
      <div>
        <h2>${GT.escape(label)}</h2>
        ${actorName}
      </div>
      <div class="gt-roll-card-icon"><i class="fa-solid fa-dice-d20"></i></div>
    </header>
    ${flavor ? `<div class="gt-roll-flavor">${GT.escape(flavor)}</div>` : ""}
    ${summaryHtml}
    <div class="gt-roll-formula"><span>Formel</span><code>${GT.escape(formula)}</code></div>
    <div class="gt-roll-dice-grid">${diceHtml || `<span class="gt-roll-die muted">Keine Würfel</span>`}</div>
    ${constHtml ? `<div class="gt-roll-modifiers">${constHtml}</div>` : ""}
    ${critical}
    <footer class="gt-roll-total"><span>Gesamt</span><strong>${result.total}</strong></footer>
  </div>`;
  return ChatMessage.create({speaker: ChatMessage.getSpeaker({actor}), content});
};

GT.chatRoll = async function(options = {}) {
  if (options.configure === false) {
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
  const iniValue = type === "character" ? Math.floor((Number(s.attributes.ge.value) + Number(s.attributes.intu.value) + 2 * Number(s.attributes.erf.value)) / 3) : Number(s.initiative?.value ?? 0);
  const iniDerived = GT.attrFromValue(iniValue);
  s.initiative = {value: iniValue, die: iniDerived.die, bonus: iniDerived.bonus};
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
  const die = String(entry.die || "").toUpperCase();
  const result = entry.result ?? "—";
  return `
    <div class="gothic-tales chat-card gt-magic-die-used-chat-card">
      <header class="gt-magic-die-used-header">
        <div class="gt-magic-die-used-rune"><i class="fas fa-dice-d20"></i></div>
        <div>
          <div class="gt-talent-chat-kicker">Zauberwürfel benutzt</div>
          <h3>${GT.escape(actor?.name || "Magiewirker")}</h3>
        </div>
      </header>
      <div class="gt-magic-die-used-body">
        <span class="gt-magic-die-used-result">${GT.escape(result)}</span>
        <span class="gt-magic-die-used-label">${GT.escape(die || "Würfel")} · Feld ${Number(index) + 1}</span>
      </div>
      <p>Der vorbereitete Zauberwürfel wurde für eine Zauberhandlung eingesetzt.</p>
    </div>
  `;
};

GT.executeMagicCircleSkill = async function(actor, data = {}) {
  if (!actor?.isOwner) return ui.notifications.warn("Du hast keine Berechtigung, diesen Magiekreis auszuführen.");
  const scaffold = await GT.getMagicCircleScaffold();
  const found = GT.findTalentNode(data.treeId, data.nodeId, scaffold);
  if (!found) return ui.notifications.warn("Magiekreis-Daten nicht gefunden.");
  const {tree, node} = found;
  const card = {
    name: GT.talentDisplayLabel(node),
    treeLabel: tree.label,
    descriptionHtml: GT.talentDescriptionHtml(node.description || node.sourceDescription || ""),
    lpCostText: Number(node.lpCost || 0) ? `${node.lpCost} LP` : "frei / automatisch",
    requirementText: (node.requires || []).join(", "),
    attributeText: GT.talentAttributeRequirementText(node, actor),
    usageText: "Magiekreis",
    consumeText: "",
    remainingText: ""
  };
  await ChatMessage.create({speaker: ChatMessage.getSpeaker({actor}), content: GT.magicCircleChatContent(actor, card)});
};

GT.magicCircleChatContent = function(actor, card = {}) {
  return `
    <div class="gothic-tales chat-card gt-talent-chat-card gt-magic-chat-card">
      <header class="gt-talent-chat-header">
        <div class="gt-talent-chat-rune"><i class="fas fa-wand-sparkles"></i></div>
        <div class="gt-talent-chat-title">
          <div class="gt-talent-chat-kicker">Magiekreis angewandt</div>
          <h3>${GT.escape(card.name || "Magiekreis")}</h3>
          <div class="gt-talent-chat-subtitle">${GT.escape(card.treeLabel || "Uraltes Wissen")}</div>
        </div>
      </header>
      <section class="gt-talent-chat-body">${card.descriptionHtml || ""}</section>
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
  data.magicCircleSlots = GT.magicCircleSlots(system);
  data.currentMagicCircle = GT.currentMagicCircleNode(system);
  data.currentMagicCircleLabel = data.currentMagicCircle ? GT.talentDisplayLabel(data.currentMagicCircle.node) : "Kein Magiekreis gelernt";
  data.currentMagicCircleDiceText = GT.magicCircleDiceForSystem(system).map(d => d.toUpperCase()).join(" · ") || "Keine Würfel";
  data.isCharacter = data.actor?.type === "character";
  data.isNpcOrMonster = data.actor?.type === "npc" || data.actor?.type === "monster";
  data.sheetLocked = !!system.sheetLocked;
  const ini = system.initiative ?? {};
  const iniBonus = Number(ini.bonus || 0);
  data.initiativeFormula = `w20${ini.die ? ` + ${ini.die}` : ""}${iniBonus ? ` + ${iniBonus}` : ""}`;
  data.levels = Object.entries(GT.LEVEL_RESOURCES).map(([level, r]) => ({level, lp: r.lp, erz: r.erz, selected: Number(level) === Number(system.stufe)}));
  return data;
}

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
    this.rollState = {advantageMode: "none", advantageLevel: 1, bonus: 0, diceCounts: {2: 0, 4: 0, 6: 0, 8: 0, 10: 0, 12: 0, 20: 0}};
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
    super({window: {title: `${label} bearbeiten`}, position: {width: 820, height: 680}});
    this.document = document;
    this.path = path;
    this.label = label;
  }
  static DEFAULT_OPTIONS = {
    classes: ["gothic-tales", "gt-app", "gt-v2-window", "gt-description-editor-window"],
    window: {title: "Beschreibung bearbeiten", resizable: true},
    position: {width: 820, height: 680}
  };
  static PARTS = {body: {template: "systems/gothic-tales/templates/dialog-description.hbs", scrollable: [".gt-description-dialog"]}};
  getData() {
    const current = String(getProperty(this.document.system ?? {}, this.path) ?? "");
    return {label: this.label, plain: GT.htmlToPlainText(current || ""), html: GT.normalizeHtml(current || "")};
  }
  activateListeners(html) {
    super.activateListeners(html);
    const root = GT.htmlRoot(html);
    root.querySelector(".gt-save-text")?.addEventListener("click", async ev => {
      ev.preventDefault();
      const text = root.querySelector("textarea[name='text']")?.value ?? "";
      await this.document.update({[`system.${this.path}`]: GT.textToHtml(text)});
      await this.close();
    });
    root.querySelector(".gt-save-html")?.addEventListener("click", async ev => {
      ev.preventDefault();
      const raw = root.querySelector("textarea[name='html']")?.value ?? "";
      await this.document.update({[`system.${this.path}`]: GT.normalizeHtml(raw)});
      await this.close();
    });
    root.querySelector(".gt-dialog-cancel")?.addEventListener("click", ev => { ev.preventDefault(); this.close(); });
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

/** Hauptbogen für Charaktere, NSCs und Monster. Verdrahtet Würfe, Sperrmodus, Rast und Gegenstandsaktionen. */
class GothicTalesActorSheet extends BaseActorSheet {
  static DEFAULT_OPTIONS = {
    classes: ["gothic-tales", "sheet", "actor", "gt-v2-window", "gt-actor-window"],
    window: {title: "Gothic Tales Bogen", resizable: true},
    position: {width: 980, height: 820},
    form: {submitOnChange: false, closeOnSubmit: false}
  };

  static PARTS = {body: {template: "systems/gothic-tales/templates/actor/actor-sheet.hbs", scrollable: [".sheet-body", ".gt-scroll"]}};

  get actor() { return this.document; }

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
    return enrichLists(data);
  }

  _onRender(context, options) {
    super._onRender(context, options);
    this.activateListeners(this.element);
  }

  activateListeners(element) {
    const root = GT.htmlRoot(element);
    const tabKey = GT.sheetTabKey(this.actor);
    GT.activateSheetTabs(root, {
      initial: this._activeTab || GT.sheetTabState.get(tabKey) || "main",
      onChange: tab => {
        this._activeTab = tab || "main";
        GT.sheetTabState.set(tabKey, this._activeTab);
      }
    });
    const locked = !!this.actor.system?.sheetLocked;
    if (locked) {
      root.querySelectorAll("input, textarea, select").forEach(el => { el.disabled = true; });
      root.querySelectorAll('input[name="system.hp.value"], input[name="system.mana.value"], input[name="system.exhaustion.value"], input[name="system.deathCounter.value"]').forEach(el => { el.disabled = false; el.classList.add("gt-resource-editable"); });
      root.querySelectorAll(".gt-lock-toggle, .gt-roll, .gt-open-talent-tree, .gt-open-creator, .gt-open-npc-creator, .gt-rest-button, .gt-combat-end-button, .gt-recalculate, .gt-level-manage, .gt-description-edit, .gt-talent-info, .gt-use-talent").forEach(el => { el.disabled = false; });
      root.querySelectorAll(".item-create, .item-edit, .item-delete, .item-equip").forEach(el => { el.disabled = true; el.classList.add("disabled"); });
    }
    root.querySelectorAll(".gt-roll").forEach(el => el.addEventListener("click", ev => {
      ev.preventDefault();
      const button = ev.currentTarget;
      GT.chatRoll({formula: button.dataset.formula, label: button.dataset.label, actor: this.actor});
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
    root.querySelectorAll(".item-roll").forEach(el => el.addEventListener("click", ev => {
      ev.preventDefault();
      const item = this.actor.items.get(ev.currentTarget.closest(".item")?.dataset.itemId);
      GT.chatRoll({formula: GT.itemDamageFormula(this.actor, item), label: item?.name ?? "Wurf", actor: this.actor, flavor: "Schaden/Effekt"});
    }));
    root.querySelectorAll(".item-attack").forEach(el => el.addEventListener("click", ev => {
      ev.preventDefault();
      const item = this.actor.items.get(ev.currentTarget.closest(".item")?.dataset.itemId);
      const formula = GT.actorAttributeFormula(this.actor, item?.system?.attribute || (item?.type === "spell" ? "konz" : "st"));
      GT.chatRoll({formula, label: item?.name ?? "Angriff", actor: this.actor, flavor: "Angriffswurf"});
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
    root.querySelectorAll(".gt-roll").forEach(el => el.addEventListener("click", ev => {
      ev.preventDefault();
      GT.chatRoll({formula: ev.currentTarget.dataset.formula || this.item.system?.damage || "w20", label: this.item.name});
    }));
    root.querySelectorAll(".gt-description-edit").forEach(el => el.addEventListener("click", ev => {
      ev.preventDefault();
      GT.openTextEditorDialog(this.item, "description", "Beschreibung");
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
  static PARTS = {body: {template: "systems/gothic-tales/templates/creator.hbs", scrollable: [".gt-creator"]}};

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
  static PARTS = {body: {template: "systems/gothic-tales/templates/npc-generator.hbs", scrollable: [".gt-creator"]}};
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

/** Status der Chat-Würfeltabelle; zählt ausgewählte Würfel bis zum manuellen Wurf. */
GT.manualDiceState = {2: 0, 4: 0, 6: 0, 8: 0, 10: 0, 12: 0, 20: 0};

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
  const tray = document.querySelector("#gt-chat-dice-tray");
  const parts = [];
  for (const die of [2, 4, 6, 8, 10, 12, 20]) {
    const count = Number(GT.manualDiceState?.[die] || 0);
    if (count <= 0) continue;
    parts.push(`${count > 1 ? count : ""}w${die}`);
  }
  const bonus = Number(tray?.querySelector?.(".gt-chat-bonus")?.value || 0);
  let formula = parts.join(" + ");
  if (bonus > 0) formula += `${formula ? " + " : ""}${bonus}`;
  if (bonus < 0) formula += `${formula ? " - " : "-"}${Math.abs(bonus)}`;
  return formula.trim();
};

GT.updateManualDiceDisplay = function() {
  const tray = document.querySelector("#gt-chat-dice-tray");
  if (!tray) return;
  const formula = GT.buildManualDiceFormula();
  const display = tray.querySelector(".gt-chat-dice-formula");
  if (display) display.textContent = formula || "Würfel anklicken, dann mit „Wurf“ ausführen.";
  for (const die of [2, 4, 6, 8, 10, 12, 20]) {
    const btn = tray.querySelector(`[data-die="${die}"]`);
    if (!btn) continue;
    const count = Number(GT.manualDiceState?.[die] || 0);
    btn.classList.toggle("active", count > 0);
    btn.innerHTML = count > 0 ? `W${die}<span>${count}</span>` : `W${die}`;
    btn.title = count > 0 ? `W${die} hinzufügen (${count} gewählt)` : `W${die} hinzufügen`;
  }
  const rollButton = tray.querySelector(".gt-chat-roll-button");
  if (rollButton) rollButton.disabled = !formula;
};

GT.addManualDie = function(sides) {
  const die = Number(sides || 20);
  if (!GT.manualDiceState || !(die in GT.manualDiceState)) GT.manualDiceState = {2: 0, 4: 0, 6: 0, 8: 0, 10: 0, 12: 0, 20: 0};
  GT.manualDiceState[die] = Number(GT.manualDiceState[die] || 0) + 1;
  GT.updateManualDiceDisplay();
};

GT.clearManualDice = function() {
  GT.manualDiceState = {2: 0, 4: 0, 6: 0, 8: 0, 10: 0, 12: 0, 20: 0};
  const tray = document.querySelector("#gt-chat-dice-tray");
  const bonus = tray?.querySelector?.(".gt-chat-bonus");
  if (bonus) bonus.value = 0;
  GT.updateManualDiceDisplay();
};

GT.rollManualDice = function() {
  const formula = GT.buildManualDiceFormula();
  if (!formula) {
    ui.notifications?.warn?.("Bitte wähle mindestens einen Würfel oder Bonus aus.");
    return;
  }
  GT.chatRoll({formula, label: "Manueller Wurf", onRoll: () => GT.clearManualDice()});
};

/** Fügt die manuelle Würfeltabelle unter dem Chatformular ein und hängt lokale Eventhandler einmalig an. */
GT.injectDiceTray = function() {
  let tray = document.querySelector("#gt-chat-dice-tray");
  const chat = document.querySelector("#chat") || document.querySelector("#chat-popout") || document.querySelector("#sidebar");
  if (!chat) return tray;
  if (!tray) {
    tray = document.createElement("div");
    tray.id = "gt-chat-dice-tray";
    tray.className = "gt-chat-dice-tray";
    tray.setAttribute("aria-label", "Gothic Tales Würfeltabelle");
    tray.innerHTML = `
      <div class="gt-chat-dice-title"><span>GT Würfeltabelle</span></div>
      <div class="gt-chat-dice-buttons">
        <button type="button" class="gt-chat-die-button" data-die="2">W2</button>
        <button type="button" class="gt-chat-die-button" data-die="4">W4</button>
        <button type="button" class="gt-chat-die-button" data-die="6">W6</button>
        <button type="button" class="gt-chat-die-button" data-die="8">W8</button>
        <button type="button" class="gt-chat-die-button" data-die="10">W10</button>
        <button type="button" class="gt-chat-die-button" data-die="12">W12</button>
        <button type="button" class="gt-chat-die-button" data-die="20">W20</button>
      </div>
      <div class="gt-chat-dice-formula" aria-live="polite">Würfel anklicken, dann mit „Wurf“ ausführen.</div>
      <div class="gt-chat-dice-controls">
        <label>Bonus <input class="gt-chat-bonus" type="number" value="0" step="1"></label>
        <button type="button" class="gt-chat-clear-button">Leeren</button>
        <button type="button" class="gt-chat-roll-button" disabled>Wurf</button>
      </div>`;
  }
  const form = chat.querySelector("#chat-form") || chat.querySelector(".chat-form");
  if (form?.parentElement) {
    if (tray.parentElement !== form.parentElement || tray.previousElementSibling !== form) form.insertAdjacentElement("afterend", tray);
  } else if (tray.parentElement !== chat) {
    chat.appendChild(tray);
  }
  if (!tray.dataset.gtListeners) {
    tray.dataset.gtListeners = "true";
    tray.addEventListener("click", ev => {
      const dieButton = ev.target?.closest?.(".gt-chat-die-button");
      if (dieButton) {
        ev.preventDefault();
        GT.addManualDie(dieButton.dataset.die);
        return;
      }
      if (ev.target?.closest?.(".gt-chat-clear-button")) {
        ev.preventDefault();
        GT.clearManualDice();
        return;
      }
      if (ev.target?.closest?.(".gt-chat-roll-button")) {
        ev.preventDefault();
        GT.rollManualDice();
      }
    });
    tray.addEventListener("input", ev => {
      if (ev.target?.matches?.(".gt-chat-bonus")) GT.updateManualDiceDisplay();
    });
  }
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
  document.addEventListener("click", ev => {
    const referenceLink = ev.target?.closest?.(".gt-combined-reference a[data-gt-anchor], .gt-combined-reference a[href^='#']");
    if (referenceLink && GT.scrollReferenceAnchor(referenceLink)) {
      ev.preventDefault();
      ev.stopPropagation();
      return;
    }
    const dieButton = ev.target?.closest?.("#gt-chat-dice-tray .gt-chat-die-button");
    if (dieButton) {
      ev.preventDefault();
      ev.stopPropagation();
      GT.addManualDie(dieButton.dataset.die);
      return;
    }
    const clearButton = ev.target?.closest?.("#gt-chat-dice-tray .gt-chat-clear-button");
    if (clearButton) {
      ev.preventDefault();
      ev.stopPropagation();
      GT.clearManualDice();
      return;
    }
    const rollButton = ev.target?.closest?.("#gt-chat-dice-tray .gt-chat-roll-button");
    if (rollButton) {
      ev.preventDefault();
      ev.stopPropagation();
      GT.rollManualDice();
    }
  }, true);
};

/** Foundry-init: registriert Helfer, Einstellungen, Bögen, Templates und öffentliche game.gothicTales-APIs. */

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

Hooks.once("init", async function() {
  Handlebars.registerHelper("eq", (a, b) => a === b);
  Handlebars.registerHelper("not", a => !a);
  Handlebars.registerHelper("or", (...args) => args.slice(0, -1).some(Boolean));
  Handlebars.registerHelper("lookupType", (obj, key) => obj?.[key] ?? key);
  CONFIG.GT = GT.CONFIG;
  CONFIG.Actor.documentClass = GT.DataModels.Documents.Actor;
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

Hooks.on("renderChatLog", () => {
  GT.injectDiceTray();
});

Hooks.on("renderChatMessageHTML", (message, html) => {
  GT.applyTheme();
});

/** Foundry-ready: richtet Theme/Chat ein. Die Kerninhalte liegen als System-Compendien im Manifest. */
Hooks.once("ready", async () => {
  GT.applyTheme();
  GT.installGlobalClickHandlers();
  setTimeout(() => GT.injectDiceTray(), 250);
});
