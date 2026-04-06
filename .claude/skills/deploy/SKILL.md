---
name: deploy
description: Use when deploying a website to GitHub Pages, Vercel, or Netlify. Covers push workflow, domain setup, and live URL delivery.
---

# Deploy Skill

## Ziel

Website von `~/projects/[slug]/` live schalten. Immer kostenlos, immer HTTPS, immer innerhalb von 2 Minuten.

## Option 1: GitHub Pages (Standard)

Voraussetzung: `GITHUB_TOKEN` + `GITHUB_USER` in `.env` gesetzt.

```bash
# 1. Repo erstellen (GitHub API)
POST https://api.github.com/user/repos
{ name: "[slug]", private: false, auto_init: false }

# 2. Push
git init -b main
git add -A
git commit -m "Initial commit"
git remote add origin https://[TOKEN]@github.com/[USER]/[slug].git
git push -u origin main --force

# 3. Pages aktivieren
POST https://api.github.com/repos/[USER]/[slug]/pages
{ source: { branch: "main", path: "/" } }

# 4. Live URL
https://[USER].github.io/[slug]/
```

**Wartezeit:** 1–2 Minuten bis Pages aktiv ist.

## Option 2: Vercel (Schneller, Custom Domain möglich)

```bash
# Einmalig: Vercel CLI installieren
npm i -g vercel

# Deploy
cd ~/projects/[slug]
vercel --prod --yes

# Output: https://[slug]-[hash].vercel.app
```

Voraussetzung: `vercel login` einmalig ausgeführt.

## Option 3: Netlify Drop (Ohne CLI)

Nur als Fallback — manuell per Drag & Drop auf netlify.com/drop.

## Workflow für Alex Bot (`/deploy`-Command)

1. Prüfen: Existiert `~/projects/[slug]/index.html`?
2. GitHub Token vorhanden? → GitHub Pages
3. Vercel CLI verfügbar? → Vercel als Alternative
4. Kein Deployment möglich? → Fehlermeldung mit Anleitung

## Fehlerbehandlung

| Fehler | Ursache | Fix |
|---|---|---|
| Repository not found | Token fehlt oder falsch | GITHUB_TOKEN in .env prüfen |
| Push rejected | Repo existiert, anderer Inhalt | `--force` push |
| Pages 409 | Pages bereits aktiviert | URL trotzdem zurückgeben |
| Pages nicht erreichbar | Noch nicht fertig | 1–2 Min warten, dann nochmal prüfen |

## Output

Immer nur die Live-URL zurückgeben:
`✅ Live: https://[user].github.io/[slug]/`

Kein technisches Deployment-Log im Chat ausgeben.
