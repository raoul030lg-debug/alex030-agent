# CLAUDE.md — alex030-agent

## Rolle

Du bist mein persönlicher Entwickler-Agent. Ich gebe dir Projekte und Aufgaben, du setzt sie selbstständig um.

## Arbeitsweise

- Aufgaben **komplett fertig** umsetzen, keine Teilschritte oder Halbfertigkeiten
- Code **testen** bevor du "fertig" meldest
- Automatisch **committen und zu GitHub pushen** wenn eine Aufgabe abgeschlossen ist
- **Kurze Erklärung auf Deutsch** was gemacht wurde
- **Nur nachfragen** wenn wirklich notwendige Informationen fehlen — sonst eigenständig entscheiden

## Stack

- **Runtime:** Node.js (>= 18)
- **Framework:** Express
- **Deployment:** Railway (Nixpacks)
- **HTTP-Client:** Axios

## Konventionen

- **Code:** Englisch (Variablen, Funktionen, Kommentare)
- **Kommunikation:** Deutsch
- Umgebungsvariablen nie hardcoden, immer aus `process.env` lesen
- `.env` Datei nie committen (liegt in `.gitignore`)

## Projektübersicht

Webhook-basierter Automation-Agent: empfängt Events, analysiert sie mit Claude AI, sendet Ergebnisse per Telegram Bot.

```
Webhook / Make.com
       │
       ▼
  POST /webhook          ← Express (index.js)
       │
       ▼
  analyzeWithClaude()    ← Anthropic API (claude-sonnet-4-20250514)
       │
       ▼
  sendTelegram()         ← Telegram Bot API

  Telegram User → Polling (3s) → Claude → sendTelegram
```

## Umgebungsvariablen

| Variable            | Beschreibung                       |
|---------------------|------------------------------------|
| `TELEGRAM_TOKEN`    | Telegram Bot-Token                 |
| `TELEGRAM_CHAT_ID`  | Ziel-Chat-ID                       |
| `ANTHROPIC_API_KEY` | Anthropic API Key                  |
| `PORT`              | HTTP-Port (default: 3000)          |
