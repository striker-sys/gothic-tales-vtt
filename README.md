# Gothic Tales für Foundry VTT

Willkommen bei **Gothic Tales** für Foundry VTT.

Dieses System bringt die wichtigsten Spielhilfen direkt an den virtuellen Spieltisch: Charakterbögen, NSC- und Monsterbögen, ein gemeinsames Nachschlagewerk, sortierte Ausrüstung, Charaktererstellung, NSC-Generator, Karten und eine manuelle Würfeltabelle im Chatbereich.

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

Die bisherigen Funktionen bleiben erhalten: konsolidiertes Nachschlagewerk, automatischer Import, responsive Bögen, Charakter-Editor, NSC-Generator, Talentbaum-Gerüst, sortierte Items und die Würfeltabelle unterhalb des Chats.

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

## Systemdaten

- System-ID: `gothic-tales`
- Version: `0.4.0`
- Foundry VTT: `14.368`
- Autor: Kuberia

## Status

Das System befindet sich noch im Aufbau. Ziel ist eine spielbare, gut lesbare und möglichst einfache Foundry-Umsetzung von Gothic Tales, die Schritt für Schritt weiter ausgebaut wird.
