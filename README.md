# Gothic Tales für Foundry VTT

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
