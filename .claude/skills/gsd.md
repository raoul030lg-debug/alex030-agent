# SKILL: gsd

## Name
GSD — Get Shit Done (Task-Planung)

## Description
Strukturiert jede Aufgabe in klare, ausführbare Schritte bevor mit dem Bauen begonnen wird. Verhindert blinde Aktionismus, stellt sicher dass das Ziel verstanden ist und der Plan steht.

## Trigger-Keywords
- "plane das"
- "was ist der Plan"
- "gsd"
- "task breakdown"
- "zerlege die Aufgabe"
- vor jeder größeren Implementierung automatisch anwenden

## Anweisungen

### Wann anwenden
Automatisch bei Aufgaben die mehr als 3 Schritte benötigen oder länger als 15 Minuten dauern würden.

### GSD-Prozess

#### Phase 1: VERSTEHEN (vor allem anderen)
Beantworten:
1. Was ist das genaue Ziel? (Output in einem Satz)
2. Was ist der Definition of Done? (Wann ist es fertig?)
3. Welche Infos fehlen noch? (Jetzt nachfragen, nicht mittendrin)
4. Was sind mögliche Stolpersteine?

#### Phase 2: PLANEN
Task-Liste erstellen:
```
[ ] Schritt 1 — [konkrete Aktion] → [erwartetes Ergebnis]
[ ] Schritt 2 — ...
[ ] Schritt N — Test: [wie wird Erfolg verifiziert]
[ ] Deploy/Commit/Liefern
```

Regeln:
- Jeder Schritt max. 30 Minuten
- Jeder Schritt hat ein messbares Ergebnis
- Test ist immer vorletzter Schritt
- Liefern ist immer letzter Schritt

#### Phase 3: AUSFÜHREN
- Schritte der Reihe nach abarbeiten
- Nach jedem Schritt: `[x]` setzen
- Bei Blockers: sofort kommunizieren, nicht weiterarbeiten

#### Phase 4: ABSCHLIESSEN
- Testergebnis dokumentieren
- Commit + Push
- Kurze Zusammenfassung auf Deutsch

### Output
Plan als Markdown-Checklist, dann direkt mit Ausführung beginnen
