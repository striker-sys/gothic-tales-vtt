/**
 * Gothic-Tales-System-Namespace. Alle Helfer, Konfigurationen, Bögen, Importeure
 * und UI-Anbindungen liegen hier gebündelt, damit Foundry sie während init über
 * game.gothicTales bereitstellen kann.
 */
const GT = {};
GT.SYSTEM_VERSION = "0.4.0";

// Foundry-Utility-Aliase halten den folgenden Code lesbar und bündeln Kompatibilitäts-Fallbacks.
const mergeObject = foundry.utils.mergeObject;
const deepClone = foundry.utils.deepClone ?? (obj => JSON.parse(JSON.stringify(obj ?? {})));
const setProperty = foundry.utils.setProperty;
const getProperty = foundry.utils.getProperty;
const flattenObject = foundry.utils.flattenObject;

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
  defaultActorImg: "icons/svg/mystery-man.svg",
  defaultItemImg: "icons/svg/item-bag.svg"
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

/** Erzeugt Fallback-Beschreibungen für Talente mit Baum, Kosten und Voraussetzungen. */
GT.talentNodeDescription = function(tree, node) {
  const label = GT.talentDisplayLabel(node);
  const explicit = String(node.description ?? "").trim();
  if (explicit && !explicit.startsWith(`${label} gehört zum Talentbaum`)) return GT.cleanText(explicit);
  const cost = Number(node.lpCost || 0) > 0 ? `${node.lpCost} LP` : "automatisch oder ohne LP-Kosten";
  const req = (node.requires || []).length ? `Voraussetzung: ${node.requires.join(", ")}.` : "Keine direkte Voraussetzung.";
  return `${label} gehört zum Talentbaum ${tree.label}. Kosten: ${cost}. ${req}`;
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
    return {treeId: tree.id, nodeId: node.id, treeLabel: tree.label, name: label, type: "talent", category: tree.label, description, lpCost: Number(node.lpCost || 0), requirements: (node.requires || []).join(", ")};
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
    const description = GT.textToHtml(GT.talentNodeDescription({label: talent.treeLabel || talent.category || "Talente"}, {...talent, label: name, lpCost: 0}));
    added.set(key, {
      name,
      type: "talent",
      img: GT.CONFIG.defaultItemImg,
      system: {
        category: talent.treeLabel || talent.category || "Talente",
        description,
        sourceText: description,
        requirements: talent.requirements || "",
        value: "",
        lpCost: 0,
        treeId: talent.treeId || "",
        nodeId: talent.nodeId || "",
        uses: {value: 0, max: 0}
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
  const current = String(getProperty(document.system ?? {}, path) ?? "");
  const plain = GT.htmlToPlainText(current || "");
  const htmlValue = GT.normalizeHtml(current || "");
  new Dialog({
    title: `${label} bearbeiten`,
    content: `<form class="gothic-tales gt-description-dialog">
      <p>Du kannst die Beschreibung als normalen Text speichern oder direkt HTML einfügen.</p>
      <label><strong>Freitext</strong><textarea name="text" rows="10">${GT.escape(plain)}</textarea></label>
      <label><strong>HTML</strong><textarea name="html" rows="10">${GT.escape(htmlValue)}</textarea></label>
    </form>`,
    buttons: {
      saveText: {
        label: "Freitext speichern",
        icon: '<i class="fas fa-align-left"></i>',
        callback: async html => {
          const text = html.find("textarea[name='text']").val() ?? "";
          await document.update({[`system.${path}`]: GT.textToHtml(text)});
        }
      },
      saveHtml: {
        label: "HTML speichern",
        icon: '<i class="fas fa-code"></i>',
        callback: async html => {
          const raw = html.find("textarea[name='html']").val() ?? "";
          await document.update({[`system.${path}`]: GT.normalizeHtml(raw)});
        }
      },
      cancel: {label: "Abbrechen"}
    },
    default: "saveText"
  }).render(true);
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
    img: GT.CONFIG.defaultItemImg,
    system,
    flags: {"gothic-tales": {sourceBook: data.sourceBook, sourcePage: data.sourcePage, importedName: data.name}}
  };
};

GT.customActorItem = function(name, type = "equipment", quantity = 1, category = "Inventar") {
  return {
    name,
    type,
    img: GT.CONFIG.defaultItemImg,
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
      node.description = GT.talentNodeDescription(tree, node);
      node.descriptionHtml = GT.textToHtml(node.description);
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

/** Eigener Gothic-Tales-Würfler mit w-Notation und Pasch-Nachwurf-Logik. */
GT.rollGT = function(formula) {
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
      for (let i = 0; i < count; i++) dice.push({sides, result: Math.floor(Math.random() * sides) + 1, sign, reroll: null});
      continue;
    }
    const n = Number(term);
    if (!Number.isNaN(n)) constant += sign * n;
  }
  const groups = {};
  for (let i = 0; i < dice.length; i++) {
    const d = dice[i];
    if (d.sides === 20 || d.sides < 2 || d.sides > 12) continue;
    groups[d.result] ??= [];
    groups[d.result].push(i);
  }
  for (const indexes of Object.values(groups)) {
    if (indexes.length < 2) continue;
    for (const idx of indexes) dice[idx].reroll = Math.floor(Math.random() * dice[idx].sides) + 1;
  }
  const diceTotal = dice.reduce((total, d) => total + d.sign * (d.result + (d.reroll || 0)), 0);
  const total = diceTotal + constant;
  return {formula, dice, constant, total, critical: dice.some(d => d.sides === 20 && d.result === 20)};
};

/** Gibt eigene Würfelergebnisse als Foundry-Chatkarten aus. */
GT.chatRoll = async function({formula, label = "Gothic Tales Wurf", actor = null, flavor = ""} = {}) {
  if (!formula) formula = "w20";
  const result = GT.rollGT(formula);
  const diceHtml = result.dice.map(d => {
    const sign = d.sign < 0 ? "−" : "+";
    const rr = d.reroll ? `<span class="gt-pasch"> Pasch +${d.reroll}</span>` : "";
    return `<span class="gt-die">${sign} w${d.sides}: <b>${d.result}</b>${rr}</span>`;
  }).join(" ");
  const constHtml = result.constant ? `<div class="gt-roll-line">Bonus: ${result.constant >= 0 ? "+" : ""}${result.constant}</div>` : "";
  const critical = result.critical ? `<div class="gt-critical">Kritischer Treffer/Erfolg</div>` : "";
  const content = `<div class="gothic-tales chat-card">
    <h2>${GT.escape(label)}</h2>
    ${flavor ? `<p>${GT.escape(flavor)}</p>` : ""}
    <div class="gt-formula">${GT.escape(formula)}</div>
    <div class="gt-roll-line">${diceHtml}</div>
    ${constHtml}${critical}
    <div class="gt-total">${result.total}</div>
  </div>`;
  return ChatMessage.create({speaker: ChatMessage.getSpeaker({actor}), content});
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
    if (value) changes.push({key: `system.armorBonus.${key}`, mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: String(value), priority: 20});
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
  s.talentTree ??= {learned: {}};
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

/** Lädt mitgelieferte JSON-Daten aus systems/gothic-tales/data für Importeure und Assistenten. */
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

GT.getSceneData = async function() {
  if (!GT._sceneData) GT._sceneData = await fetchSystemJson("gt-scenes.json");
  return GT._sceneData;
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
      img: GT.CONFIG.defaultItemImg,
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
    return {name: "Wasserschlauch (3/3)", type: "consumable", img: GT.CONFIG.defaultItemImg, system: {quantity, category: "Essen & Trinken", description: "<p>Gefüllter Wasserschlauch mit drei Portionen Wasser.</p>", value: "", uses: {value: 3, max: 3}}};
  }
  if (name === "Wasserschlauch") return {name: "Wasserschlauch (2/3)", type: "consumable", img: GT.CONFIG.defaultItemImg, system: {quantity, category: "Essen & Trinken", description: "<p>Wasserschlauch mit zwei von drei Portionen Wasser.</p>", uses: {value: 2, max: 3}}};
  return {name, type: "equipment", img: GT.CONFIG.defaultItemImg, system: {quantity, category: "Kram", description: "<p>Startausrüstung.</p>"}};
};

GT.itemsFromPackage = async function(packageId) {
  const pack = GT.START_PACKAGES.find(p => p.id === packageId) ?? GT.START_PACKAGES[0];
  const docs = [];
  docs.push({name: "Zerschlissene Kleidung", type: "armor", img: GT.CONFIG.defaultItemImg, system: {category: "Startausrüstung", rk: 0, ele: 0, ma: 0, description: "<p>Einfache, zerschlissene Kleidung.</p>"}});
  docs.push(await GT.itemFromSource("Ration / Nahrung", 1));
  docs.push(await GT.itemFromSource("Wasserschlauch", 1));
  for (const [name, qty, mode] of pack.items) docs.push(await GT.itemFromSource(name, qty, mode));
  return docs;
};

/** Bereitet reine Bogenlisten, gruppierte Items und Anzeigenamen gelernter Talente für Handlebars-Templates vor. */
function enrichLists(data) {
  const system = data.system ?? {};
  data.attributeList = Object.entries(system.attributes ?? {}).map(([key, value]) => ({key, ...value, formula: `w20 + ${value.die} + ${value.bonus}`}));
  data.skillList = Object.entries(system.skills ?? {}).map(([key, value]) => ({key, ...value}));
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
  data.isCharacter = data.actor?.type === "character";
  data.isNpcOrMonster = data.actor?.type === "npc" || data.actor?.type === "monster";
  data.sheetLocked = !!system.sheetLocked;
  data.levels = Object.entries(GT.LEVEL_RESOURCES).map(([level, r]) => ({level, lp: r.lp, erz: r.erz, selected: Number(level) === Number(system.stufe)}));
  return data;
}

const BaseActorSheet = globalThis.ActorSheet ?? foundry?.appv1?.sheets?.ActorSheet;
const BaseItemSheet = globalThis.ItemSheet ?? foundry?.appv1?.sheets?.ItemSheet;
const BaseFormApplication = globalThis.FormApplication ?? foundry?.appv1?.api?.FormApplication;
const BaseApplication = globalThis.Application ?? foundry?.appv1?.api?.Application;

/** Hauptbogen für Charaktere, NSCs und Monster. Verdrahtet Würfe, Sperrmodus, Rast und Gegenstandsaktionen. */
class GothicTalesActorSheet extends BaseActorSheet {
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["gothic-tales", "sheet", "actor"],
      template: "systems/gothic-tales/templates/actor/actor-sheet.hbs",
      width: 1120,
      height: 900,
      resizable: true,
      tabs: [{navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "main"}],
      scrollY: [".gt-scroll", ".sheet-body"]
    });
  }

  getData(options) {
    const data = super.getData(options);
    data.config = GT.CONFIG;
    data.actor = this.actor;
    data.items = Array.from(this.actor.items ?? []).sort((a,b) => (a.sort ?? 0) - (b.sort ?? 0) || a.name.localeCompare(b.name));
    data.system = GT.recalculateSystem(this.actor.system, this.actor.type, {equippedArmorBonus: GT.equippedArmorBonusFromItems(data.items)});
    data.editable = this.isEditable;
    data.actorTypeLabel = GT.CONFIG.actorTypes[this.actor.type] || this.actor.type;
    return enrichLists(data);
  }

  activateListeners(html) {
    super.activateListeners(html);
    const locked = !!this.actor.system?.sheetLocked;
    if (locked) {
      html.find("input, textarea, select").prop("disabled", true);
      html.find('input[name="system.hp.value"], input[name="system.mana.value"], input[name="system.exhaustion.value"], input[name="system.deathCounter.value"]').prop("disabled", false).addClass("gt-resource-editable");
      html.find(".gt-lock-toggle, .gt-roll, .gt-open-talent-tree, .gt-open-creator, .gt-open-npc-creator, .gt-rest-button, .gt-recalculate, .gt-description-edit").prop("disabled", false);
      html.find(".item-create, .item-edit, .item-delete, .item-equip").prop("disabled", true).addClass("disabled");
    }
    html.find(".gt-roll").on("click", ev => {
      ev.preventDefault();
      const button = ev.currentTarget;
      GT.chatRoll({formula: button.dataset.formula, label: button.dataset.label, actor: this.actor});
    });
    html.find(".gt-recalculate").on("click", async ev => {
      ev.preventDefault();
      const calc = GT.recalculateSystem(this.actor.system, this.actor.type, {equippedArmorBonus: GT.equippedArmorBonusFromItems(this.actor.items)});
      await this.actor.update(GT.flattenSystemUpdate(calc));
      ui.notifications.info("Gothic Tales: Werte neu berechnet.");
    });
    html.find(".gt-lock-toggle").on("click", async ev => {
      ev.preventDefault();
      await this.actor.update({"system.sheetLocked": !this.actor.system?.sheetLocked});
      ui.notifications.info(this.actor.system?.sheetLocked ? "Bearbeitung aktiviert." : "Bearbeitung gesperrt.");
      this.render(false);
    });
    html.find(".gt-rest-button").on("click", ev => {
      ev.preventDefault();
      GT.openRestDialog(this.actor);
    });
    html.find(".gt-open-talent-tree").on("click", ev => { ev.preventDefault(); new GothicTalesTalentTree(this.actor).render(true); });
    html.find(".gt-open-creator").on("click", ev => { ev.preventDefault(); new GothicTalesCharacterCreator({targetActor: this.actor}).render(true); });
    html.find(".gt-open-npc-creator").on("click", ev => { ev.preventDefault(); new GothicTalesNPCGenerator({targetActor: this.actor}).render(true); });
    html.find(".gt-description-edit").on("click", ev => {
      ev.preventDefault();
      const path = ev.currentTarget.dataset.path || "notes";
      const label = ev.currentTarget.dataset.label || "Beschreibung";
      GT.openTextEditorDialog(this.actor, path, label);
    });
    if (!this.isEditable || locked) return;
    html.find(".item-create").on("click", async ev => {
      ev.preventDefault();
      const type = ev.currentTarget.dataset.type || "equipment";
      await this.actor.createEmbeddedDocuments("Item", [{name: "Neuer Eintrag", type, img: GT.CONFIG.defaultItemImg}]);
    });
    html.find(".item-edit").on("click", ev => {
      ev.preventDefault();
      const item = this.actor.items.get(ev.currentTarget.closest(".item")?.dataset.itemId);
      item?.sheet?.render(true);
    });
    html.find(".item-delete").on("click", async ev => {
      ev.preventDefault();
      const item = this.actor.items.get(ev.currentTarget.closest(".item")?.dataset.itemId);
      if (item && await Dialog.confirm({title: GT.localize("GOTHICTALES.DeleteItem", "Gegenstand löschen"), content: `<p>${GT.escape(item.name)} entfernen?</p>`})) await item.delete();
    });
    html.find(".item-equip").on("click", async ev => {
      ev.preventDefault();
      const item = this.actor.items.get(ev.currentTarget.closest(".item")?.dataset.itemId);
      if (!item) return;
      await item.update({"system.equipped": !item.system?.equipped});
      await this.actor.update(GT.flattenSystemUpdate(GT.recalculateSystem(this.actor.system, this.actor.type, {equippedArmorBonus: GT.equippedArmorBonusFromItems(this.actor.items)})));
    });
    html.find(".item-roll").on("click", ev => {
      ev.preventDefault();
      const item = this.actor.items.get(ev.currentTarget.closest(".item")?.dataset.itemId);
      GT.chatRoll({formula: GT.itemDamageFormula(this.actor, item), label: item?.name ?? "Wurf", actor: this.actor, flavor: "Schaden/Effekt"});
    });
    html.find(".item-attack").on("click", ev => {
      ev.preventDefault();
      const item = this.actor.items.get(ev.currentTarget.closest(".item")?.dataset.itemId);
      const formula = GT.actorAttributeFormula(this.actor, item?.system?.attribute || (item?.type === "spell" ? "konz" : "st"));
      GT.chatRoll({formula, label: item?.name ?? "Angriff", actor: this.actor, flavor: "Angriffswurf"});
    });
  }
}

/** Rastdialog, der TP/Mana regeneriert, optional Erschöpfung senkt und anschließend eine Chat-Zusammenfassung schreibt. */
GT.openRestDialog = function(actor) {
  const hp = actor.system?.hp ?? {value: 0, max: 0};
  const mana = actor.system?.mana ?? {value: 0, max: 0};
  const ex = actor.system?.exhaustion ?? {value: 0, max: 6};
  new Dialog({
    title: "Ausruhen",
    content: `<form class="gothic-tales gt-rest-dialog">
      <p><strong>Kurze Rast:</strong> Bei voller Mahlzeit werden die Hälfte der maximalen TP und Mana regeneriert.</p>
      <p><strong>Lange Rast:</strong> Bei voller Mahlzeit werden TP und Mana vollständig regeneriert und Erschöpfung wird um 2 reduziert.</p>
      <label><input type="radio" name="rest" value="short" checked> Kurze Rast</label>
      <label><input type="radio" name="rest" value="long"> Lange Rast</label>
      <label><input type="checkbox" name="meal" checked> Volle Mahlzeit/Wasser verbraucht</label>
      <label><input type="checkbox" name="healExhaustionShort"> Kurze Rast kuriert 1 Erschöpfung (SL-Entscheid)</label>
    </form>`,
    buttons: {
      rest: {
        label: "Ausruhen",
        callback: async html => {
          const rest = html.find('input[name="rest"]:checked').val();
          const meal = html.find('input[name="meal"]').is(":checked");
          const healExhaustionShort = html.find('input[name="healExhaustionShort"]').is(":checked");
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
          await actor.update({"system.hp.value": newHp, "system.mana.value": newMana, "system.exhaustion.value": newEx});
          ChatMessage.create({speaker: ChatMessage.getSpeaker({actor}), content: `<div class="gothic-tales chat-card"><h2>Ausruhen</h2><p>${actor.name} hat eine ${rest === "short" ? "kurze" : "lange"} Rast gemacht.</p><p>TP: ${newHp}/${hp.max}, Mana: ${newMana}/${mana.max}, Erschöpfung: ${newEx}/${ex.max}</p></div>`});
        }
      },
      cancel: {label: "Abbrechen"}
    },
    default: "rest"
  }).render(true);
};

/** Gegenstandsbogen für Waffen, Rüstungen, Zauber, Talente und Ausrüstungsmetadaten. */
class GothicTalesItemSheet extends BaseItemSheet {
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["gothic-tales", "sheet", "item"],
      template: "systems/gothic-tales/templates/item/item-sheet.hbs",
      width: 780,
      height: 760,
      resizable: true,
      tabs: [{navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "main"}],
      scrollY: [".gt-scroll", ".sheet-body"]
    });
  }

  getData(options) {
    const data = super.getData(options);
    data.config = GT.CONFIG;
    data.item = this.item;
    data.system = this.item.system;
    data.editable = this.isEditable;
    data.descriptionText = GT.htmlToPlainText(this.item.system?.description || "");
    data.attributeOptions = Object.entries(GT.CONFIG.attributes).map(([key, label]) => ({key, label, selected: key === String(this.item.system?.attribute || "").toLowerCase()}));
    return data;
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.find(".gt-roll").on("click", ev => {
      ev.preventDefault();
      GT.chatRoll({formula: ev.currentTarget.dataset.formula || this.item.system?.damage || "w20", label: this.item.name});
    });
    html.find(".gt-description-edit").on("click", ev => {
      ev.preventDefault();
      GT.openTextEditorDialog(this.item, "description", "Beschreibung");
    });
  }
}

/** Charakterassistent für Stufe, LP-Ausgaben, Stärken/Schwächen, Talente und Startausrüstung. */
class GothicTalesCharacterCreator extends BaseFormApplication {
  constructor(options = {}) { super({}, options); this.targetActor = options.targetActor ?? null; }
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      id: "gothic-tales-character-creator",
      classes: ["gothic-tales", "gt-app", "gt-character-creator-window"],
      title: "Gothic Tales Charakter erstellen",
      template: "systems/gothic-tales/templates/creator.hbs",
      width: 900,
      height: 820,
      resizable: true,
      scrollY: [".gt-creator"]
    });
  }

  async getData() {
    const items = await GT.getRumpelkammerItems();
    const traits = items.filter(i => i.type === "trait").map(i => ({name: i.name, kind: i.kind, points: i.points, category: i.category}));
    const scaffold = await GT.getTalentScaffold();
    const talents = scaffold.trees.flatMap(t => t.nodes.map(n => ({tree: t.label, id: `${t.id}__${n.id}`, label: n.label, lpCost: Number(n.lpCost || 0), requirements: (n.requires || []).join(", ")}))).filter(t => t.lpCost > 0);
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
      targetActor: this.targetActor
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
    for (const [tree, nodes] of Object.entries(learned)) {
      const t = scaffold.trees.find(x => x.id === tree);
      for (const node of Object.keys(nodes)) spent += Number(t?.nodes.find(n => n.id === node)?.lpCost || 0);
    }
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
    let actor = this.targetActor;
    if (actor) await actor.update({name, type: "character", system: baseSystem});
    else actor = await Actor.create({name, type: "character", img: GT.CONFIG.defaultActorImg, system: baseSystem});
    const itemDocs = await GT.itemsFromPackage(selected.id);
    for (const itemName of [formData.extraItem1, formData.extraItem2, formData.extraItem3].filter(Boolean)) itemDocs.push(await GT.itemFromSource(itemName, 1));
    if (itemDocs.length) await actor.createEmbeddedDocuments("Item", itemDocs);
    ui.notifications.info(`Gothic Tales: Spielercharakter ${name} erstellt.`);
    actor?.sheet?.render(true);
  }
}

/** SL-Werkzeug zum Erstellen archetypbasierter NSC-Actoren mit Startausrüstung. */
class GothicTalesNPCGenerator extends BaseFormApplication {
  constructor(options = {}) { super({}, options); this.targetActor = options.targetActor ?? null; }
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      id: "gothic-tales-npc-generator",
      classes: ["gothic-tales", "gt-app", "gt-npc-generator-window"],
      title: "Gothic Tales NSC-Generator",
      template: "systems/gothic-tales/templates/npc-generator.hbs",
      width: 820,
      height: "auto",
      resizable: true
    });
  }
  async getData() {
    const items = await GT.getRumpelkammerItems();
    return {
      archetypes: Object.entries(GT.NPC_ARCHETYPES).map(([id, a]) => ({id, label: a.label})),
      levels: Array.from({length: 30}, (_, i) => i + 1),
      factions: ["keine", "Altes Lager", "Neues Lager", "Sektenlager", "Stadtwache", "Paladin", "Feuermagier", "Wassermagier", "Druiden", "Waldläufer", "Nordmar", "Assassinen", "Ork", "Untot"],
      weapons: items.filter(i => ["weapon", "shield", "spell"].includes(i.type)).map(i => i.name).slice(0, 260),
      armors: items.filter(i => i.type === "armor").map(i => i.name),
      targetActor: this.targetActor
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
    const actorData = {name: formData.npcName || "Neuer NSC", type: "npc", img: GT.CONFIG.defaultActorImg, system};
    let actor = this.targetActor;
    if (actor) await actor.update(actorData);
    else actor = await Actor.create(actorData);
    const itemDocs = [];
    for (const n of [formData.weapon || archetype.weapon, formData.armor || archetype.armor, formData.extra || ""].filter(Boolean)) itemDocs.push(await GT.itemFromSource(n, 1));
    if (itemDocs.length) await actor.createEmbeddedDocuments("Item", itemDocs);
    actor.sheet?.render(true);
  }
}

/** Interaktives Talentbaumfenster, das LP ausgibt/erstattet und gelernte Knoten am Actor speichert. */
class GothicTalesTalentTree extends BaseApplication {
  constructor(actor, options = {}) { super(options); this.actor = actor; this.activeTree = "einhand"; }
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      id: "gothic-tales-talent-tree",
      classes: ["gothic-tales", "gt-app", "gt-talent-tree-window"],
      title: "Gothic Tales Talentbaum",
      template: "systems/gothic-tales/templates/talent-tree.hbs",
      width: 1000,
      height: 760,
      resizable: true,
      scrollY: [".gt-talent-app"]
    });
  }
  async getData() {
    const data = await GT.getTalentScaffold();
    const learnedRoot = this.actor.system?.talentTree?.learned ?? {};
    const lp = Number(this.actor.system?.lp?.value ?? 0);
    const isCharacter = this.actor.type === "character";
    const trees = data.trees.map(tree => {
      const learned = learnedRoot[tree.id] ?? {};
      const nodes = tree.nodes.map(n => {
        const reqsMet = (n.requires ?? []).every(r => learned[r]);
        const cost = isCharacter ? Number(n.lpCost || 0) : 0;
        return {...n, displayLabel: GT.talentDisplayLabel(n), learned: !!learned[n.id], available: !!learned[n.id] || (reqsMet && (!isCharacter || lp >= cost)), displayCost: isCharacter ? (Number(n.lpCost || 0) ? `${n.lpCost} LP` : "frei") : "NSC/Monster"};
      });
      return {...tree, active: tree.id === this.activeTree, nodes};
    });
    return {actor: this.actor, system: this.actor.system, trees, isCharacter};
  }
  activateListeners(html) {
    super.activateListeners(html);
    html.find(".gt-tree-select").on("click", ev => { this.activeTree = ev.currentTarget.dataset.tree; this.render(false); });
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
        if (isCharacter) update["system.lp.value"] = Number(this.actor.system?.lp?.value ?? 0) + Number(nodeData.lpCost || 0);
        await this.actor.update(update); return this.render(false);
      }
      const learnedTree = getProperty(this.actor.system, `talentTree.learned.${tree}`) ?? {};
      const reqsMet = (nodeData.requires ?? []).every(r => learnedTree[r]);
      if (!reqsMet) return ui.notifications.warn("Voraussetzungen sind noch nicht erfüllt.");
      const isCharacter = this.actor.type === "character";
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

/** Import-Anwendung für Journale, Actoren, Gegenstände, Talente und Szenen aus mitgelieferten JSON-Daten. */
class GothicTalesImporter extends BaseApplication {
  constructor(options = {}) { super(options); this.silent = !!options.silent; }
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      id: "gothic-tales-importer",
      classes: ["gothic-tales", "gt-app", "gt-importer-window"],
      title: "Gothic Tales Import",
      template: "systems/gothic-tales/templates/importer.hbs",
      width: 700,
      height: "auto"
    });
  }
  getData() { return {isGM: game.user.isGM}; }
  activateListeners(html) {
    super.activateListeners(html);
    html.find("button[data-import]").on("click", ev => { ev.preventDefault(); this.importKind(ev.currentTarget.dataset.import); });
  }
  async fetchJson(file) { return fetchSystemJson(file); }
  notify(message) { if (!this.silent) ui.notifications.info(message); else console.log(`Gothic Tales | ${message}`); }
  async ensureCompendium({name, label, type}) {
    const collection = `world.${name}`;
    let pack = game.packs.get(collection);
    if (!pack && globalThis.CompendiumCollection?.createCompendium) pack = await CompendiumCollection.createCompendium({name, label, type, package: "world"});
    if (!pack) throw new Error(`Compendium ${label} konnte nicht erstellt werden.`);
    return pack;
  }
  async ensureWorldFolder(name, type, parent = null) {
    const found = game.folders.find(f => f.name === name && f.type === type && (f.folder?.id ?? f.folder ?? null) === (parent?.id ?? parent ?? null));
    if (found) return found;
    return Folder.create({name, type, folder: parent?.id ?? null});
  }
  async ensurePackFolder(pack, name, type, parent = null) {
    try {
      await pack.getIndex();
      const folders = Array.from(pack.folders ?? []);
      const found = folders.find(f => f.name === name && (f.folder?.id ?? f.folder ?? null) === (parent?.id ?? parent ?? null));
      if (found) return found;
      return await Folder.create({name, type, folder: parent?.id ?? parent ?? null}, {pack: pack.collection});
    } catch (err) {
      console.warn("Gothic Tales | Pack-Ordner nicht verfügbar", err);
      return null;
    }
  }
  async ensurePackFolderPath(pack, path, type) {
    if (!path) return null;
    let parent = null;
    for (const part of String(path).split("/").map(p => p.trim()).filter(Boolean)) parent = await this.ensurePackFolder(pack, part, type, parent);
    return parent;
  }
  async upsertDocuments(cls, docs, {pack = null, batchSize = 100} = {}) {
    if (!docs.length) return {created: 0, updated: 0};
    let created = 0, updated = 0;
    if (!pack) {
      const chunks = [];
      for (let i = 0; i < docs.length; i += batchSize) chunks.push(docs.slice(i, i + batchSize));
      for (const chunk of chunks) created += (await cls.createDocuments(chunk)).length;
      return {created, updated};
    }
    const index = await pack.getIndex({fields: ["name", "type", "flags.gothic-tales.uid"]});
    const byUid = new Map(index.map(e => [e.flags?.["gothic-tales"]?.uid || `${e.type}:${e.name}`, e]));
    const create = [];
    const update = [];
    for (const doc of docs) {
      const uid = doc.flags?.["gothic-tales"]?.uid || `${doc.type}:${doc.name}`;
      const existing = byUid.get(uid);
      if (existing) update.push({_id: existing._id, ...doc});
      else create.push(doc);
    }
    for (let i = 0; i < create.length; i += batchSize) created += (await cls.createDocuments(create.slice(i, i + batchSize), {pack: pack.collection})).length;
    for (let i = 0; i < update.length; i += batchSize) {
      const chunk = update.slice(i, i + batchSize);
      if (chunk.length) updated += (await cls.updateDocuments(chunk, {pack: pack.collection})).length;
    }
    return {created, updated};
  }
  cleanHtml(html) { return String(html || "").replace(/[\u00ad\uFFFC\uFFFD]/g, "").replace(/\s{2,}/g, " "); }
  sectionLevelTag(level) {
    const n = Math.max(2, Math.min(5, Number(level || 2) + 1));
    return `h${n}`;
  }
  makeCombinedSectionsHtml(title, sections = [], source = "") {
    const toc = sections.map(section => `<li class="gt-toc-l${Number(section.level || 1)}"><a href="#${GT.slug(section.id || section.title)}">${GT.escape(section.title)}</a></li>`).join("");
    const body = sections.map(section => {
      const tag = this.sectionLevelTag(section.level);
      const id = GT.slug(section.id || section.title);
      return `<section class="gt-reference-section" id="${id}"><${tag}>${GT.escape(section.title)}</${tag}>${section.html || GT.textToHtml(section.text || "")}</section>`;
    }).join("\n");
    return this.cleanHtml(`<article class="gothic-tales gt-compendium-page gt-combined-reference"><h1>${GT.escape(title)}</h1>${source ? `<p class="gt-source-note">Quelle: ${GT.escape(source)}</p>` : ""}<nav class="gt-reference-toc"><h2>Inhalt</h2><ol>${toc}</ol></nav>${body}</article>`);
  }
  makeCombinedSourceHtml(book) {
    const pages = book.pages ?? [];
    const toc = pages.map(page => `<li><a href="#${GT.slug(book.title)}-seite-${page.page}">S. ${GT.escape(page.page)}: ${GT.escape(page.title || "")}</a></li>`).join("");
    const body = pages.map(page => `<section class="gt-reference-section" id="${GT.slug(book.title)}-seite-${page.page}"><h2>S. ${GT.escape(page.page)}: ${GT.escape(page.title || book.title)}</h2>${GT.textToHtml(page.text || "")}</section>`).join("\n");
    return this.cleanHtml(`<article class="gothic-tales gt-compendium-page gt-combined-reference"><h1>${GT.escape(book.title)}</h1><nav class="gt-reference-toc"><h2>Inhalt</h2><ol>${toc}</ol></nav>${body}</article>`);
  }
  async deletePackDocuments(pack, predicate, cls = JournalEntry) {
    if (!pack) return 0;
    try {
      const index = await pack.getIndex({fields: ["name", "type", "flags.gothic-tales.uid"]});
      const ids = Array.from(index).filter(predicate).map(e => e._id);
      if (ids.length) await cls.deleteDocuments(ids, {pack: pack.collection});
      return ids.length;
    } catch (err) {
      console.warn("Gothic Tales | Alte Kompendiumseinträge konnten nicht bereinigt werden", err);
      return 0;
    }
  }
  async cleanupLegacyReferencePacks(mainPack = null) {
    const main = mainPack ?? game.packs.get("world.gt-nachschlagewerk");
    if (main) {
      await this.deletePackDocuments(main, e => {
        const uid = e.flags?.["gothic-tales"]?.uid || "";
        return uid.startsWith("nachschlagewerk.regelwerk.") || uid.startsWith("nachschlagewerk.rumpelkammer.") || uid.startsWith("source.");
      });
    }
    for (const collection of ["world.gt-regelwerk", "world.gt-rumpelkammer", "world.gt-quellen"]) {
      const pack = game.packs.get(collection);
      if (!pack) continue;
      await this.deletePackDocuments(pack, e => !!e.flags?.["gothic-tales"]?.uid);
    }
  }
  async importSourcesToCompendium() {
    const data = await this.fetchJson("gt-sources.json");
    const pack = await this.ensureCompendium({name: "gt-nachschlagewerk", label: "GT Nachschlagewerk", type: "JournalEntry"});
    const docs = [];
    for (const book of data.books) {
      docs.push({
        name: `Quelle – ${book.title}`,
        pages: [{name: book.title, type: "text", text: {format: 1, content: this.makeCombinedSourceHtml(book)}}],
        flags: {"gothic-tales": {uid: `nachschlagewerk.quelle.${GT.slug(book.title)}`, source: book.title, combined: true, version: GT.SYSTEM_VERSION}}
      });
    }
    const res = await this.upsertDocuments(JournalEntry, docs, {pack});
    this.notify(`Quellen im GT Nachschlagewerk: ${res.created} neu, ${res.updated} aktualisiert.`);
  }
  async importJournalCompendium(file, name, label) {
    const data = await this.fetchJson(file);
    const pack = await this.ensureCompendium({name, label, type: "JournalEntry"});
    const docName = data.title || label;
    await this.deletePackDocuments(pack, e => {
      const uid = e.flags?.["gothic-tales"]?.uid || "";
      return uid.startsWith(`${name}.`) && uid !== `${name}.combined`;
    });
    const docs = [{
      name: docName,
      pages: [{name: docName, type: "text", text: {format: 1, content: this.makeCombinedSectionsHtml(docName, data.sections, data.source)}}],
      flags: {"gothic-tales": {uid: `${name}.combined`, source: data.source, combined: true, version: GT.SYSTEM_VERSION}}
    }];
    const res = await this.upsertDocuments(JournalEntry, docs, {pack});
    this.notify(`${label}: ${res.created} neu, ${res.updated} aktualisiert.`);
  }
  async importUnifiedReference() {
    const rulebook = await this.fetchJson("gt-rulebook-sections.json");
    const rumpel = await this.fetchJson("gt-rumpelkammer-sections.json");
    const sources = await this.fetchJson("gt-sources.json");
    const pack = await this.ensureCompendium({name: "gt-nachschlagewerk", label: "GT Nachschlagewerk", type: "JournalEntry"});
    await this.cleanupLegacyReferencePacks(pack);
    const docs = [
      {
        name: "Regelwerk",
        pages: [{name: "Regelwerk", type: "text", text: {format: 1, content: this.makeCombinedSectionsHtml("Regelwerk", rulebook.sections, rulebook.source)}}],
        flags: {"gothic-tales": {uid: "nachschlagewerk.regelwerk", source: rulebook.source, combined: true, version: GT.SYSTEM_VERSION}}
      },
      {
        name: "Rumpelkammer",
        pages: [{name: "Rumpelkammer", type: "text", text: {format: 1, content: this.makeCombinedSectionsHtml("Rumpelkammer", rumpel.sections, rumpel.source)}}],
        flags: {"gothic-tales": {uid: "nachschlagewerk.rumpelkammer", source: rumpel.source, combined: true, version: GT.SYSTEM_VERSION}}
      }
    ];
    for (const book of sources.books ?? []) {
      if (["regelwerk", "rumpelkammer"].includes(GT.slug(book.title))) continue;
      docs.push({
        name: book.title,
        pages: [{name: book.title, type: "text", text: {format: 1, content: this.makeCombinedSourceHtml(book)}}],
        flags: {"gothic-tales": {uid: `nachschlagewerk.quelle.${GT.slug(book.title)}`, source: book.title, combined: true, version: GT.SYSTEM_VERSION}}
      });
    }
    const res = await this.upsertDocuments(JournalEntry, docs, {pack});
    this.notify(`GT Nachschlagewerk: ${res.created} neu, ${res.updated} aktualisiert. Regelwerk, Rumpelkammer und Quellen liegen jetzt als je ein Dokument vor.`);
  }
  async importActors(kind) {
    const data = kind === "monsters" ? await this.fetchJson("gt-monsters.json") : await this.fetchJson("gt-nscs.json");
    const list = kind === "monsters" ? data.monsters : data.npcs;
    const sourceItems = await GT.getRumpelkammerItems();
    const sourceTalents = GT.flattenTalentScaffold(await GT.getTalentScaffold());
    const pack = await this.ensureCompendium({name: "gt-actoren", label: "GT Actoren", type: "Actor"});
    const folder = await this.ensurePackFolder(pack, kind === "monsters" ? "Monster" : "NSCs", "Actor");
    const docs = list.map(entry => {
      const type = kind === "monsters" ? "monster" : "npc";
      const description = GT.actorDescriptionHtml(entry, type);
      const system = {
        faction: entry.faction || "",
        movement: {value: entry.movement || 0},
        initiative: {value: entry.initiative || 0, die: "", bonus: entry.initiative || 0},
        armorBonus: {rk: 0, ele: 0, ma: 0},
        defenses: {rk: {label: "RK", value: entry.defenses?.rk || 10, bonus: 0}, ele: {label: "Elemente", value: entry.defenses?.ele || 10, bonus: 0}, ma: {label: "Mentale Abwehr", value: entry.defenses?.ma || 10, bonus: 0}},
        hp: entry.hp || {value: 10, max: 10}, mana: {value: 0, max: 0},
        biography: description,
        notes: description,
        sourceText: `<div class="gt-source-block"><p><b>${GT.escape(entry.sourceBook)}</b>, Seite ${GT.escape(entry.sourcePage)}</p><hr>${description}</div>`,
        sourceImage: "", sourceBook: entry.sourceBook, sourcePage: String(entry.sourcePage)
      };
      if (type === "monster") Object.assign(system, {monsterNumber: entry.number, monsterType: entry.typ, monsterstufe: entry.monsterstufe});
      if (type === "npc") Object.assign(system, {attributeTotal: entry.attributeTotal});
      return {name: entry.name, type, img: GT.CONFIG.defaultActorImg, folder: folder?.id, system, items: GT.actorEmbeddedItems(entry, type, sourceItems, sourceTalents), flags: {"gothic-tales": {uid: `${type}.${GT.slug(entry.name)}.${entry.sourcePage}`, sourceBook: entry.sourceBook, sourcePage: entry.sourcePage, version: GT.SYSTEM_VERSION}}};
    });
    const res = await this.upsertDocuments(Actor, docs, {pack});
    this.notify(`${kind === "monsters" ? "Monster" : "NSCs"}: ${res.created} neu, ${res.updated} aktualisiert. Beschreibungen wurden bereinigt; Inventar, Gegenstände und erkannte Talente wurden ergänzt.`);
  }
  async upsertWorldDocuments(cls, docs, {collection = null, batchSize = 50} = {}) {
    if (!docs.length) return {created: 0, updated: 0};
    const existingDocs = collection ? Array.from(collection) : [];
    const byUid = new Map(existingDocs.map(d => [d.flags?.["gothic-tales"]?.uid || `${d.documentName || d.type || "Document"}:${d.name}`, d]));
    const create = [];
    const update = [];
    for (const doc of docs) {
      const uid = doc.flags?.["gothic-tales"]?.uid || `${doc.type || "Document"}:${doc.name}`;
      const existing = byUid.get(uid);
      if (existing) update.push({_id: existing.id, ...doc});
      else create.push(doc);
    }
    let created = 0, updated = 0;
    for (let i = 0; i < create.length; i += batchSize) created += (await cls.createDocuments(create.slice(i, i + batchSize))).length;
    for (let i = 0; i < update.length; i += batchSize) {
      const chunk = update.slice(i, i + batchSize);
      if (chunk.length) updated += (await cls.updateDocuments(chunk)).length;
    }
    return {created, updated};
  }
  async importScenes() {
    const data = await this.fetchJson("gt-scenes.json");
    const pack = await this.ensureCompendium({name: "gt-karten", label: "GT Karten", type: "Scene"});
    const worldRoot = await this.ensureWorldFolder("Gothic Tales Karten", "Scene");
    const worldFolders = {};
    const packFolders = {};
    const worldDocs = [];
    const packDocs = [];
    for (const entry of data.scenes ?? []) {
      const folderName = entry.folder || (entry.type === "Weltkarte" ? "Weltkarten" : "Gebietskarten");
      worldFolders[folderName] ??= await this.ensureWorldFolder(folderName, "Scene", worldRoot);
      packFolders[folderName] ??= await this.ensurePackFolderPath(pack, `Karten/${folderName}`, "Scene");
      const base = deepClone(entry.scene ?? {});
      base.name = entry.name || base.name || "Gothic Tales Karte";
      base.navName = base.navName || base.name;
      base.flags ??= {};
      base.flags["gothic-tales"] = {
        ...(base.flags["gothic-tales"] ?? {}),
        uid: `scene.${entry.id || GT.slug(base.name)}`,
        mapType: entry.type || "Karte",
        image: entry.image,
        version: GT.SYSTEM_VERSION
      };
      delete base._id;
      delete base._stats;
      const worldScene = deepClone(base);
      worldScene.folder = worldFolders[folderName]?.id ?? null;
      const packScene = deepClone(base);
      packScene.folder = packFolders[folderName]?.id ?? null;
      worldDocs.push(worldScene);
      packDocs.push(packScene);
    }
    const worldRes = await this.upsertWorldDocuments(Scene, worldDocs, {collection: game.scenes});
    const packRes = await this.upsertDocuments(Scene, packDocs, {pack});
    this.notify(`Karten: ${worldRes.created} Welt-Szenen neu, ${worldRes.updated} aktualisiert. GT Karten-Kompendium: ${packRes.created} neu, ${packRes.updated} aktualisiert.`);
  }
  async importItems(kind) {
    const isTalent = kind === "talents";
    const data = isTalent ? await GT.getTalentScaffold() : await this.fetchJson("gt-rumpelkammer-items.json");
    const list = isTalent
      ? (data.trees ?? []).flatMap(tree => (tree.nodes ?? []).map(node => {
          const talentName = GT.talentDisplayLabel(node);
          const text = GT.talentNodeDescription(tree, {...node, label: talentName});
          return {...node, label: talentName, treeId: tree.id, category: tree.label, type: "talent", name: talentName, text, description: GT.textToHtml(text), sourceBook: "Talentbäume", sourcePage: tree.label, sort: Number(node.lpCost || 0), requirements: (node.requires || []).join(", "), value: node.lpCost ? `${node.lpCost} LP` : ""};
        }))
      : data.items;
    const pack = await this.ensureCompendium({name: isTalent ? "gt-talente" : "gt-ausruestung", label: isTalent ? "GT Talente" : "GT Ausrüstung", type: "Item"});
    const docs = [];
    for (const entry of list) {
      const type = entry.type || (isTalent ? "talent" : "equipment");
      const folder = await this.ensurePackFolderPath(pack, isTalent ? `Talente/${entry.category || "Allgemein"}` : (entry.folderCategory || entry.category || "Kram"), "Item");
      const name = entry.name;
      const description = isTalent ? (entry.description || GT.textToHtml(entry.text || "")) : GT.formatItemDescription(entry);
      docs.push({
        name, type, img: GT.CONFIG.defaultItemImg, folder: folder?.id, sort: Number(entry.sort || 0),
        system: {
          category: entry.category || "", description, sourceText: entry.sourceText || description || "",
          sourceImage: "", sourceBook: entry.sourceBook || "", sourcePage: String(entry.sourcePage || ""), damage: entry.damage || "", effect: entry.effect || "",
          attribute: entry.attribute || "", targetDefense: entry.targetDefense || (type === "spell" ? "ele" : "rk"), properties: entry.properties || "",
          requirements: entry.requirements || "", value: entry.value || "", circle: entry.circle || "", mana: entry.mana || "", range: entry.range || "",
          rk: Number(entry.rk || 0), ele: Number(entry.ele || 0), ma: Number(entry.ma || 0), points: entry.points || 0, kind: entry.kind || "", quantity: entry.quantity || 1,
          uses: entry.uses || {value: 0, max: 0}, treeId: entry.treeId || "", nodeId: entry.id || "", lpCost: Number(entry.lpCost || 0), equipped: false
        },
        effects: GT.makeItemActiveEffects({...entry, name}),
        flags: {"gothic-tales": {uid: isTalent ? `talent.${entry.treeId}.${entry.id}` : `${type}.${GT.slug(name)}.${GT.slug(entry.kind || entry.category || "")}`, sourceBook: entry.sourceBook, sourcePage: entry.sourcePage, version: GT.SYSTEM_VERSION}}
      });
    }
    const res = await this.upsertDocuments(Item, docs, {pack});
    this.notify(`${isTalent ? "Talente" : "Ausrüstung"}: ${res.created} neu, ${res.updated} aktualisiert.`);
  }
  async importKind(kind) {
    if (!game.user.isGM) return ui.notifications.warn("Nur die Spielleitung kann Quellen importieren.");
    try {
      if (kind === "sources") return this.importSourcesToCompendium();
      if (kind === "reference") return this.importUnifiedReference();
      if (kind === "rulebook") return this.importJournalCompendium("gt-rulebook-sections.json", "gt-regelwerk", "GT Regelwerk");
      if (kind === "rumpelkammer-journal") return this.importJournalCompendium("gt-rumpelkammer-sections.json", "gt-rumpelkammer", "GT Rumpelkammer");
      if (kind === "monsters" || kind === "npcs") return this.importActors(kind);
      if (kind === "talents" || kind === "items") return this.importItems(kind);
      if (kind === "scenes") return this.importScenes();
      if (kind === "all") {
        await this.importUnifiedReference();
        await this.importActors("monsters");
        await this.importActors("npcs");
        await this.importItems("talents");
        await this.importItems("items");
        await this.importScenes();
      }
    } catch (err) {
      console.error(err);
      ui.notifications.error(err.message);
      throw err;
    }
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
  GT.chatRoll({formula, label: "Manueller Wurf"});
  GT.clearManualDice();
};

/** Fügt die manuelle Würfeltabelle nahe dem Chatformular ein und hängt lokale Eventhandler einmalig an. */
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
    if (tray.parentElement !== form.parentElement || tray.nextElementSibling !== form) form.parentElement.insertBefore(tray, form);
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

/** Fängt Klicks der Würfeltabelle ab, auch wenn Foundry den Chat neu rendert oder die Tabelle verschiebt. */
GT.installGlobalClickHandlers = function() {
  if (GT._globalClickHandlersInstalled) return;
  GT._globalClickHandlersInstalled = true;
  document.addEventListener("click", ev => {
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
Hooks.once("init", async function() {
  Handlebars.registerHelper("eq", (a, b) => a === b);
  Handlebars.registerHelper("not", a => !a);
  Handlebars.registerHelper("or", (...args) => args.slice(0, -1).some(Boolean));
  Handlebars.registerHelper("lookupType", (obj, key) => obj?.[key] ?? key);
  CONFIG.GT = GT.CONFIG;
  game.gothicTales = GT;
  game.gothicTales.importer = {open: () => new GothicTalesImporter().render(true)};
  game.gothicTales.creator = {open: actor => new GothicTalesCharacterCreator({targetActor: actor}).render(true)};
  game.gothicTales.npcGenerator = {open: actor => new GothicTalesNPCGenerator({targetActor: actor}).render(true)};
  game.gothicTales.talentTree = {open: actor => new GothicTalesTalentTree(actor ?? canvas.tokens?.controlled?.[0]?.actor ?? game.user.character).render(true)};
  GT.installGlobalClickHandlers();
  game.settings.register("gothic-tales", "autoImportDone", {scope: "world", config: false, type: Boolean, default: false});
  game.settings.register("gothic-tales", "autoImportVersion", {scope: "world", config: false, type: String, default: ""});
  game.settings.register("gothic-tales", "autoImportEnabled", {scope: "world", config: true, type: Boolean, default: true, name: "GOTHICTALES.Settings.AutoImport.Name", hint: "GOTHICTALES.Settings.AutoImport.Hint"});
  await loadTemplates([
    "systems/gothic-tales/templates/actor/parts/attributes.hbs",
    "systems/gothic-tales/templates/actor/parts/items.hbs",
    "systems/gothic-tales/templates/actor/parts/source.hbs"
  ]);
  const ActorSheets = globalThis.Actors ?? foundry.documents.collections.Actors;
  const ItemSheets = globalThis.Items ?? foundry.documents.collections.Items;
  if (BaseActorSheet) {
    try { ActorSheets.unregisterSheet("core", BaseActorSheet); } catch (err) {}
    ActorSheets.registerSheet("gothic-tales", GothicTalesActorSheet, {types: ["character", "npc", "monster"], makeDefault: true, label: "Gothic Tales Bogen"});
  }
  if (BaseItemSheet) {
    try { ItemSheets.unregisterSheet("core", BaseItemSheet); } catch (err) {}
    ItemSheets.registerSheet("gothic-tales", GothicTalesItemSheet, {types: Object.keys(GT.CONFIG.itemTypes), makeDefault: true, label: "Gothic Tales Gegenstand"});
  }
});

/** Fügt Gothic-Tales-Werkzeugbuttons in den Foundry-Einstellungen für SL hinzu. */
Hooks.on("renderSettings", (app, html) => {
  if (!game.user.isGM) return;
  const importerButton = $(`<button type="button"><i class="fas fa-book"></i> Gothic Tales Quellen importieren</button>`);
  importerButton.on("click", () => new GothicTalesImporter().render(true));
  const creatorButton = $(`<button type="button"><i class="fas fa-user-plus"></i> Gothic Tales Charakter-Assistent</button>`);
  creatorButton.on("click", () => new GothicTalesCharacterCreator().render(true));
  const npcButton = $(`<button type="button"><i class="fas fa-users"></i> Gothic Tales NSC-Generator</button>`);
  npcButton.on("click", () => new GothicTalesNPCGenerator().render(true));
  const target = html.find("#settings-game, .settings-list").first();
  if (target.length) target.append(importerButton, creatorButton, npcButton);
});

/** Fügt Schnellbuttons zur Actor-Verwaltung hinzu, um SL-Arbeitsabläufe zu beschleunigen. */
Hooks.on("renderActorDirectory", (app, html) => {
  if (!game.user.isGM) return;
  const bar = $(`<div class="gt-directory-tools"><button type="button"><i class="fas fa-user-plus"></i> Charakter-Editor</button><button type="button"><i class="fas fa-users"></i> NSC-Generator</button></div>`);
  bar.find("button").eq(0).on("click", () => new GothicTalesCharacterCreator().render(true));
  bar.find("button").eq(1).on("click", () => new GothicTalesNPCGenerator().render(true));
  html.find(".directory-header").after(bar);
});

Hooks.on("renderChatLog", () => {
  GT.injectDiceTray();
});

Hooks.on("renderChatMessage", (message, html) => {
  GT.applyTheme();
});

/** Foundry-ready: richtet Theme/Chat ein und startet den versionsgesteuerten automatischen SL-Kompendiumimport. */
Hooks.once("ready", async () => {
  GT.applyTheme();
  GT.installGlobalClickHandlers();
  setTimeout(() => GT.injectDiceTray(), 250);
  if (!game.user.isGM) return;
  const lastVersion = game.settings.get("gothic-tales", "autoImportVersion") || (game.settings.get("gothic-tales", "autoImportDone") ? "0.3.0" : "");
  if (game.settings.get("gothic-tales", "autoImportEnabled") && lastVersion !== GT.SYSTEM_VERSION) {
    ui.notifications.info(`Gothic Tales: Kompendien werden auf Version ${GT.SYSTEM_VERSION} aktualisiert.`);
    try {
      await new GothicTalesImporter({silent: true}).importKind("all");
      await game.settings.set("gothic-tales", "autoImportDone", true);
      await game.settings.set("gothic-tales", "autoImportVersion", GT.SYSTEM_VERSION);
      ui.notifications.info("Gothic Tales: Automatischer Import abgeschlossen.");
    } catch (err) {
      console.error(err);
      ui.notifications.error("Gothic Tales: Automatischer Import fehlgeschlagen. Der manuelle Import ist in den Einstellungen verfügbar.");
    }
  }
});
