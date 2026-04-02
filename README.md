# alex030-agent

Ein Node.js Automation-Agent, der Webhooks empfängt, Events mit Claude AI analysiert und Ergebnisse per Telegram verschickt.

## Features

- **Webhook-Empfang** — nimmt Events von Make.com oder beliebigen HTTP-Clients entgegen
- **Claude-Analyse** — analysiert Events auf Deutsch und gibt STATUS / PROBLEM / AKTION zurück
- **Telegram Bot** — sendet Analysen und antwortet auf Chat-Nachrichten
- **Health Check** — `GET /` zeigt Uptime und Agent-Status

## Setup

### 1. Abhängigkeiten installieren

```bash
npm install
```

### 2. Umgebungsvariablen setzen

```bash
cp env.example .env
```

`.env` ausfüllen:

```env
TELEGRAM_TOKEN=dein_telegram_bot_token
TELEGRAM_CHAT_ID=deine_chat_id
ANTHROPIC_API_KEY=dein_anthropic_api_key
PORT=3000
```

### 3. Starten

```bash
npm start
```

## Deployment (Railway)

Das Projekt enthält eine `railway.json` und wird automatisch mit Nixpacks gebaut.

Umgebungsvariablen im Railway-Dashboard unter **Variables** eintragen.

## Endpunkte

| Methode | Pfad       | Beschreibung                        |
|---------|------------|-------------------------------------|
| GET     | `/`        | Health Check mit Uptime             |
| POST    | `/webhook` | Event entgegennehmen und analysieren|

### Webhook Beispiel

```bash
curl -X POST https://deine-railway-url/webhook \
  -H "Content-Type: application/json" \
  -d '{"type": "test", "message": "Testlauf"}'
```

## Telegram-Befehle

| Befehl            | Funktion                                            |
|-------------------|-----------------------------------------------------|
| `/task [Aufgabe]` | Neue Task erfassen (wird automatisch kategorisiert) |
| `/tasks`          | Alle Tasks anzeigen (offen + erledigt)              |
| `/done [Nr]`      | Task abhaken                                        |
| `/status`         | Agent-Status + Anzahl offener Tasks                 |
| `/help`           | Befehlsübersicht                                    |
| Freitext          | Wird direkt an Claude weitergeleitet                |

### Kategorien

Tasks werden automatisch kategorisiert: `website`, `logo`, `gbp`, `lead`, `seo`, `content`, `other`

Tasks werden in `.claude/memory/tasks.md` gespeichert.
