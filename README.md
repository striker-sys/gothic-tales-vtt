# Gothic Tales für Foundry VTT

## Release 0.6.39

Version 0.6.17 stellt die Talentbeschreibungen aus dem zuletzt hochgeladenen Talentbaum-JSON wieder her und trennt Magiekreise, Druidenkunst und Berufe vom normalen Talentbaum. Der Actorbogen erhält eigene Bereiche für Zauber, Magiekreise und Druidenkunst. Magiekreise besitzen nun eine eigene JSON-Datei, einen eigenen Lernbaum und vier magische Würfelfelder, die abhängig vom aktuell gelernten Magiekreis gefüllt werden.


### 0.6.39 – Dynamische Schalteranzahl beim Schlösserknacken

- Im Fenster `Schlösserknacken vorbereiten` werden nicht mehr standardmäßig 12 Schalter angezeigt.
- Die sichtbare Schalterfolge entspricht jetzt der eingetragenen `Anzahl Schalter`.
- Die Begrenzung auf 12 Schalter wurde entfernt.
- Beim Ändern der Anzahl wird das Fenster neu aufgebaut und die Liste entsprechend erweitert oder gekürzt.
- Bei vielen Schaltern wird die Schalterliste scrollbar.

### 0.6.38 – DM-Tools Design wiederhergestellt

- Das vorherige schönere DM-Tools-Kartendesign wurde wiederhergestellt.
- Die optischen Änderungen aus 0.6.37 an Kartenhöhe, Innenabstand und Ausrichtung wurden zurückgenommen.
- Der Abstand zwischen `Charakter Editor` und `NSC Generator` bleibt erhöht, ohne das Kartendesign zu verändern.

### 0.6.37 – DM-Tools Generator-Abstände

- Abstand zwischen `Charakter Editor` und `NSC Generator` im Reiter `Generator` erhöht.
- Generator-Karten erhalten mehr Mindesthöhe und Innenabstand.
- Texte und Icons überschneiden sich dadurch nicht mehr.

### 0.6.36 – DM-Tools Ladefix

- Ladeunterbrechung durch den Sidebar-Observer behoben.
- Der MutationObserver für den DM-Tools-Button wurde entfernt.
- Stattdessen werden mehrere sichere verzögerte Einfügeversuche genutzt.
- Der Sidebar-Button schreibt sein Icon nicht mehr permanent neu.
- Doppel-Icons werden verhindert: sichtbar ist nur noch der Hammer.
- Tooltip und Fenster heißen weiterhin `Gothic-Tales DM-Tools`.

### 0.6.35 – Gothic-Tales DM-Tools

- Das Sidebar-Icon verwendet jetzt nur noch den Hammer und übernimmt keine Settings-/Compendium-Klassen mehr.
- Tooltip und Fenster heißen nun `Gothic-Tales DM-Tools`.
- Das DM-Tools-Fenster wurde als erweiterbares Werkzeugmenü aufgebaut.
- Reiter `Berufe` enthält die Berufs-Mini-Spiele. Aktuell enthalten: `Schlösserknacken`.
- Reiter `Generator` enthält:
  - Charakter Editor
  - NSC Generator
- Die Struktur ist für weitere Berufs-Mini-Spiele und DM-Funktionen vorbereitet.

### 0.6.34 – Berufe-Sidebarbutton sichtbar gemacht

- Der Berufe-Button sucht nun robuster nach der rechten Foundry-Sidebar.
- Unterstützt mehrere Foundry-V14-DOM-Strukturen für Sidebar-Tabs.
- Der Button wird weiterhin zwischen `Compendium Packs` und `Settings` eingefügt, wenn diese Einträge gefunden werden.
- Zusätzlich gibt es mehrere verzögerte Einfügeversuche und einen MutationObserver, damit der Button auch sichtbar wird, wenn Foundry die Sidebar später rendert.
- Der Button nutzt weiterhin Foundrys Tooltip über `data-tooltip="Berufe"`.

### 0.6.33 – DM-Menü in rechter Foundry-Sidebar

- Das DM-Menü sitzt jetzt als Foundry-ähnliches Icon in der rechten Sidebar.
- Der Button wird zwischen `Compendium Packs` und `Settings` eingefügt, sofern beide Tabs vorhanden sind.
- Das Icon nutzt die normale Sidebar-Optik statt eines eigenen großen Buttons.
- Der Tooltip läuft über Foundrys normales `data-tooltip`-System und heißt `Berufe`.
- Das Menü bleibt nur für Spielleiter sichtbar.
- Klick auf das Icon öffnet weiterhin das zentrale Berufe-Werkzeugfenster.

### 0.6.32 – Rechtes DM-Menü

- Der Berufe-Button wurde aus der linken Controls-Leiste herausgelöst.
- Spielleiter erhalten nun rechts am Bildschirm ein eigenes `DM`-Menü.
- Das DM-Menü ist nur für Spielleiter sichtbar.
- Im DM-Menü gibt es aktuell den Eintrag `Berufe`.
- Der Eintrag `Berufe` öffnet das zentrale Berufe-Werkzeugfenster mit dem Schlösserknacken-Minispiel.
- Das Menü ist als erweiterbare Sammelstelle für weitere Mini-Spiele und SL-Funktionen vorbereitet.

### 0.6.31 – Berufe-Hauptnavigation Fehler behoben

- Console-Fehler beim Klick auf das neue `Berufe`-Werkzeug behoben.
- Die fehleranfällige direkte Registrierung als Foundry Scene-Control wurde entfernt.
- Der GM-Button wird weiterhin in den Controls-Bereich eingefügt, ist aber kein internes Foundry-Tool mehr.
- Dadurch wird Foundrys interne Tool-Umschaltung nicht mehr ausgelöst.
- Das zentrale Berufe-Werkzeug mit `Schlösserknacken` bleibt erhalten und ist weiterhin nur für Spielleiter sichtbar.

### 0.6.30 – Berufe-Werkzeuge in Foundry-Hauptnavigation

- Der Button `Schloss vorbereiten` wurde aus dem Actor Sheet entfernt.
- Auch die Berufs-Infokarte öffnet das Schlösserknacken-Minispiel nicht mehr direkt.
- Für Spielleiter gibt es nun ein eigenes GM-Werkzeug `Berufe` in der Foundry-Hauptnavigation/Scene-Control-Leiste.
- Das neue Berufe-Werkzeug öffnet ein zentrales Fenster für berufsspezifische Mini-Spiele.
- Aktuell enthalten: `Schlösserknacken`.
- Der Button ist nur für Spielleiter sichtbar.
- Fallback eingebaut: Falls Foundry die Scene-Control-Erweiterung nicht rendert, wird ein eigener GM-Button im Controls-Bereich ergänzt.

### 0.6.29 – Berufsseiten im Sheet umschalten

- Die Berufsauswahl im Reiter `Berufe` nutzt jetzt Buttons statt Ankerlinks.
- Beim Anklicken eines Berufs wird die aktive Berufsseite direkt im Sheet ausgetauscht.
- Es wird nur noch die aktuell ausgewählte Berufsbeschreibung angezeigt.
- Der aktive Beruf bekommt einen sichtbaren roten/goldenen Highlight.
- Dadurch öffnet sich beim Klick auf `Schlösserknacken`, `Kräuterkunde` usw. keine Browser-/Webseiten-Navigation mehr.

### 0.6.28 – Berufe und Schlösserknacken-Minispiel

- Neuer Charakterbogen-Reiter `Berufe` zwischen Druidenkunst und Talente.
- Berufe werden aus `data/gt-profession-scaffold.json` geladen.
- Der Berufsbereich besitzt einen eigenen Berufsbaum.
- Gelernte Berufe erhalten im Reiter `Berufe` eigene Berufsseiten mit Beschreibung, Mechaniken, Tabellen und Würfelbutton.
- Beim Lernen wird auf Lehrer oder Lernmoment hingewiesen.
- Mehr als 3 Berufe sind möglich, lösen aber eine Warnung mit Bestätigung aus.
- Neue vollständige Infokarten für Berufe.
- Neues Schlösserknacken-Minispiel:
  - SL kann Schalteranzahl, Links/Rechts-Folge, SchwG, Zielspieler und versteckte Schalteranzahl festlegen.
  - Spieler löst das Schloss in einem eigenen Fenster.
  - Bei falschem Schalter wird automatisch ein Wurf gegen den SchwG vorbereitet.
  - Ohne Beruf `Schlösserknacken` wird `Gewandtheit` mit großem Nachteil verwendet.
  - Bei Fehlschlag kann ein neuer Dietrich verwendet werden.
  - Dietrich-Gegenstände werden im Inventar gesucht und verbraucht.
- Neues Makro-Beispiel: `macros/schloesserknacken-minispiel.js`.

### 0.6.27 – Item-Würfe repariert

- Die Click-Listener für `Angriff` und `Schaden/Effekt` an Gegenständen wurden wieder eingebunden.
- Item-Würfe funktionieren jetzt im normalen und im gesperrten Charakterbogen.
- Favoriten können weiterhin direkt über die Gegenstandsliste umgeschaltet werden.
- Wenn ein Gegenstand nicht gefunden wird, erscheint nun eine sichtbare Gothic-Tales-Warnung.

### 0.6.26 – Sheet-Scrolling repariert

- Das Scrollen innerhalb des Charakterbogens funktioniert wieder.
- Die vorherigen `overflow: visible`-Regeln am Fenster wurden für den Sheet-Inhalt zurückgenommen.
- Die Navigations-Post-Its bleiben weiterhin als frei schwebendes Element über dem Fenster sichtbar.

### 0.6.25 – Navigation-PostIt und Inventartext korrigiert

- Die Navigations-PostIts werden jetzt als frei schwebendes Element über dem Foundry-Fenster angezeigt.
- Dadurch werden sie nicht mehr durch das Charakterbogenfenster abgeschnitten.
- Der Inventartext liegt nun unter der Gegenstandsliste statt daneben.
- Hilfetexte bei Waffen/Zaubern stehen nun unter der jeweiligen Gegenstandsliste.
- Die Inventarliste nutzt dadurch mehr Breite für Gegenstandsnamen, Infos und Aktionsbuttons.

### 0.6.24 – Startseitenlayout und Navigation korrigiert

- Die Attribute stehen auf der Startseite wieder oben für sich allein.
- Darunter stehen die Fähigkeiten links und der Bereich `Ausgerüstet` rechts.
- Die Post-It-Hoverlabels der Seitennavigation fahren wieder nach rechts aus dem Bogen heraus.
- Das Layout fällt bei kleineren Fenstern sauber untereinander.

### 0.6.23 – Gegenstandslisten, Favoriten und Ausgerüstet-Übersicht

- Gegenstandslisten wurden neu strukturiert: Icon, Name/Infos und Aktionsbuttons sind jetzt sauber getrennt.
- Verschobene Info-Chips und falsch eingerückte Aktionssymbole wurden korrigiert.
- Item-Angriff und Item-Schaden/Effekt können jetzt auch im gesperrten Charakterbogen gewürfelt werden.
- Waffen können nun ebenfalls als ausgerüstet markiert werden.
- Items haben nun einen Favorit-Status.
- Auf der Startseite gibt es einen neuen Bereich `Ausgerüstet` neben den Fähigkeiten.
- Dort werden angelegte Waffen, angelegte Rüstungen/Schilde, favorisierte Zauber und favorisierte Gegenstände gruppiert angezeigt.
- Die Post-It-Hoverlabels der Seitennavigation klappen nun nach innen zum Bogen aus, damit sie nicht mehr aus dem Fenster heraus abgeschnitten werden.

### 0.6.22 – Benutzte Zauberwürfel

- Benutzte Zauberwürfel werden nicht mehr gelöscht.
- Benutzte Zauberwürfel bleiben sichtbar und bekommen ein `Benutzt`-Wasserzeichen.
- Benutzte Zauberwürfel können nur noch neu geworfen, aber nicht erneut benutzt werden.
- Beim Benutzen eines Zauberwürfels wird eine Chatkarte mit Würfelart und Ergebnis erzeugt.
- Der Magiewürfel-Dialog wurde breiter und die Buttons sind sauberer angeordnet.

### 0.6.21 – Magiekreis-Würfelerkennung korrigiert

- Magiekreis-Anzeige und Zauberwürfel-Auswahl sind jetzt getrennt.
- Der aktuelle Kreis wird nur noch aus Knoten der Ranggruppe `magiekreis` ermittelt.
- Die vorbereiteten Zauberwürfel werden aus dem höchsten gelernten Knoten mit nicht leerem `magicDice` gelesen.
- Dadurch werden `Zauberwürfel I`, `II` und `III` nicht mehr von höheren leeren Kreisknoten überdeckt.
- Die hochgeladene `gt-magic-circles-scaffold.json` wurde übernommen.

### 0.6.20 – Aktiver Menüpunkt hervorgehoben

- Der aktuell aktive Bereich in der kompakten Charakterbogen-Navigation ist jetzt deutlich markiert.
- Aktiver Menüpunkt erhält roten Pergament-/Siegel-Look, Goldrand, Leuchteffekt und seitliche Markierung.
- Die Tab-Logik setzt zusätzlich `aria-selected` und `aria-current`, damit der aktive Zustand zuverlässiger gestylt werden kann.

### 0.6.19 – Vorteil-/Nachteilwürfel angepasst

- Kleiner Vorteil/Nachteil verwendet jetzt `1W2`.
- Mittlerer Vorteil/Nachteil verwendet jetzt `1W6`.
- Großer Vorteil/Nachteil verwendet jetzt `1W12`.
- Vorteil wird als positiver Zusatzwürfel gerechnet.
- Nachteil wird als negativer Zusatzwürfel gerechnet.
- Diese Vorteil-/Nachteilwürfel lösen keine Pasch-Nachwürfe aus.

### 0.6.18 – Roll-Dialog-Fix

- Fehler beim Öffnen des neuen Würfeldialogs behoben.
- Der interne Dialogzustand heißt jetzt `rollState`, weil `ApplicationV2.state` in Foundry bereits ein schreibgeschützter Getter ist.
- Vorteil/Nachteil, Zusatzbonus und Zusatzwürfel bleiben unverändert nutzbar.

### 0.6.17 – Description-Restore

- Die `description`-Felder wurden aus dem zuletzt hochgeladenen `gt-talent-tree-scaffold.json` erneut als Quelle übernommen.
- Die Trennung in normale Talente, Magiekreise, Druidenkunst und Berufe bleibt erhalten.
- Keine automatische Textkorrektur oder HTML-Bereinigung der Beschreibungen.

### 0.6.14 – ActorSheet-Politur

- Die Seiten-Navigation im Charakterbogen ist nun kompakter und zeigt standardmäßig nur Icons.
- Beim Hover fährt die jeweilige Bezeichnung als kleiner Notizzettel nach rechts aus.
- Der Magiekreis-Bereich hat mehr Abstand zwischen Würfelfeldern, Beschriftung und Aktionsbuttons.
- Talentkarten haben mehr Luft; Aktionen liegen sauber unter dem Text und überschneiden sich nicht mehr.

## Release 0.6.3

Version 0.6.3 entfernt den alten Legacy-Welt-Importer vollständig. Die Gothic-Tales-Inhalte werden nun ausschließlich über die im Manifest registrierten System-Compendien ausgeliefert. Nicht mehr benötigte Importdaten, das Importer-Template und alte Pack-Logreste wurden aus dem Release entfernt.

## Release 0.5.7

Version 0.5.7 ergänzt einen Level-Up-Button im Charakterbogen, korrigiert die Attribut- und Würfelanzeige und fügt Avatar-Auswahlfelder im Charakter-Editor sowie im NSC-Generator hinzu.

## Release 0.5.12

Version 0.5.12 korrigiert den Actor-Kopfbereich: Verteidigungs-Grundwerte stehen nun in einer eigenen Reihe, die Bonuswerte direkt darunter. Dadurch laufen die Werte bei Standardfenstergröße nicht mehr in die Charakterwerte hinein.

## Release 0.5.11

Version 0.5.11 ordnet den Actorbogen neu: Trefferpunkte, Mana, Initiative, Bewegung und Tracker stehen jetzt im oberen Kopfbereich. Verteidigung und Rüstungsbonus sind kompakt zusammengefasst. Attribute und Fähigkeiten werden auf Standardfenstergrößen schlanker dargestellt, damit der Bogen auch auf kleineren Bildschirmen besser lesbar bleibt.

## Release 0.5.6

Version 0.5.6 baut NSC-Buch und Monsterbuch weiter aus: Werte, Besonderheiten, Beute/Ausrüstung und Beschreibung werden getrennt dargestellt. Die Beschreibung steht nun unterhalb der Wertespalten. Der Charakterbogen wird nicht mehr als eigenes Nachschlagewerk importiert.

## Release 0.5.5

Version 0.5.5 aktualisiert die Nachschlagewerke. Regelwerk und Rumpelkammer erhalten interne Dokument-Anker direkt an den Überschriften, automatische Querverweise auf passende Abschnitte, bereinigte doppelte Überschriften aus den Quelldaten und ein modernisiertes Journal-Layout mit besserem Inhaltsverzeichnis, Kartenabschnitten und hervorgehobenen internen Links.

## Release 0.5.2

Version 0.5.2 überarbeitet die V2-Fensteroptik weiter, entfernt die deprecated globale FilePicker-Nutzung, verschönert die Chat-Wurfkarten und strafft den Talentbaum. Talent-Schaltflächen zeigen nun zuerst den Titel und darunter die Kosten; Hovertexte werden frei am Viewport positioniert, damit sie nicht mehr durch Scrollbereiche abgeschnitten werden.


Willkommen bei **Gothic Tales** für Foundry VTT.

Dieses System bringt die wichtigsten Spielhilfen direkt an den virtuellen Spieltisch: Charakterbögen, NSC- und Monsterbögen, ein gemeinsames Nachschlagewerk, sortierte Ausrüstung, Charaktererstellung, NSC-Generator, Karten und eine manuelle Würfeltabelle im Chatbereich.

## Release 0.6.2

Version 0.6.2 korrigiert die Darstellung von NSC-Buch und Monsterbuch in den System-Compendien: Werte werden kompakt als Matrix angezeigt, Besonderheiten/Beute/Beschreibung erhalten ein sauberes helles Kartenlayout und interne Links verwenden dasselbe Anker-System wie Regelwerk und Rumpelkammer.

## Release 0.4.3

Version 0.4.3 härtet das Paket für Foundry VTT 14: Das Manifest ist als Systempaket markiert, begrenzt die Kompatibilität bewusst auf Version 14, synchronisiert Paket- und Runtime-Version für den Auto-Import, aktualisiert den Release-Workflow und führt vor dem ZIP-Build die vorhandenen Entwicklerprüfungen aus.

## Release 0.4.2

Version 0.4.2 behebt weitere Foundry-VTT-14-Warnungen beim automatischen Import, nutzt die namespaced Compendium-API, ersetzt deprecated Active-Effect-Modi und startet den Auto-Import ohne V1-Anwendungsfenster.

## Release 0.4.0

Version 0.4.0 modernisiert das Paket für Foundry VTT 14, bereinigt Manifest-Metadaten, ergänzt Ausrüstungsumschaltung, Active-Effect-Vorlagen für importierte Ausrüstung und Entwicklerprüfungen.

## Release 0.3.9

Version 0.3.9 bereinigt NSC- und Monsterbeschreibungen, ergänzt Inventar/Gegenstände direkt an den importierten Actoren und verbessert die Bedienung gesperrter Bögen.

Neu enthalten:

- Bereinigte Beschreibungen für NSCs und Monster ohne sichtbare HTML-Rohdaten.
- Waffen, Rüstungen, Beute und Inventar werden beim Import als eingebettete Items an NSCs und Monster gehängt.
- Talentknoten zeigen Hovertexte; dieselben Texte stehen auch in den Talentbeschreibungen.
- Beschreibungsfelder sind als Vorschau sichtbar und werden nur über einen Bearbeiten-Button geöffnet.
- Gesperrte Bögen erlauben weiterhin aktuelle TP, aktuelles Mana, Erschöpfung und Todeskampf zu ändern sowie alle Würfe auszuführen.
- Das Kartenpaket aus 0.3.7 bleibt enthalten.

Die bisherigen Funktionen bleiben erhalten: konsolidiertes Nachschlagewerk über System-Compendien, responsive Bögen, Charakter-Editor, NSC-Generator, Talentbaum-Gerüst, sortierte Items und die Würfeltabelle unterhalb des Chats.

## Installation über Foundry

Füge in Foundry diese Manifest-URL ein:

```text
https://raw.githubusercontent.com/striker-sys/gothic-tales-vtt/main/system.json
```

Das Manifest verweist auf den aktuellen Release-Download:

```text
https://github.com/striker-sys/gothic-tales-vtt/releases/latest/download/gothic-tales.zip
```

Hinweis: Bei einem privaten Repository kann Foundry den Manifest- oder Release-Download möglicherweise nicht ohne Anmeldung erreichen. Für eine direkte Installation über Foundry sollte der Release öffentlich erreichbar sein.

## Manuelle Installation

Lade das Release-ZIP herunter, entpacke es und kopiere den Ordner `gothic-tales` nach:

```text
FoundryVTT/Data/systems/
```

Starte Foundry danach neu. Gothic Tales erscheint anschließend in der Systemauswahl.

## Enthalten

- Automatischer Import und Aktualisierung der Kompendien beim ersten Start als Spielleitung.
- Konsolidiertes Nachschlagewerk für Regeln und Spielinhalte.
- Responsive Bögen für Charaktere, NSCs und Monster.
- Charakter-Editor und NSC-Generator.
- Talentbaum-Gerüst als Grundlage für spätere Erweiterungen.
- Sortierte Itemdaten für Waffen, Rüstungen, Tränke, Essen, Kram und weitere Ausrüstung.
- Kartenpaket für Minental und wichtige Gebiete.
- Manuelle Würfeltabelle unterhalb des Chats.
- System-Thumbnail und Hintergrund als WebP.
- Miniaturbilder für Actoren und Items inklusive allgemeinem Fallback-Icon und Foundry-Dateibrowser-Auswahl.

## Systemdaten

- System-ID: `gothic-tales`
- Version: `0.5.12`
- Foundry VTT: `14.368`
- Autor: Kuberia

## Entwicklung

Für einfache statische Prüfungen steht `npm run check` bereit. Der Befehl validiert die JSON-Daten/Manifest-Metadaten und führt einen Syntaxcheck für das Hauptskript aus.

## Status

Das System befindet sich noch im Aufbau. Ziel ist eine spielbare, gut lesbare und möglichst einfache Foundry-Umsetzung von Gothic Tales, die Schritt für Schritt weiter ausgebaut wird.