# SKILL: superpowers

## Name
Superpowers — Denken vor Bauen

## Description
Aktiviert einen zweistufigen Modus: erst gründlich durchdenken (THINK), dann erst umsetzen (BUILD). Verhindert vorschnelle Lösungen und stellt sicher dass der richtige Weg gewählt wird, nicht nur der schnellste.

## Trigger-Keywords
- "superpowers"
- "denk nach bevor du baust"
- "analysiere zuerst"
- "was ist der beste Ansatz"
- bei komplexen oder riskanten Aufgaben automatisch

## Anweisungen

### THINK-Phase (immer zuerst)

#### 1. Problem verstehen
- Was genau soll gelöst werden?
- Was ist der Ist-Zustand, was der Soll-Zustand?
- Gibt es Randbedingungen oder Constraints?

#### 2. Optionen evaluieren (min. 2 Ansätze)
Für jeden Ansatz:
```
Ansatz A: [Name]
+ Vorteile: ...
- Nachteile: ...
~ Aufwand: [gering/mittel/hoch]
```

#### 3. Entscheidung begründen
"Ich wähle Ansatz [X] weil [konkrete Begründung]."

#### 4. Risiken benennen
- Was kann schiefgehen?
- Wie wird es erkannt?
- Fallback wenn es schiefgeht?

### BUILD-Phase (erst nach THINK)
- Plan aus GSD-Skill anwenden
- Schrittweise umsetzen
- Nach jedem kritischen Schritt kurz validieren

### Ausgabe-Format
```
## THINK
**Problem:** ...
**Optionen:**
  A) ... (+/-/Aufwand)
  B) ... (+/-/Aufwand)
**Entscheidung:** Ansatz A, weil ...
**Risiken:** ...

## BUILD
[Umsetzung beginnt]
```

### Wann NICHT anwenden
- Triviale Aufgaben (< 5 Minuten, klar definiert)
- Wenn Nutzer explizit "einfach machen" sagt
