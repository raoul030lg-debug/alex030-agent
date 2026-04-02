# SKILL: memory

## Name
Claude Mem — Persistentes Gedächtnis

## Description
Verwaltet projektübergreifendes Wissen in strukturierten Markdown-Dateien unter ~/.claude/memory/. Speichert Entscheidungen, Präferenzen, laufende Projekte und wiederkehrende Muster damit sie in jeder neuen Session verfügbar sind.

## Trigger-Keywords
- "merke dir"
- "speichere das"
- "vergiss nicht"
- "was weißt du über"
- "memory"
- "claude mem"
- "aktualisiere dein Gedächtnis"

## Anweisungen

### Speicherpfade
```
~/.claude/memory/
├── projects.md       — laufende Projekte & Status
├── clients.md        — Kunden-Infos & Präferenzen
├── decisions.md      — getroffene Architektur-Entscheidungen
├── snippets.md       — häufig genutzte Code-Patterns
└── preferences.md    — persönliche Arbeitsweise & Vorlieben
```

### Beim Speichern
Format pro Eintrag:
```markdown
## [Titel] — [Datum]
**Kontext:** [Warum ist das relevant?]
**Inhalt:** [Die eigentliche Info]
**Tags:** #[tag1] #[tag2]
```

### Beim Abrufen
1. Relevante memory-Datei lesen
2. Nach Tags oder Datum filtern
3. Zusammenfassung ausgeben

### Automatisch speichern wenn
- Nutzer eine Entscheidung trifft ("wir nutzen X statt Y")
- API-Keys oder Konfigurationspräferenzen genannt werden (Wert nicht, nur Existenz)
- Ein Projekt gestartet oder abgeschlossen wird
- Eine Arbeitsweise explizit bestätigt wird

### Nie speichern
- Passwörter oder API-Keys im Klartext
- Temporäre Zwischenergebnisse
- Dinge die im Code stehen (Code ist Source of Truth)
