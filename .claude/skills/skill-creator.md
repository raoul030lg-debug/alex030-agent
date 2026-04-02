# SKILL: skill-creator

## Name
Skill Creator — Neue Skills selbst bauen

## Description
Erstellt neue SKILL.md Dateien nach dem Standard-Format. Analysiert eine beschriebene Aufgabe und generiert daraus einen vollständigen, wiederverwendbaren Skill.

## Trigger-Keywords
- "erstelle einen neuen Skill"
- "baue einen Skill für"
- "skill-creator"
- "neuer Skill"
- "füge Skill hinzu"

## Anweisungen

### Input sammeln
- Skill-Name (kebab-case, z. B. `email-writer`)
- Was soll der Skill können? (1–3 Sätze)
- Typische Eingaben des Nutzers
- Gewünschter Output
- Besondere Regeln oder Einschränkungen?

### SKILL.md Template
```markdown
# SKILL: [name]

## Name
[Lesbarer Name]

## Description
[2–3 Sätze was der Skill tut, für wen und warum er nützlich ist]

## Trigger-Keywords
- "[keyword 1]"
- "[keyword 2]"
- "[weitere natürliche Formulierungen]"

## Anweisungen

### Input sammeln (nur nachfragen wenn nicht angegeben)
- [Variable 1]: [Beschreibung]
- [Variable 2]: [Beschreibung]

### [Hauptprozess-Schritt 1]
[Detaillierte Anweisungen]

### [Hauptprozess-Schritt 2]
[Detaillierte Anweisungen]

### Qualitätsregeln
- [Regel 1]
- [Regel 2]

### Output
[Beschreibung was am Ende geliefert wird, in welchem Format]
```

### Nach dem Erstellen
1. Datei speichern unter `~/.claude/skills/[name].md`
2. Skill in `~/.claude/skills/INDEX.md` eintragen
3. Kurze Bestätigung ausgeben mit Trigger-Keywords

### Qualitätskriterien für einen guten Skill
- Trigger-Keywords sind natürliche Formulierungen (wie ein Nutzer wirklich spricht)
- Anweisungen sind so konkret dass kein Nachdenken nötig ist
- Output ist klar definiert
- Edge Cases sind berücksichtigt
