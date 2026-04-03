# TikTok Faceless Video Skill

## Übersicht
Generiert virale TikTok-Scripts für Faceless Videos in der Nische **AI Storytelling / Dark Fantasy / Mystery** und sendet sie zur automatischen Produktion an die BigMotion API.

## Befehle

| Befehl | Beschreibung |
|--------|-------------|
| `/video [Thema]` | Script generieren + an BigMotion senden |
| `/videos` | Alle generierten Videos anzeigen |
| `/videoidea` | 5 virale Ideen für die Nische generieren |

## Script-Regeln

- **Hook** in den ersten 2 Sekunden (Schock, Frage, mysteriöser Fakt)
- **Länge:** 30–60 Sekunden gesprochen (~80–150 Wörter)
- **Untertitel-freundlich:** kurze, klare Sätze
- **Cliffhanger** am Ende — macht Lust auf mehr
- **Ton:** geheimnisvoll, packend, leicht bedrohlich
- **Sprache:** Englisch

## Script-Format

```
TITEL: [catchy Titel]
HOOK: [erste 2 Sekunden]
SCRIPT:
[vollständiges Skript]
CLIFFHANGER: [letzter Satz]
HASHTAGS: [5–8 relevante Hashtags]
```

## Nischen-Kategorien

- **AI Storytelling** — KI-generierte Geschichten, was wenn KI X passiert wäre
- **Dark Fantasy** — düstere Welten, Magie, verborgene Wahrheiten
- **Mystery** — ungelöste Rätsel, Verschwörungen, paranormale Phänomene

## BigMotion API

- Endpoint: `POST https://api.bigmotion.ai/v1/videos`
- Style: `dark_fantasy`
- Format: `tiktok`
- Auto-Post: aktiviert
- Key: `BIGMOTION_API_KEY` in `.env`

## Video Log

Alle Videos werden gespeichert in: `.claude/memory/videos.md`

Format: `- #Nr [Thema] Titel | Status: generiert/script_only | Datum`

## Status-Werte

| Status | Bedeutung |
|--------|-----------|
| `generiert` | Script erstellt + an BigMotion gesendet |
| `script_only` | Script erstellt, BigMotion nicht erreichbar |
