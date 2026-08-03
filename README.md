# Gothic Tales VTT 0.8.0

![Version](https://img.shields.io/badge/Version-0.8.0-8f1111)
![Foundry VTT](https://img.shields.io/badge/Foundry%20VTT-14-5b2b18)
![Status](https://img.shields.io/badge/Status-Spielbare%20Demo-b08a3e)

**Gothic Tales VTT 0.8.0** ist eine spielbare, über GitHub verteilte Demo einer digitalen Foundry-VTT-Umsetzung des Pen-&-Paper-Systems **Gothic Tales** für **Foundry Virtual Tabletop 14**.

Version 0.8.0 basiert auf dem Entwicklungsstand 0.7.19 und bündelt den überarbeiteten Actorbogen, Kampf und Initiative, Magiekreise, Druidenkunst, Talente, Berufe, Handwerkssysteme, Spielleiterwerkzeuge, Chatkarten und den eigenen Gothic-Tales-Dice-Tray.

> **Hinweis:** Dies ist eine Demo- und Entwicklungsfassung. Vor dem Einsatz in einer dauerhaft geführten Spielwelt sollte eine Sicherung der Foundry-Daten angelegt werden.

> **Öffentliche GitHub-Fassung:** Kartenbilder aus Gothic 1 Remake / Gothic (2026) sind wegen fehlender Freigabe von Alkimia Interactive beziehungsweise THQ Nordic nicht enthalten.

---

## Inhalt von Version 0.8.0

### Actoren und Charakterverwaltung

- Gemeinsamer Actorbogen für **Charaktere, NSC und Monster**
- Actorfenster mit einer voreingestellten Größe von **850 × 800 Pixeln**
- Übersichtliche Bereiche für:
  - Statuswerte
  - Verteidigung
  - Initiative
  - Attribute und Fähigkeiten
  - Kampf
  - Inventar und Ausrüstung
  - Zauber und Magiekreise
  - Druidenkunst
  - Berufe und Talente
  - Notizen, Biografie und Quellen
- Eigener Hell- und Dunkelmodus
- Bearbeitbare Beschreibungen über Foundrys nativen ProseMirror-Editor
- Scrollbare Charakter- und NSC-Generatoren

### Kampf und Initiative

- Initiativeberechnung nach dem Schema:

  ```text
  Grundwert + Initiativwürfel + Bonus
  ```

- Unterstützung für normale Würfe, Vorteil, Nachteil und feste Gegnerwerte
- Übernahme des vollständigen Ergebnisses in den Combat Tracker
- Initiativeanforderungen durch die Spielleitung
- Aktionen für Rast, Kampfende und Neuberechnung
- Eigene Combat- und Initiative-Chatkarten

### Magiekreise

- Separater Lern- und Fortschrittsbereich für Magiekreise
- Vorbereitete Magiewürfel und mehrere Würfelplätze
- Magiekreis-Talente mit Voraussetzungen und Lernkosten
- Arkane Chatkarten für Magiewürfel und Magiekreis-Talente
- Darstellung verwendeter, vorbereiteter und verfügbarer Magiewürfel

### Druidenkunst

- Eigener Bereich für Druidenkunst und Druidenriten
- Schulen wie Wurzelwirker, Gestaltwandler und Seelenweber
- Lernbarer Ritenbaum
- Druidenzauber und Tiergestalten als Actor-Inhalte
- Lernen und Verlernen von Riten einschließlich LP-Verwaltung
- Eigene naturverbundene Chatkarten in Wald-, Moos- und Rindenoptik
- Hervorhebung und automatische Sichtbarkeit neu erzeugter Druidenkarten

### Talente, Berufe und Handwerk

- Separater Talentbaum
- Berufs- und Werkzeugverwaltung
- Enthaltene Spiel- und Handwerkssysteme:
  - Alchemie
  - Schmiedekunst
  - Schürfen
  - Schnitzkunst
  - Kräuterkunde
  - Feilschen
  - Taschendiebstahl
  - Schlösserknacken
- Getrennte Dialoge und Abläufe für Spielleitung und Spieler

### Eigener Dice Tray

- Eigene Gothic-Tales-Würfelablage unterhalb der Chateingabe
- Leicht transparenter Hintergrund
- Unterstützte Würfel:
  - W2
  - W4
  - W6
  - W8
  - W10
  - W12
  - W20
- Linksklick erhöht die Würfelanzahl
- Rechtsklick verringert die Würfelanzahl
- Modifikatoren über Eingabe, Mausrad oder Plus/Minus
- Automatische Formelerstellung
- Ausgabe als Gothic-Tales-Chatkarte
- Unterstützung für Hauptchat und Chat-Popout

### Kompendien und Karten

Die öffentliche GitHub-Fassung von Version 0.8.0 enthält vorbereitete Foundry-Kompendien für:

- Nachschlagewerk
- Actoren
- Ausrüstung
- Talente

#### Hinweis zu Karten aus Gothic

Im lokalen Entwicklungsstand wurden Kartenbilder verwendet, die den Gebieten Altes Lager, Neues Lager, Sumpflager, Minental, Orkstadt und Schläfertempel zugeordnet sind und aus **Gothic 1 Remake / Gothic (2026)** stammen. Für diese Karten liegt dem Projekt **keine Freigabe von Alkimia Interactive oder THQ Nordic** vor.

Deshalb sind diese Kartenbilder und das zugehörige Karten-Kompendium **nicht Bestandteil der öffentlichen GitHub-Fassung** und dürfen nicht in ein öffentliches Repository oder Release hochgeladen werden. Nutzerinnen und Nutzer können lokal eigene Karten oder Karten mit nachweislich ausreichender Nutzungserlaubnis ergänzen.

Weitere Einzelheiten stehen in [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).


---

## Technische Grundlage

Für Version 0.8.0 wurden folgende Techniken und Foundry-Funktionen verwendet:

- **Foundry VTT 14**
- Foundry `ApplicationV2`
- Foundry `ActorSheetV2` und `ItemSheetV2`
- Foundry `HandlebarsApplicationMixin`
- Handlebars-Templates
- JavaScript als native ES-Module
- HTML und CSS ohne externes UI-Framework
- JSON-basierte System-, Talent-, Magie-, Druiden- und Berufsdaten
- Foundrys nativer ProseMirror-Editor
- Foundry-Kompendien auf LevelDB-Basis
- Font-Awesome-Symbole aus der Foundry-Oberfläche
- optionale Darstellung eigener Würfe über **Dice So Nice**, sofern das Modul aktiviert ist

Das System besitzt keine verpflichtenden npm-Laufzeitabhängigkeiten. Der Gothic-Tales-Dice-Tray ist eigener Code und benötigt kein separates Dice-Tray-Modul.

Das Bedienkonzept des Dice Trays wurde lose durch das Open-Source-Projekt [fvtt-dice-tray von mclemente](https://github.com/mclemente/fvtt-dice-tray) inspiriert. Die Umsetzung, Klassen, Gestaltung und Würfellogik in Gothic Tales wurden eigenständig erstellt.

---

## Einsatz von künstlicher Intelligenz

Bei der Entwicklung von Gothic Tales VTT 0.8.0 wurden KI-gestützte Werkzeuge eingesetzt.

### Auswertung der Pen-&-Paper-Unterlagen

KI wurde verwendet, um öffentlich abrufbare PDF-Dokumente von [gothic-tales.de](https://gothic-tales.de/) auszulesen, Inhalte zu strukturieren und bei der Übertragung in digitale Foundry-Daten zu unterstützen. Dazu gehören insbesondere Regeln, Talente, Gegenstände, Zauber, NSC-, Monster- und Referenzinformationen.

Die KI-Auswertung diente als Arbeitshilfe. Inhalte wurden anschließend in Systemdaten, Dialoge, Actorfelder, Gegenstände und Kompendien übertragen und soweit möglich manuell geprüft.

> Die Originaldokumente auf gothic-tales.de bleiben die maßgebliche Quelle. Automatisch oder halbautomatisch übertragene Inhalte können Fehler, Auslassungen oder Abweichungen enthalten.

Die Original-PDFs werden durch dieses Projekt nicht ersetzt. Ihre Urheberrechte und sonstigen Rechte verbleiben beim Gothic-Tales-Projekt beziehungsweise den jeweiligen Urheberinnen und Urhebern.

### KI-unterstützte Programmierung

Auch Teile des Quellcodes, der CSS-Gestaltung, der Handlebars-Templates, der Prüfskripte, der Dokumentation und verschiedener Fehlerkorrekturen wurden mit Unterstützung von KI erstellt oder überarbeitet.

Die KI-generierten oder KI-überarbeiteten Bestandteile wurden in das bestehende Projekt integriert und durch manuelle Prüfungen, Syntaxprüfungen und Runtime-Smoke-Tests kontrolliert. Eine vollständige Fehlerfreiheit wird dadurch nicht garantiert.

---

## Installation

### Manuelle Foundry-Installation

1. Foundry VTT beenden.
2. Die Datei `gothic-tales.zip` entpacken.
3. Den enthaltenen Ordner `gothic-tales` nach `Data/systems/` kopieren.
4. Foundry VTT starten.
5. Eine neue Welt mit dem Spielsystem **Gothic Tales** anlegen.

Die Verzeichnisstruktur muss anschließend ungefähr so aussehen:

```text
Data/
└── systems/
    └── gothic-tales/
        ├── system.json
        ├── scripts/
        ├── styles/
        ├── templates/
        ├── assets/
        └── packs/
```

### Verteilung und Installation über GitHub

Das System wird ausschließlich über das GitHub-Repository und dessen Releases verteilt. Eine Aufnahme in die offizielle Foundry-Paketliste beziehungsweise eine Veröffentlichung als offiziell gelistetes Foundry-System ist nicht vorgesehen.

Manifestadresse:

```text
https://raw.githubusercontent.com/striker-sys/gothic-tales-vtt/main/system.json
```

---

## Entwicklung und Prüfung

Die enthaltenen Prüfskripte können im Repository mit folgendem Befehl ausgeführt werden:

```bash
npm run check
```

Geprüft werden dabei unter anderem:

- Manifest und JSON-Dateien
- JavaScript-Syntax
- grundlegender Runtime-Smoke-Test
- Actor-Layout-Baukasten
- Magiekreis- und Druidenkunst-Chatkarten

Ein automatischer Test ersetzt keinen vollständigen visuellen und spielerischen Test in einer gestarteten Foundry-Welt.

---

## Herkunft des Pen-&-Paper-Systems

Die regeltechnische und inhaltliche Grundlage dieses Foundry-Systems stammt aus dem Pen-&-Paper-Projekt **Gothic Tales**.

Gothic Tales beschreibt sich als Pen-&-Paper für die Welt von GOTHIC und stellt auf seiner Website unter anderem Regelwerk, Charakterbogen, Talentbäume, Gegenstände, NSC-, Monster- und Spielleiterunterlagen bereit.

- **Website:** [gothic-tales.de](https://gothic-tales.de/)
- **Gothic-Tales-Discord:** [discord.gg/fsqV7TyAGA](https://discord.gg/fsqV7TyAGA)

Gothic Tales VTT ist eine digitale Umsetzung und Erweiterung für Foundry VTT. Das Projekt erhebt keinen Eigentumsanspruch an den ursprünglichen Regeln, Texten, Illustrationen, Namen, Tabellen oder sonstigen Inhalten des Gothic-Tales-Pen-&-Paper-Systems.

Die Rechte an diesen Inhalten verbleiben beim Gothic-Tales-Projekt beziehungsweise den jeweiligen Autorinnen, Autoren und Rechteinhabern.

Dem Projektverantwortlichen liegt eine Freigabe des **Gothic-Tales-Projekts** für die digitale Umsetzung im Rahmen dieses GitHub-Projekts vor. Maßgeblich bleiben Umfang und Bedingungen der tatsächlich erteilten Freigabe. Sie überträgt keine Eigentumsrechte und erlaubt nicht automatisch die Weitergabe der Original-PDFs oder eine darüber hinausgehende Unterlizenzierung der Inhalte.

---

## Urheberrecht, Lizenzen, Karten und Marken

### Abgrenzung der Projektlizenz

Die für dieses Repository angegebene Softwarelizenz gilt ausschließlich für den selbst erstellten Quellcode und für ausdrücklich entsprechend gekennzeichnete eigene Inhalte, soweit in `LICENSE.txt` nichts anderes festgelegt ist.

Sie gewährt insbesondere **keine** Nutzungsrechte an:

- Original-PDFs, Illustrationen, Logos oder sonstigen Materialien von Gothic Tales, die nicht ausdrücklich von der vorhandenen Freigabe umfasst sind,
- Inhalten, Marken oder Assets aus GOTHIC beziehungsweise Gothic 1 Remake,
- Kartenbildern und sonstigen Drittmaterialien,
- Foundry VTT oder separat lizenzierten Foundry-Modulen.

Eine Nennung der jeweiligen Urheber oder Rechteinhaber ersetzt keine erforderliche Nutzungs- oder Verbreitungserlaubnis.

### Freigabe durch Gothic Tales

Für die digitale Umsetzung des Gothic-Tales-Pen-&-Paper-Systems in diesem Projekt liegt dem Projektverantwortlichen eine Freigabe des Gothic-Tales-Projekts vor.

Die Original-PDFs von [gothic-tales.de](https://gothic-tales.de/) werden nicht als Teil des Repositories verteilt. Die vorhandene Freigabe ist keine pauschale Übertragung der Urheberrechte und keine allgemeine Erlaubnis für Dritte, die Gothic-Tales-Inhalte unabhängig von diesem Projekt weiterzuverwenden.


### GitHub-Veröffentlichung und Foundry

Dieses System wird ausschließlich über GitHub bereitgestellt. Eine Aufnahme in die offizielle Foundry-Paketliste ist nicht vorgesehen. Das Projekt bleibt technisch ein Foundry-VTT-Spielsystem, ist aber kein offizielles Produkt von Foundry Gaming LLC und wird nicht von Foundry Gaming LLC geprüft, unterstützt oder vertrieben.

Die Veröffentlichung nur über GitHub hebt keine Urheber-, Marken- oder Lizenzanforderungen auf. Auch ein öffentliches GitHub-Repository und öffentlich abrufbare Release-Dateien gelten als Weitergabe.

### Fanprojekt und fehlende Verbindung zu Rechteinhabern

Dieses Foundry-System ist ein **nicht offizielles Fan- und Demoprojekt**. Abgesehen von der genannten Freigabe durch das Gothic-Tales-Projekt besteht keine geschäftliche Verbindung zu Alkimia Interactive, THQ Nordic, Nordic Games oder Foundry Gaming LLC. Das Projekt wird von diesen Parteien weder unterstützt noch autorisiert.

Vollständige Angaben zu Fremdinhalten, Inspirationen und optionalen Integrationen befinden sich in [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).

---

## Einschränkungen der Version 0.8.0

- **Demo- und Entwicklungsstand:** Version 0.8.0 ist spielbar, aber nicht als vollständig abgeschlossenes oder fehlerfreies Produkt zu verstehen.
- **Foundry VTT 14:** Entwickelt und geprüft wurde das System für Foundry VTT 14. Für andere oder zukünftige Hauptversionen besteht keine Kompatibilitätsgarantie.
- **Nur GitHub-Verteilung:** Installation und Updates erfolgen manuell oder über ein GitHub-Release. Eine Listung im offiziellen Foundry-Paketverzeichnis ist nicht vorgesehen.
- **Keine THQ-Karten in der öffentlichen Fassung:** Karten aus Gothic 1 Remake / Gothic (2026) und das darauf basierende Karten-Kompendium sind wegen fehlender Freigabe nicht Bestandteil der öffentlichen GitHub-Version.
- **Keine Original-PDFs:** Die Gothic-Tales-PDFs werden nicht mitgeliefert. Maßgeblich bleiben die Originalunterlagen auf gothic-tales.de.
- **KI-Übertragung kann Fehler enthalten:** Aus PDFs strukturierte Daten und KI-unterstützt erstellter Code können Übertragungs-, Interpretations- oder Implementierungsfehler enthalten.
- **Keine garantierte Modulkompatibilität:** Optionale Module wie Dice So Nice können unterstützt werden, eine fehlerfreie Zusammenarbeit mit allen Drittmodulen wird jedoch nicht garantiert.
- **Keine Migrationsgarantie:** Vor Updates müssen Welten, Actoren, Items, Einstellungen und eigene Kompendien gesichert werden.
- **Keine kommerzielle Freigabe:** Aus der Bereitstellung dieses Repositories folgt keine Erlaubnis zur kommerziellen Nutzung fremder Regel-, Bild-, Karten- oder Markeninhalte.
- **Eigene Verantwortung:** Wer das Repository weiterveröffentlicht, verändert oder als Release anbietet, muss selbst sicherstellen, dass nur rechtmäßig nutzbare Inhalte enthalten sind.

Diese Hinweise dienen der transparenten Projektdokumentation und sind keine Rechtsberatung.

---

## Haftung und Support

Gothic Tales VTT 0.8.0 wird als Demo ohne Gewährleistung bereitgestellt. Die Nutzung erfolgt auf eigene Verantwortung.

Vor Updates oder Tests sollten Sicherungskopien der Foundry-Welten, Actoren, Items und Einstellungen angelegt werden. Das Projekt übernimmt keine Garantie für Datenkompatibilität, Fehlerfreiheit oder die dauerhafte Kompatibilität mit zukünftigen Foundry-Versionen und Drittmodulen.

Fehlerberichte sollten nach Möglichkeit folgende Angaben enthalten:

- verwendete Foundry-Version,
- Gothic-Tales-VTT-Version,
- aktive Module,
- Schritte zum Reproduzieren,
- Browserkonsole oder Fehlermeldung,
- Screenshot des betroffenen Bereichs.

---

## Projekt und Autor

**Foundry-System:** Gothic Tales VTT  
**Version:** 0.8.0  
**Autor des Foundry-Systems:** Kuberia  
**Ursprung des Pen-&-Paper-Systems:** Gothic Tales  
**Website des Pen-&-Paper-Projekts:** [gothic-tales.de](https://gothic-tales.de/)  
**Community:** [Gothic-Tales-Discord](https://discord.gg/fsqV7TyAGA)  
**Repository:** [striker-sys/gothic-tales-vtt](https://github.com/striker-sys/gothic-tales-vtt)

Weitere projektspezifische Hinweise befinden sich in `LICENSE.txt`, [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md) und `RELEASE-.md`.
