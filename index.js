require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const mem    = require('./memory');
const skills = require('./skills');
const tools  = require('./tools');

// Claude Code Binary — voller Pfad für zuverlässige Ausführung in PM2/exec
const CLAUDE_BIN = ['/usr/local/bin/claude', '/usr/bin/claude']
  .find(p => fs.existsSync(p)) || 'claude';

const app = express();
app.use(express.json());

const TELEGRAM_TOKEN   = process.env.TELEGRAM_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const BIGMOTION_API_KEY = process.env.BIGMOTION_API_KEY;
const GITHUB_TOKEN     = process.env.GITHUB_TOKEN;
const GITHUB_USER      = process.env.GITHUB_USER;

const TASKS_FILE  = path.join(__dirname, '.claude/memory/tasks.md');
const IDEAS_FILE  = path.join(__dirname, '.claude/memory/ideas.md');
const VIDEOS_FILE = path.join(__dirname, '.claude/memory/videos.md');

// ── Datei-Helfer ─────────────────────────────────────────────
function ensureFile(filePath, defaultContent) {
  if (!fs.existsSync(filePath)) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, defaultContent);
  }
}

// ── Tasks ────────────────────────────────────────────────────
function parseTasks() {
  ensureFile(TASKS_FILE, '# Tasks\n\n');
  return fs.readFileSync(TASKS_FILE, 'utf8').split('\n')
    .map(l => l.match(/^- \[([ x])\] #(\d+) \[(\w+)\] (.+?) \((.+?)\)$/))
    .filter(Boolean)
    .map(m => ({ done: m[1]==='x', nr: parseInt(m[2]), category: m[3], text: m[4], date: m[5] }));
}

function saveTasks(tasks) {
  ensureFile(TASKS_FILE, '# Tasks\n\n');
  const lines = ['# Tasks', '', '<!-- - [ ] #Nr [Kategorie] Aufgabe (Datum) -->', ''];
  for (const t of tasks)
    lines.push(`- [${t.done ? 'x' : ' '}] #${t.nr} [${t.category}] ${t.text} (${t.date})`);
  fs.writeFileSync(TASKS_FILE, lines.join('\n') + '\n');
}

function nextTaskNr(tasks) {
  return tasks.length === 0 ? 1 : Math.max(...tasks.map(t => t.nr)) + 1;
}

// ── Ideen ────────────────────────────────────────────────────
function parseIdeas() {
  ensureFile(IDEAS_FILE, '# Ideen\n\n');
  return fs.readFileSync(IDEAS_FILE, 'utf8').split('\n')
    .map(l => l.match(/^- #(\d+) (.+?) \((.+?)\)$/))
    .filter(Boolean)
    .map(m => ({ nr: parseInt(m[1]), text: m[2], date: m[3] }));
}

function saveIdea(text) {
  ensureFile(IDEAS_FILE, '# Ideen\n\n');
  const ideas = parseIdeas();
  const nr = ideas.length === 0 ? 1 : Math.max(...ideas.map(i => i.nr)) + 1;
  fs.appendFileSync(IDEAS_FILE, `- #${nr} ${text} (${new Date().toLocaleDateString('de-DE')})\n`);
  return nr;
}

// ── Videos ───────────────────────────────────────────────────
function parseVideos() {
  ensureFile(VIDEOS_FILE, '# Videos\n\n');
  return fs.readFileSync(VIDEOS_FILE, 'utf8').split('\n')
    .map(l => l.match(/^- #(\d+) \[(.+?)\] (.+?) \| Status: (.+?) \| (.+?)$/))
    .filter(Boolean)
    .map(m => ({ nr: parseInt(m[1]), topic: m[2], title: m[3], status: m[4], date: m[5] }));
}

function saveVideoLog(entry) {
  ensureFile(VIDEOS_FILE, '# Videos\n\n');
  const videos = parseVideos();
  const nr = videos.length === 0 ? 1 : Math.max(...videos.map(v => v.nr)) + 1;
  fs.appendFileSync(VIDEOS_FILE,
    `- #${nr} [${entry.topic}] ${entry.title} | Status: ${entry.status} | ${entry.date}\n`);
  return nr;
}

// ── Telegram ─────────────────────────────────────────────────
async function sendTelegram(message, chatId) {
  // Telegram Markdown v1 hat max 4096 Zeichen
  const text = message.slice(0, 4000);
  try {
    await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      chat_id: chatId || TELEGRAM_CHAT_ID,
      text,
      parse_mode: 'Markdown',
    });
  } catch (err) {
    // Retry ohne Markdown wenn Formatierungsfehler
    try {
      await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
        chat_id: chatId || TELEGRAM_CHAT_ID,
        text: text.replace(/[*_`~]/g, ''),
      });
    } catch (e) {
      console.error('Telegram error:', e.response?.data?.description || e.message);
    }
  }
}

// ── Brain Vault ───────────────────────────────────────────────
const VAULT_DIR = path.join(process.env.HOME, '030-Digital-Brain');
const VAULT_LOG = path.join(VAULT_DIR, 'log.md');
const VAULT_INDEX = path.join(VAULT_DIR, 'index.md');

function loadVault() {
  const files = ['CLAUDE.md', 'memory.md', 'knowledge-base.md'];
  return files.map(f => {
    const p = path.join(VAULT_DIR, f);
    try {
      if (!fs.existsSync(p)) return '';
      return `\n\n--- ${f} ---\n${fs.readFileSync(p, 'utf8')}`;
    } catch { return ''; }
  }).join('');
}

// Wiki-Log: append-only
function wikiLog(typ, beschreibung) {
  try {
    const datum = new Date().toISOString().slice(0, 10);
    const eintrag = `\n## [${datum}] ${typ} | ${beschreibung}\n`;
    fs.appendFileSync(VAULT_LOG, eintrag);
  } catch (e) { console.error('wikiLog error:', e.message); }
}

// Wiki-Index neu generieren
function rebuildIndex() {
  try {
    const datum = new Date().toISOString().slice(0, 10);
    const wissenDir = path.join(VAULT_DIR, 'wissen');
    const kundenAktivDir = path.join(VAULT_DIR, 'kunden/aktiv');
    const leadsDir = path.join(VAULT_DIR, 'kunden/leads');

    const wissenFiles = fs.existsSync(wissenDir)
      ? fs.readdirSync(wissenDir).filter(f => f.endsWith('.md'))
      : [];
    const kundenFiles = fs.existsSync(kundenAktivDir)
      ? fs.readdirSync(kundenAktivDir).filter(f => f.endsWith('.md'))
      : [];
    const leadFiles = fs.existsSync(leadsDir)
      ? fs.readdirSync(leadsDir).filter(f => f.endsWith('.md'))
      : [];

    const wissenTable = wissenFiles.map(f => {
      const name = f.replace('.md', '');
      return `| [wissen/${f}](wissen/${f}) | ${name.charAt(0).toUpperCase() + name.slice(1)} |`;
    }).join('\n');

    const kundenTable = kundenFiles.map(f => {
      try {
        const content = fs.readFileSync(path.join(kundenAktivDir, f), 'utf8');
        const branche = (content.match(/\*\*Branche:\*\* (.+)/) || [])[1] || '—';
        return `| [kunden/aktiv/${f}](kunden/aktiv/${f}) | ${branche} | aktiv |`;
      } catch { return `| kunden/aktiv/${f} | — | aktiv |`; }
    }).join('\n');

    const leadTable = leadFiles.map(f =>
      `| [kunden/leads/${f}](kunden/leads/${f}) | Lead |`
    ).join('\n');

    const content = `# 030 Digital Brain — Index\n\nAutomatisch gepflegt von Alex. Letzte Aktualisierung: ${datum}.\n\n---\n\n## Kern-Dokumente\n\n| Datei | Beschreibung |\n|---|---|\n| [CLAUDE.md](CLAUDE.md) | Raoul, Preise, Ziele, Arbeitsweise |\n| [memory.md](memory.md) | Laufende Notizen, Entscheidungen |\n| [knowledge-base.md](knowledge-base.md) | Erprobtes Wissen |\n| [log.md](log.md) | Änderungslog |\n\n---\n\n## Wissen\n\n| Datei | Beschreibung |\n|---|---|\n${wissenTable}\n\n---\n\n## Aktive Kunden (${kundenFiles.length})\n\n| Datei | Branche | Status |\n|---|---|---|\n${kundenTable || '_keine_'}\n\n---\n\n## Leads (${leadFiles.length})\n\n| Datei | Typ |\n|---|---|\n${leadTable || '_keine_'}\n\n---\n\n## Skills\n\n\`skills/\` — 1.800+ Skills aus Clowdex, on-demand nach Kategorie.\n`;

    fs.writeFileSync(VAULT_INDEX, content);
    wikiLog('index', `Index neu generiert — ${wissenFiles.length} Wissen, ${kundenFiles.length} Kunden, ${leadFiles.length} Leads`);
  } catch (e) { console.error('rebuildIndex error:', e.message); }
}

// Wiki-Seite erstellen oder updaten
async function wikiUpsert(thema, inhalt, unterordner = 'wissen') {
  try {
    const slug = thema.toLowerCase().replace(/[^a-z0-9äöüß]+/g, '-').replace(/[äöüß]/g, c =>
      ({ ä:'ae', ö:'oe', ü:'ue', ß:'ss' })[c] || c);
    const dir = path.join(VAULT_DIR, unterordner);
    fs.mkdirSync(dir, { recursive: true });
    const filePath = path.join(dir, `${slug}.md`);
    const isNew = !fs.existsSync(filePath);
    if (isNew) {
      fs.writeFileSync(filePath, `# ${thema}\n\n${inhalt}`);
      wikiLog('create', `${unterordner}/${slug}.md — neu erstellt`);
    } else {
      const existing = fs.readFileSync(filePath, 'utf8');
      fs.writeFileSync(filePath, existing + `\n\n---\n_Update ${new Date().toISOString().slice(0,10)}_\n\n${inhalt}`);
      wikiLog('update', `${unterordner}/${slug}.md — ergänzt`);
    }
    rebuildIndex();
    return filePath;
  } catch (e) { console.error('wikiUpsert error:', e.message); return null; }
}

// Wiki-Lint: auf Widersprüche und fehlende Felder prüfen
async function wikiLint() {
  const issues = [];
  try {
    // Kunden ohne Pflichtfelder
    const aktivDir = path.join(VAULT_DIR, 'kunden/aktiv');
    if (fs.existsSync(aktivDir)) {
      for (const f of fs.readdirSync(aktivDir).filter(f => f.endsWith('.md'))) {
        const content = fs.readFileSync(path.join(aktivDir, f), 'utf8');
        if (!content.includes('**Branche:**')) issues.push(`⚠️ ${f}: Branche fehlt`);
        if (!content.includes('**Telefon:**')) issues.push(`⚠️ ${f}: Telefon fehlt`);
        if (!content.includes('**Stadt:**'))   issues.push(`⚠️ ${f}: Stadt fehlt`);
      }
    }
    // Doppelte Einträge erkennen
    const allDirs = ['kunden/aktiv', 'kunden/leads', 'kunden/abgeschlossen'];
    const allNames = [];
    for (const d of allDirs) {
      const dir = path.join(VAULT_DIR, d);
      if (fs.existsSync(dir)) {
        for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.md'))) {
          if (allNames.includes(f)) issues.push(`⚠️ Doppelter Eintrag: ${f}`);
          else allNames.push(f);
        }
      }
    }
    wikiLog('lint', `Lint-Check — ${issues.length} Issues gefunden`);
    return issues;
  } catch (e) { return [`❌ Lint-Fehler: ${e.message}`]; }
}

// ── Kunden-Memory ─────────────────────────────────────────────
const KUNDEN_DIR = path.join(process.env.HOME, '030-Digital-Brain/kunden/aktiv');

function saveKundeVault(felder) {
  const { kundenname, branche, telefon, stadt } = felder;
  if (!kundenname) return;
  try {
    fs.mkdirSync(KUNDEN_DIR, { recursive: true });
    const slug = kundenname.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const filePath = path.join(KUNDEN_DIR, `${slug}.md`);
    const existing = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
    // Nicht überschreiben wenn schon mehr Infos drin
    const lines = [
      `# ${kundenname}`,
      `**Datum:** ${new Date().toLocaleDateString('de-DE')}`,
      branche  ? `**Branche:** ${branche}`   : null,
      telefon  ? `**Telefon:** ${telefon}`   : null,
      stadt    ? `**Stadt:** ${stadt}`       : null,
      '',
      '## Projekte',
      '- [ ] Website in Arbeit',
    ].filter(l => l !== null).join('\n');
    if (!existing) {
      fs.writeFileSync(filePath, lines);
      wikiLog('create', `kunden/aktiv/${slug}.md — Neuer Kunde: ${kundenname}`);
      rebuildIndex();
    } else {
      let updated = existing;
      if (branche  && !existing.includes('**Branche:**'))  updated += `\n**Branche:** ${branche}`;
      if (telefon  && !existing.includes('**Telefon:**'))  updated += `\n**Telefon:** ${telefon}`;
      if (stadt    && !existing.includes('**Stadt:**'))    updated += `\n**Stadt:** ${stadt}`;
      if (updated !== existing) {
        fs.writeFileSync(filePath, updated);
        wikiLog('update', `kunden/aktiv/${slug}.md — Felder ergänzt`);
      }
    }
  } catch (e) { console.error('saveKundeVault error:', e.message); }
}

function loadKundeVault(kundenname) {
  if (!kundenname) return '';
  try {
    const slug = kundenname.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const filePath = path.join(KUNDEN_DIR, `${slug}.md`);
    return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
  } catch { return ''; }
}

// ── System Prompt ─────────────────────────────────────────────
function buildSystemPrompt() {
  const vault = loadVault();
  const designSystem = (() => {
    try {
      const p = path.join(process.env.HOME, '030-Digital-Brain/wissen/design-system.md');
      return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
    } catch { return ''; }
  })();

  return `Du bist Alex, der KI-Agent von 030 Digital Berlin.
Du arbeitest für Raoul Hübenbecker und hilfst ihm bei Kundengesprächen, Website-Builds und dem Tagesgeschäft.

PERSÖNLICHKEIT:
- Professionell aber menschlich — wie ein kompetenter junger Berliner Dienstleister.
- Duzen ist okay. Kurze, klare Sätze. Max 3-4 Sätze pro Antwort.
- Selbstbewusst und kompetent. Direkt antworten, nicht ausweichen.
- Max 1 Emoji pro Nachricht, nur wenn passend.
- Kein Slang. Kein Roboter-Sprech.
- NIE: "Ich werde nun", "Selbstverständlich", "Sehr geehrter", "Gerne", "Natürlich", "Zusammenfassend", "Wie kann ich helfen?"
- Gut: "Hey! Klar, ich baue dir die Website. Dauert ca. 3 Minuten. 👍"
- Schlecht: "Ey Bruder krass 🔥🔥🔥" / "Sehr geehrter Kunde, ich werde Ihre Anfrage bearbeiten."

PREISE (auswendig kennen):
- Website: ab 499 €
- Logo: ab 149 €
- Google Business Setup: 99 €
- Social Media Paket: 199 €/Monat
- Starter-Paket (Website+Logo+Google): 799 €
- Komplett (Starter+Social+Updates): 249 €/Monat
- Wartung & Hosting: 29 €/Monat
- Zahlung: Überweisung oder PayPal/Stripe
- 10% Rabatt bei Empfehlung

EINWÄNDE BEHANDELN:
- "zu teuer" → Klassische Agentur kostet 3.000–8.000€. Wir liefern in 24h für 499€.
- "brauche ich nicht" → Ohne Website findest dich kein Neukunde bei Google.
- "muss ich überlegen" → Kein Problem, ich melde mich in 2 Tagen nochmal.

KRITISCHE REGEL — NIEMALS BRECHEN:
- Sende NIEMALS rohen HTML/CSS/JS-Code als Telegram-Nachricht an den Nutzer
- Diese Regel betrifft NUR Telegram-Antworten — NICHT den internen Build-Prozess
- Website-Anfrage erkennen → sofort kurz bestätigen: "Baue gerade deine Website, dauert 2-3 Minuten 👍"
- Das Website-Dateisystem und den Build übernimmt ein separates System automatisch — du musst nichts weiter tun
- WICHTIG: Diese Regel bedeutet NICHT, dass du Websites ablehnst. Du baust sie, du sagst nur keinen Code in den Chat
${skills.loadSkills()}

=== DESIGN SYSTEM ===
${designSystem.slice(0, 2000)}
=== ENDE DESIGN SYSTEM ===

=== 030 DIGITAL BRAIN VAULT ===
${vault}
=== ENDE BRAIN VAULT ===`;
}

// ── Kimi API (Moonshot — Anthropic-compatible) ────────────────
const KIMI_API_KEY  = process.env.KIMI_API_KEY;
const KIMI_BASE_URL = process.env.KIMI_BASE_URL || 'https://api.moonshot.ai/anthropic';
const KIMI_MODEL    = process.env.KIMI_MODEL    || 'kimi-k2.5';

// Vault-Kern einmalig beim Start laden und cachen
let _vaultCache = null;
function getVaultCore() {
  if (_vaultCache) return _vaultCache;
  try {
    const claudeMd = fs.existsSync(path.join(VAULT_DIR, 'CLAUDE.md'))
      ? fs.readFileSync(path.join(VAULT_DIR, 'CLAUDE.md'), 'utf8') : '';
    const memoryMd = fs.existsSync(path.join(VAULT_DIR, 'memory.md'))
      ? fs.readFileSync(path.join(VAULT_DIR, 'memory.md'), 'utf8') : '';
    _vaultCache = `${claudeMd.slice(0, 2000)}\n\n${memoryMd.slice(0, 800)}`;
    return _vaultCache;
  } catch { return ''; }
}

// Basis-Kontext für Kimi
function buildKimiPrompt() {
  const vaultCore = getVaultCore();
  return `Du bist Alex, der KI-Agent von 030 Digital Berlin.

IDENTITÄT:
- Inhaber: Raoul Hübenbecker
- Agentur: 030 Digital — Websites für Berliner Handwerker
- Slogan: "Deine Website in 24 Stunden"

TON:
- Professionell aber menschlich — Berliner Dienstleister-Stil
- Duzen ist okay
- Kurze, klare Sätze. Max 3-4 pro Antwort.
- Immer Deutsch
- Max 1 Emoji pro Nachricht
- Kein Slang, kein Roboter-Sprech
- NIE: "Ich werde nun", "Selbstverständlich", "Gerne", "Sehr geehrter"

PREISE:
- Website: 499 €
- Logo: 149 €
- Branding-Paket: 349 €
- Google Business: 99 €
- Social Media: 199 €/Monat
- Zahlung: Überweisung + PayPal/Stripe
- 10% Rabatt bei Empfehlung

EINWÄNDE:
- "zu teuer" → Klassische Agentur: 3.000–8.000 €. Wir: 499 € in 24h.
- "brauche ich nicht" → Ohne Website findet dich kein Neukunde bei Google.
- "muss ich überlegen" → Kein Problem, ich melde mich in 2 Tagen.

KRITISCH: Sende NIEMALS HTML, CSS oder JavaScript-Code als Text.

=== BRAIN VAULT ===
${vaultCore}
=== ENDE ===`;
}

async function kimi(userMessage, history = []) {
  const response = await axios.post(`${KIMI_BASE_URL}/v1/messages`, {
    model: KIMI_MODEL,
    max_tokens: 600,
    system: buildKimiPrompt(),
    messages: [...history, { role: 'user', content: userMessage }],
  }, {
    headers: {
      'x-api-key': KIMI_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    timeout: 30000,
  });
  return response.data.content[0].text;
}

// Routing: Kimi für einfache Anfragen, Claude für komplexe
const KIMI_INTENTS = new Set([
  'chat', 'preis_anfrage', 'logo_anfrage', 'google_anfrage',
  'social_anfrage', 'termin_anfrage', 'empfehlung_anfrage', 'rechnung_anfrage',
]);
const CLAUDE_INTENTS = new Set([
  'website_erstellen', 'video_script', 'task_speichern', 'idee_speichern',
]);

function routeModel(intent) {
  if (CLAUDE_INTENTS.has(intent)) return 'claude';
  if (KIMI_INTENTS.has(intent))   return 'kimi';
  // Fallback: kurze Nachrichten → Kimi, lange → Claude
  return 'kimi';
}

// ── Modell-State ──────────────────────────────────────────────
let activeModel = 'claude'; // Standard: Claude

// ── Claude API ────────────────────────────────────────────────
async function claude(userMessage, maxTokens = 1200, history = []) {
  const response = await axios.post('https://api.anthropic.com/v1/messages', {
    model: 'claude-sonnet-4-6',
    max_tokens: maxTokens,
    system: buildSystemPrompt(),
    messages: [...history, { role: 'user', content: userMessage }],
  }, {
    headers: {
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    timeout: 120000,
  });
  return response.data.content[0].text;
}

// ── Intent Detection (unified) ────────────────────────────────
async function detectIntent(text) {
  try {
    const response = await axios.post('https://api.anthropic.com/v1/messages', {
      model: 'claude-sonnet-4-6',
      max_tokens: 400,
      system: 'You are an intent classifier. Always respond with valid JSON only. No explanation, no markdown.',
      messages: [{
        role: 'user',
        content: `Classify this message and extract all available fields.

Intents:
- website_erstellen: user wants a website/landing page/homepage built for a business
- preis_anfrage: user asks about prices, costs, offers (was kostet, preis, angebot, wie viel)
- logo_anfrage: user asks about logo design service
- google_anfrage: user asks about Google Business setup
- social_anfrage: user asks about social media package
- termin_anfrage: user wants to schedule an appointment or callback
- empfehlung_anfrage: user mentions referral or recommendation (Empfehlung, empfohlen, Rabatt)
- rechnung_anfrage: user asks about payment, invoice, how to pay
- video_script: user wants a TikTok/video script
- task_speichern: user explicitly wants to save a task or todo item
- idee_speichern: user wants to save an idea
- chat: general conversation, question, or anything else

Branchen (if website_erstellen): klempner, barbershop, restaurant, kosmetik, elektriker, maler, other

Message: "${text}"

Respond with this exact JSON structure:
{
  "intent": "website_erstellen|preis_anfrage|logo_anfrage|google_anfrage|social_anfrage|termin_anfrage|empfehlung_anfrage|rechnung_anfrage|video_script|task_speichern|idee_speichern|chat",
  "felder": {
    "kundenname": null,
    "branche": null,
    "telefon": null,
    "stadt": null,
    "thema": null,
    "tasktext": null
  }
}`,
      }],
    }, {
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      timeout: 12000,
    });

    const raw = response.data.content[0].text.trim();
    // JSON aus der Antwort extrahieren (robust gegen Markdown-Wrapping)
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : { intent: 'chat', felder: {} };
  } catch (err) {
    console.error('Intent detection error:', err.message);
    return { intent: 'chat', felder: {} };
  }
}

// Skill-Datei für Branche laden
function loadBrancheSkill(branche) {
  if (!branche) return '';
  const p = path.join(__dirname, `.claude/skills/${branche}/SKILL.md`);
  try { return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : ''; }
  catch { return ''; }
}

// ── Website bauen via direkter API ───────────────────────────
// context: { kundenname, branche, telefon, stadt, rawText }
async function autoBuildWebsite(context, chatId) {
  const { kundenname, branche, telefon, stadt, rawText } = context;

  const slugBase = [kundenname, branche, stadt]
    .filter(Boolean).join(' ')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50);
  const slug = slugBase || rawText.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40);
  const displayName = [kundenname, branche, stadt].filter(Boolean).join(' · ') || rawText;
  const projektDir  = path.join(tools.PROJECTS_DIR, slug);

  await sendTelegram(`⏳ Baue *${displayName}*...\nDauert ca. 1 Minute.`, chatId);

  // Branchenwissen laden
  const brancheSkill    = loadBrancheSkill(branche);
  const brancheWissen   = (() => {
    if (!branche) return '';
    const p = path.join(process.env.HOME, `030-Digital-Brain/wissen/${branche}.md`);
    try { return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : ''; } catch { return ''; }
  })();
  const designSystem    = (() => {
    const p = path.join(process.env.HOME, '030-Digital-Brain/wissen/design-system.md');
    try { return fs.existsSync(p) ? fs.readFileSync(p, 'utf8').slice(0, 2000) : ''; } catch { return ''; }
  })();

  // Branchen-Farben
  const branchenFarben = {
    klempner:   { primär: '#1E40AF', akzent: '#F97316', schrift: 'Inter, Roboto' },
    elektriker: { primär: '#1F2937', akzent: '#F59E0B', schrift: 'Inter, DM Sans' },
    maler:      { primär: '#FFFFFF', akzent: '#EA580C', schrift: 'Montserrat, Open Sans' },
    barbershop: { primär: '#0A0A0A', akzent: '#D4AF37', schrift: 'Playfair Display, Inter' },
    kosmetik:   { primär: '#FAF7F2', akzent: '#D4AF37', schrift: 'Cormorant Garamond, Lato' },
    restaurant: { primär: '#1A0F0A', akzent: '#C17A4A', schrift: 'Cormorant Garamond, Lato' },
  };
  const farben = branchenFarben[branche] || { primär: '#0A0A0A', akzent: '#2563EB', schrift: 'Inter, sans-serif' };

  const buildPrompt = `Du bist ein Senior UI/UX Engineer mit 10+ Jahren Erfahrung. Baue eine vollständige, professionelle Website.

AUFTRAG:
- Kundenname: ${kundenname || 'Unbekannt'}
- Branche: ${branche || 'Allgemein'}
- Telefon: ${telefon || 'auf Anfrage'}
- Stadt: ${stadt || 'Berlin'}

DESIGN-VORGABEN:
- Primärfarbe: ${farben.primär}
- Akzentfarbe: ${farben.akzent}
- Schriften: ${farben.schrift} (Google Fonts)
- Dark Background: #0A0A0A als Basis
- Glassmorphism Cards: backdrop-filter blur(20px), border rgba(255,255,255,0.08)
- GSAP von cdnjs für alle Animationen
- Custom Cursor (Dot + Follower) auf Desktop
- Sticky WhatsApp Button pulsierend unten rechts
- Mobile-First, vollständig responsive

PFLICHT-SECTIONS:
1. Hero — große Headline, CTAs, Trust-Badges (Jahre, Bewertungen)
2. Leistungen — 3-4 Cards mit 3D Tilt-Effekt
3. Warum wir — 3 USPs mit Icons
4. Referenzen / Galerie — 3 Beispiel-Projekte
5. Google Bewertungen — 3 Fake-Bewertungen (4-5 Sterne)
6. Kontakt — Telefon, WhatsApp, Adresse
7. Footer — Impressum, Datenschutz, Copyright

PFLICHT-ELEMENTE:
- WhatsApp CTA: https://wa.me/49${(telefon || '30123456').replace(/[^0-9]/g, '')}
- tel: Link für Telefonnummer
- Schema.org LocalBusiness JSON-LD
- Meta Description optimiert
- Open Graph Tags

GSAP ANIMATIONEN:
- Hero Entrance: staggered Badge→Headline→Sub→CTA→Trust
- ScrollTrigger auf allen Sektionen
- 3D Card Tilt: rotationY ±8°, transformPerspective 800
- Parallax Hero Background

VERBOTEN:
- Stock-Fotos — nur CSS-Gradients als Platzhalter
- Mehr als 3 Farben
- Lorem Ipsum — echter branchenspezifischer Inhalt
- Weißer Hintergrund

${brancheWissen ? `BRANCHEN-SPEZIFISCH:\n${brancheWissen.slice(0, 1000)}` : ''}
${brancheSkill  ? `SKILL-KONTEXT:\n${brancheSkill.slice(0, 800)}` : ''}
${designSystem  ? `DESIGN SYSTEM:\n${designSystem.slice(0, 1000)}` : ''}

Antworte NUR mit dem kompletten HTML Code. Kein Text davor oder danach. Kein Markdown. Keine Erklärungen.
Beginne direkt mit <!DOCTYPE html> und ende mit </html>.
CSS und JavaScript inline einbetten (<style> im <head>, <script> vor </body>).`;

  // Direkt API-Call — kein Subprocess
  (async () => {
    try {
      const response = await axios.post('https://api.anthropic.com/v1/messages', {
        model: 'claude-sonnet-4-6',
        max_tokens: 16000,
        messages: [{ role: 'user', content: buildPrompt }],
      }, {
        headers: {
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        timeout: 180000,
      });

      const output = response.data.content[0].text.trim();
      console.log(`BUILD output preview (${output.length} chars): ${output.slice(0, 120)}`);

      // HTML extrahieren — direkt oder aus Code-Block
      let html = null;
      if (output.startsWith('<!DOCTYPE') || output.startsWith('<html')) {
        html = output;
      } else {
        const htmlMatch = output.match(/```html\n?([\s\S]*?)```/) ||
                          output.match(/(<!DOCTYPE[\s\S]*?<\/html>)/i);
        if (htmlMatch) html = htmlMatch[1].trim();
      }

      if (!html) {
        const preview = output.slice(0, 300).replace(/\n/g, ' ');
        await sendTelegram(`❌ Build fehlgeschlagen — kein HTML in Response.\n\nAPI antwortete:\n\`${preview}\``, chatId);
        return;
      }

      // Projekt-Verzeichnis anlegen und Datei speichern
      fs.mkdirSync(projektDir, { recursive: true });
      fs.writeFileSync(path.join(projektDir, 'index.html'), html);

      mem.logActivity(`Website gebaut: ${slug}`);
      mem.saveProject({ name: slug, type: 'website', status: 'local', url: slug });
      wikiLog('create', `Website gebaut: ${slug} (${branche || 'allgemein'})`);

      // Browser öffnen
      exec(`open "${path.join(projektDir, 'index.html')}"`);

      // Deploy zu GitHub Pages wenn Token gesetzt
      let url = null;
      if (GITHUB_TOKEN && GITHUB_TOKEN !== 'PLACEHOLDER' && GITHUB_USER && GITHUB_USER !== 'PLACEHOLDER') {
        try {
          const pushResult = await tools.pushToGithub(projektDir, slug, GITHUB_TOKEN, GITHUB_USER);
          if (pushResult.success) {
            url = await tools.enableGithubPages(slug, GITHUB_TOKEN, GITHUB_USER);
          }
        } catch (deployErr) {
          console.error('Deploy error:', deployErr.message);
        }
      }

      if (url) {
        mem.saveProject({ name: slug, type: 'website', status: 'deployed', url });
        await sendTelegram(`✅ *${displayName}* Website ist live:\n${url}`, chatId);
      } else {
        await sendTelegram(
          `✅ *${displayName}* Website fertig!\n📁 \`~/projects/${slug}/\`\n\n_Deploy: GITHUB\\_TOKEN setzen für automatisches GitHub Pages Deployment._`,
          chatId
        );
      }
    } catch (err) {
      console.error('autoBuildWebsite error:', err.message);
      await sendTelegram(`❌ Build fehlgeschlagen: ${err.message.slice(0, 200)}`, chatId);
    }
  })();
  // Sofort zurückkehren — Telegram-Polling bleibt responsiv
}

async function autoGenerateContent(taskText, chatId) {
  const slug = taskText.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40);
  const filePath = path.join(tools.PROJECTS_DIR, `${slug}.md`);
  try {
    const content = await claude(`Schreibe einen vollständigen, professionellen Content-Text auf Deutsch für: "${taskText}"\n\nFormat: Markdown mit Überschriften, Absätzen und konkretem Inhalt.`, 2000);
    tools.writeFile(filePath, content);
    mem.logActivity(`Content erstellt: ${slug}`);
    await sendTelegram(`📝 *Content erstellt:*\n\n${content.slice(0, 800)}...\n\n📁 Gespeichert: \`${filePath}\``, chatId);
  } catch (err) {
    await sendTelegram(`❌ Content-Fehler: ${err.message}`, chatId);
  }
}

// ── Befehle ───────────────────────────────────────────────────
async function handleCommand(text, chatId) {

  // /run [Befehl]
  const runMatch = text.match(/^\/run\s+(.+)$/i);
  if (runMatch) {
    const cmd = runMatch[1].trim();
    await sendTelegram(`⚙️ Führe aus: \`${cmd}\``, chatId);
    const result = await tools.runCommand(cmd);
    mem.logActivity(`/run: ${cmd}`);
    await sendTelegram(
      `${result.success ? '✅' : '❌'} \`${cmd}\`\n\n\`\`\`\n${result.output}\n\`\`\``,
      chatId
    );
    return;
  }

  // /file [Pfad]
  const fileMatch = text.match(/^\/file\s+(.+)$/i);
  if (fileMatch) {
    const filePath = fileMatch[1].trim();
    const content = tools.readFile(filePath);
    if (!content) { await sendTelegram(`❌ Datei nicht gefunden: \`${filePath}\``, chatId); return; }
    await sendTelegram(`📄 *${filePath}*\n\n\`\`\`\n${content.slice(0, 3000)}\n\`\`\``, chatId);
    return;
  }

  // /build [Beschreibung]
  const buildMatch = text.match(/^\/build\s+(.+)$/i);
  if (buildMatch) {
    const desc = buildMatch[1].trim();
    mem.logActivity(`/build: ${desc}`);
    await sendTelegram(`🔍 Analysiere Anfrage...`, chatId);
    const { felder } = await detectIntent(desc);
    await autoBuildWebsite({ ...felder, rawText: desc }, chatId);
    return;
  }

  // /deploy [Projekt]
  const deployMatch = text.match(/^\/deploy\s+(.+)$/i);
  if (deployMatch) {
    const project = deployMatch[1].trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const projectDir = path.join(tools.PROJECTS_DIR, project);
    if (!fs.existsSync(projectDir)) {
      await sendTelegram(`❌ Projekt \`${project}\` nicht gefunden unter \`${tools.PROJECTS_DIR}\``, chatId);
      return;
    }
    if (!GITHUB_TOKEN || GITHUB_TOKEN === 'PLACEHOLDER') {
      await sendTelegram('❌ GITHUB_TOKEN nicht gesetzt.', chatId);
      return;
    }
    await sendTelegram(`🚀 Deploye *${project}*...`, chatId);
    const pushResult = await tools.pushToGithub(projectDir, project, GITHUB_TOKEN, GITHUB_USER);
    if (pushResult.success) {
      const pagesUrl = await tools.enableGithubPages(project, GITHUB_TOKEN, GITHUB_USER);
      await sendTelegram(`✅ *Deployed!*\n🌐 ${pagesUrl || `https://github.com/${GITHUB_USER}/${project}`}`, chatId);
      mem.logActivity(`Deployed: ${project}`);
    } else {
      await sendTelegram(`❌ Deploy fehlgeschlagen: ${pushResult.error}`, chatId);
    }
    return;
  }

  // /search [Query]
  const searchMatch = text.match(/^\/search\s+(.+)$/i);
  if (searchMatch) {
    const query = searchMatch[1].trim();
    await sendTelegram(`🔍 Recherchiere: *${query}*...`, chatId);
    try {
      const result = await claude(
        `Recherchiere und beantworte ausführlich auf Deutsch: "${query}"\n\nGib konkretes, strukturiertes Wissen mit Fakten, Quellen-Hinweisen und praktischen Empfehlungen.`,
        1500
      );
      mem.logActivity(`/search: ${query}`);
      await sendTelegram(`🔍 *${query}*\n\n${result}`, chatId);
    } catch (err) {
      await sendTelegram(`❌ Fehler: ${err.message}`, chatId);
    }
    return;
  }

  // /client [Name, Branche, Stadt]
  const clientMatch = text.match(/^\/client\s+(.+)$/i);
  if (clientMatch) {
    const parts = clientMatch[1].split(',').map(s => s.trim());
    const [name, industry = 'unbekannt', city = 'unbekannt'] = parts;
    mem.saveClient(name, industry, city);
    mem.logActivity(`Kunde angelegt: ${name}`);
    await sendTelegram(`✅ *Kunde gespeichert:*\n👤 ${name}\n🏢 ${industry}\n📍 ${city}`, chatId);
    return;
  }

  // /clients
  if (/^\/clients$/i.test(text)) {
    const clients = mem.getClients();
    if (clients.length === 0) { await sendTelegram('👥 Keine Kunden. Mit /client [Name, Branche, Stadt] hinzufügen.', chatId); return; }
    await sendTelegram(`👥 *Kunden (${clients.length})*\n\n${clients.join('\n')}`, chatId);
    return;
  }

  // /log
  if (/^\/log$/i.test(text)) {
    const log = mem.getActivityLog(15);
    if (log.length === 0) { await sendTelegram('📋 Noch keine Aktivitäten.', chatId); return; }
    await sendTelegram(`📋 *Letzte Aktivitäten:*\n\n${log.join('\n')}`, chatId);
    return;
  }

  // /task [Aufgabe]
  const taskMatch = text.match(/^\/task\s+(.+)$/i);
  if (taskMatch) {
    const taskText = taskMatch[1].trim();
    const tasks = parseTasks();
    const { intent, felder } = await detectIntent(taskText);
    const category = intent === 'website_erstellen' ? 'website'
                   : intent === 'video_script'      ? 'content'
                   : felder.branche                 ? felder.branche
                   : 'other';
    const nr = nextTaskNr(tasks);
    tasks.push({ done: false, nr, category, text: taskText, date: new Date().toLocaleDateString('de-DE') });
    saveTasks(tasks);
    mem.logActivity(`Task #${nr} angelegt: ${taskText}`);
    await sendTelegram(`✅ *Task #${nr} gespeichert*\n📂 \`${category}\` — ${taskText}`, chatId);
    if (intent === 'website_erstellen') {
      await sendTelegram(`🤖 Website-Aufgabe — direkt loslegen?\n→ /build ${taskText}`, chatId);
    }
    return;
  }

  // /tasks
  if (/^\/tasks$/i.test(text)) {
    const tasks = parseTasks();
    const open = tasks.filter(t => !t.done);
    const done = tasks.filter(t => t.done);
    if (tasks.length === 0) { await sendTelegram('📋 Keine Tasks. Mit /task [Aufgabe] hinzufügen.', chatId); return; }
    let msg = `📋 *Tasks — ${open.length} offen, ${done.length} erledigt*\n\n`;
    if (open.length > 0) {
      msg += '*Offen:*\n';
      for (const t of open) msg += `◻️ #${t.nr} \`[${t.category}]\` ${t.text}\n`;
    }
    if (done.length > 0) {
      msg += '\n*Erledigt:*\n';
      for (const t of done) msg += `✅ #${t.nr} ~~${t.text}~~\n`;
    }
    await sendTelegram(msg, chatId);
    return;
  }

  // /done [Nr]
  const doneMatch = text.match(/^\/done\s+(\d+)$/i);
  if (doneMatch) {
    const nr = parseInt(doneMatch[1]);
    const tasks = parseTasks();
    const task = tasks.find(t => t.nr === nr);
    if (!task) { await sendTelegram(`❌ Task #${nr} nicht gefunden.`, chatId); return; }
    if (task.done) { await sendTelegram(`ℹ️ Task #${nr} war bereits erledigt.`, chatId); return; }
    task.done = true;
    saveTasks(tasks);
    mem.logActivity(`Task #${nr} erledigt: ${task.text}`);
    await sendTelegram(`✅ *Task #${nr} erledigt!*\n_${task.text}_`, chatId);
    return;
  }

  // /idea [Idee]
  const ideaMatch = text.match(/^\/idea\s+(.+)$/i);
  if (ideaMatch) {
    const nr = saveIdea(ideaMatch[1].trim());
    await sendTelegram(`💡 *Idee #${nr} gespeichert:* ${ideaMatch[1].trim()}`, chatId);
    return;
  }

  // /ideas
  if (/^\/ideas$/i.test(text)) {
    const ideas = parseIdeas();
    if (ideas.length === 0) { await sendTelegram('💡 Keine Ideen. Mit /idea [Idee] hinzufügen.', chatId); return; }
    let msg = `💡 *Ideen (${ideas.length})*\n\n`;
    for (const i of ideas) msg += `#${i.nr} ${i.text} _(${i.date})_\n`;
    await sendTelegram(msg, chatId);
    return;
  }

  // /video [Thema]
  const videoMatch = text.match(/^\/video\s+(.+)$/i);
  if (videoMatch) {
    const topic = videoMatch[1].trim();
    await sendTelegram(`🎬 Generiere Script für: *${topic}*...`, chatId);
    try {
      const script = await claude(`Du bist ein viraler TikTok-Skript-Autor für AI Storytelling / Dark Fantasy / Mystery.

Erstelle ein TikTok-Video-Skript zum Thema: "${topic}"

Regeln: HOOK in ersten 2 Sekunden, 30-60 Sekunden gesprochen (~80-150 Wörter), Untertitel-freundlich (kurze Sätze), Cliffhanger am Ende, Ton: geheimnisvoll, Sprache: Englisch.

Format:
TITEL: [catchy Titel]
HOOK: [erste 2 Sekunden]
SCRIPT:
[vollständiges Skript]
CLIFFHANGER: [letzter Satz]
HASHTAGS: [5-8 Hashtags]`, 800);

      const titleMatch = script.match(/TITEL:\s*(.+)/);
      const title = titleMatch ? titleMatch[1].trim() : topic;
      const nr = saveVideoLog({ topic, title, status: 'script_only', date: new Date().toLocaleDateString('de-DE') });
      mem.logActivity(`Video #${nr} Script: ${topic}`);

      if (BIGMOTION_API_KEY && BIGMOTION_API_KEY !== 'PLACEHOLDER') {
        try {
          await axios.post('https://api.bigmotion.ai/v1/videos', { script, topic, style: 'dark_fantasy', format: 'tiktok', auto_post: true },
            { headers: { Authorization: `Bearer ${BIGMOTION_API_KEY}`, 'Content-Type': 'application/json' }, timeout: 30000 });
          await sendTelegram(`🎬 *Video #${nr} — ${title}*\n\n${script}\n\n✅ An BigMotion gesendet.`, chatId);
          return;
        } catch { /* fall through to script_only */ }
      }
      await sendTelegram(`🎬 *Video #${nr} — ${title}*\n\n${script}\n\n⚠️ BigMotion: BIGMOTION_API_KEY setzen zum automatischen Posten.`, chatId);
    } catch (err) {
      await sendTelegram(`❌ Video-Fehler: ${err.message}`, chatId);
    }
    return;
  }

  // /videos
  if (/^\/videos$/i.test(text)) {
    const videos = parseVideos();
    if (videos.length === 0) { await sendTelegram('🎬 Noch keine Videos. Mit /video [Thema] starten.', chatId); return; }
    let msg = `🎬 *Videos (${videos.length})*\n\n`;
    for (const v of videos.slice(-10)) {
      msg += `${v.status === 'generiert' ? '✅' : '📝'} #${v.nr} [${v.topic}] ${v.title} _(${v.date})_\n`;
    }
    await sendTelegram(msg, chatId);
    return;
  }

  // /videoidea
  if (/^\/videoidea$/i.test(text)) {
    await sendTelegram('💡 Generiere 5 virale Video-Ideen...', chatId);
    try {
      const ideas = await claude(`Generiere 5 virale TikTok-Video-Ideen für: AI Storytelling / Dark Fantasy / Mystery.

Jede Idee: packender Titel, 30-60s erzählbar, Viral-Potenzial, Cliffhanger.

Format:
1. [Titel] — [1-Satz Beschreibung]
2. ...`, 500);
      await sendTelegram(`💡 *5 Video-Ideen:*\n\n${ideas}\n\nMit /video [Thema] Script generieren.`, chatId);
    } catch (err) {
      await sendTelegram(`❌ Fehler: ${err.message}`, chatId);
    }
    return;
  }

  // /wiki [thema]
  const wikiMatch = text.match(/^\/wiki\s+(.+)$/i);
  if (wikiMatch) {
    const thema = wikiMatch[1].trim();
    await sendTelegram(`📖 Erstelle Wiki-Seite: *${thema}*...`, chatId);
    try {
      const inhalt = await claude(
        `Erstelle einen strukturierten Wiki-Eintrag auf Deutsch für: "${thema}"\n\nKontext: 030 Digital Berlin — Web-Agentur für Berliner Handwerker.\nFormat: Markdown mit ## Abschnitten. Konkret, praxisnah, max 400 Wörter.`,
        800
      );
      const filePath = await wikiUpsert(thema, inhalt);
      mem.logActivity(`Wiki: ${thema}`);
      await sendTelegram(`✅ *Wiki: ${thema}*\n\n${inhalt.slice(0, 2000)}\n\n📁 \`${filePath}\``, chatId);
    } catch (e) { await sendTelegram(`❌ Wiki-Fehler: ${e.message}`, chatId); }
    return;
  }

  // /lint
  if (/^\/lint$/i.test(text)) {
    await sendTelegram('🔍 Prüfe Brain Vault...', chatId);
    const issues = await wikiLint();
    if (issues.length === 0) {
      await sendTelegram('✅ *Lint sauber* — keine Issues gefunden.', chatId);
    } else {
      await sendTelegram(`⚠️ *Lint — ${issues.length} Issues:*\n\n${issues.join('\n')}`, chatId);
    }
    return;
  }

  // /index
  if (/^\/index$/i.test(text)) {
    rebuildIndex();
    const indexContent = fs.existsSync(VAULT_INDEX) ? fs.readFileSync(VAULT_INDEX, 'utf8') : '';
    await sendTelegram(`📚 *Index neu generiert*\n\n${indexContent.slice(0, 2500)}`, chatId);
    return;
  }

  // /claude
  if (/^\/claude$/i.test(text)) {
    activeModel = 'claude';
    await sendTelegram('✅ Wechsel zu Claude', chatId);
    return;
  }

  // /kimi
  if (/^\/kimi$/i.test(text)) {
    if (!KIMI_API_KEY) { await sendTelegram('❌ KIMI_API_KEY nicht gesetzt.', chatId); return; }
    activeModel = 'kimi';
    await sendTelegram('✅ Wechsel zu Kimi K2.5', chatId);
    return;
  }

  // /modell
  if (/^\/modell$/i.test(text)) {
    const label = activeModel === 'claude' ? 'Claude Sonnet 4.6' : 'Kimi K2.5';
    await sendTelegram(`🤖 Aktives Modell: *${label}*`, chatId);
    return;
  }

  // /kunden
  if (/^\/kunden$/i.test(text)) {
    const aktivDir = path.join(process.env.HOME, '030-Digital-Brain/kunden/aktiv');
    try {
      const files = fs.existsSync(aktivDir) ? fs.readdirSync(aktivDir).filter(f => f.endsWith('.md')) : [];
      if (files.length === 0) { await sendTelegram('👥 Noch keine aktiven Kunden.', chatId); return; }
      let msg = `👥 *Aktive Kunden (${files.length})*\n\n`;
      for (const f of files) {
        const content = fs.readFileSync(path.join(aktivDir, f), 'utf8');
        const nameMatch = content.match(/^# (.+)/m);
        const brancheMatch = content.match(/\*\*Branche:\*\* (.+)/);
        const stadtMatch = content.match(/\*\*Stadt:\*\* (.+)/);
        msg += `• *${nameMatch?.[1] || f}*`;
        if (brancheMatch) msg += ` — ${brancheMatch[1]}`;
        if (stadtMatch) msg += `, ${stadtMatch[1]}`;
        msg += '\n';
      }
      await sendTelegram(msg, chatId);
    } catch (e) { await sendTelegram(`❌ Fehler: ${e.message}`, chatId); }
    return;
  }

  // /leads
  if (/^\/leads$/i.test(text)) {
    const leadsDir = path.join(process.env.HOME, '030-Digital-Brain/kunden/leads');
    try {
      const files = fs.existsSync(leadsDir) ? fs.readdirSync(leadsDir).filter(f => f.endsWith('.md')) : [];
      if (files.length === 0) { await sendTelegram('📋 Keine Leads vorhanden. Mit /akquise neue finden.', chatId); return; }
      let msg = `📋 *Leads (${files.length})*\n\n`;
      for (const f of files) {
        const content = fs.readFileSync(path.join(leadsDir, f), 'utf8');
        const nameMatch = content.match(/^# (.+)/m);
        const statusMatch = content.match(/\*\*Status:\*\* (.+)/);
        msg += `• *${nameMatch?.[1] || f}* — ${statusMatch?.[1] || 'neu'}\n`;
      }
      await sendTelegram(msg, chatId);
    } catch (e) { await sendTelegram(`❌ Fehler: ${e.message}`, chatId); }
    return;
  }

  // /umsatz
  if (/^\/umsatz$/i.test(text)) {
    const aktivDir = path.join(process.env.HOME, '030-Digital-Brain/kunden/aktiv');
    const abgeDir = path.join(process.env.HOME, '030-Digital-Brain/kunden/abgeschlossen');
    try {
      const aktiv = fs.existsSync(aktivDir) ? fs.readdirSync(aktivDir).filter(f => f.endsWith('.md')).length : 0;
      const abge = fs.existsSync(abgeDir) ? fs.readdirSync(abgeDir).filter(f => f.endsWith('.md')).length : 0;
      const projekte = mem.getProjects();
      const deployed = projekte.filter(p => p.status === 'deployed').length;
      await sendTelegram(
        `💰 *030 Digital — Übersicht*\n\n👥 Aktive Kunden: ${aktiv}\n✅ Abgeschlossen: ${abge}\n🌐 Deployed: ${deployed}\n\n_Umsatz-Tracking: Rechnungen in ~/030-Digital-Brain/vorlagen/rechnungen/_`,
        chatId
      );
    } catch (e) { await sendTelegram(`❌ Fehler: ${e.message}`, chatId); }
    return;
  }

  // /akquise [Branche] [Bezirk]
  const akquiseMatch = text.match(/^\/akquise\s+(.+)$/i);
  if (akquiseMatch) {
    const query = akquiseMatch[1].trim();
    const parts = query.split(/\s+/);
    const branche = parts[0];
    const bezirk = parts.slice(1).join(' ') || 'Berlin';
    await sendTelegram(`🔍 Suche ${branche}-Betriebe in ${bezirk}...`, chatId);
    try {
      const prompt = `Du bist ein Sales-Agent für 030 Digital Berlin.

Generiere 5 personalisierte Kaltakquise-Nachrichten für ${branche}-Betriebe in ${bezirk}, die wahrscheinlich keine professionelle Website haben.

Für jeden Lead:
1. Firmenname (realistischer Berliner Name)
2. Kurze personalisierte WhatsApp-Nachricht (max 3 Sätze, professionell, auf Deutsch)
3. Warum die vermutlich keine Website haben

Format pro Lead:
**[Firmenname]**
Nachricht: [WhatsApp Text]
Grund: [kurze Begründung]`;

      const result = await claude(prompt, 1200);
      // Leads speichern
      const leadsDir = path.join(process.env.HOME, '030-Digital-Brain/kunden/leads');
      fs.mkdirSync(leadsDir, { recursive: true });
      const ts = new Date().toLocaleDateString('de-DE');
      fs.appendFileSync(
        path.join(leadsDir, `akquise-${branche}-${bezirk.replace(/\s/g,'-')}.md`),
        `# Akquise: ${branche} in ${bezirk}\n**Datum:** ${ts}\n\n${result}\n\n---\n`
      );
      mem.logActivity(`Akquise: ${branche} ${bezirk}`);
      await sendTelegram(`📋 *Leads: ${branche} in ${bezirk}*\n\n${result.slice(0, 3500)}`, chatId);
    } catch (e) { await sendTelegram(`❌ Fehler: ${e.message}`, chatId); }
    return;
  }

  // /status
  if (/^\/status$/i.test(text)) {
    const open = parseTasks().filter(t => !t.done).length;
    const aktivDir = path.join(process.env.HOME, '030-Digital-Brain/kunden/aktiv');
    const leadsDir = path.join(process.env.HOME, '030-Digital-Brain/kunden/leads');
    const aktivCount = fs.existsSync(aktivDir) ? fs.readdirSync(aktivDir).filter(f => f.endsWith('.md')).length : 0;
    const leadsCount = fs.existsSync(leadsDir) ? fs.readdirSync(leadsDir).filter(f => f.endsWith('.md')).length : 0;
    const projects = mem.getProjects();
    await sendTelegram(
      `✅ *030 Digital — Status*\n\n` +
      `👥 Aktive Kunden: ${aktivCount}\n` +
      `📋 Leads: ${leadsCount}\n` +
      `🌐 Projekte deployed: ${projects.filter(p=>p.status==='deployed').length}\n` +
      `📝 Offene Tasks: ${open}\n` +
      `⏱ Uptime: ${Math.floor(process.uptime() / 60)} Min`,
      chatId
    );
    return;
  }

  // /help
  if (/^\/help$/i.test(text)) {
    await sendTelegram(
      '*Alex v2 — Alle Befehle:*\n\n' +
      '📋 *Tasks & Projekte*\n' +
      '/task [Aufgabe] — Task speichern + Auto-Erkennung\n' +
      '/tasks — alle Tasks\n' +
      '/done [Nr] — Task abhaken\n' +
      '/build [Beschreibung] — Projekt bauen & zu GitHub pushen\n' +
      '/deploy [Projekt] — auf GitHub Pages deployen\n\n' +
      '💻 *Server & Tools*\n' +
      '/run [Befehl] — Shell-Befehl ausführen\n' +
      '/file [Pfad] — Dateiinhalt anzeigen\n' +
      '/search [Query] — Recherche\n' +
      '/log — letzte Aktivitäten\n\n' +
      '👥 *Kunden & Sales*\n' +
      '/kunden — alle aktiven Kunden\n' +
      '/leads — alle Leads\n' +
      '/umsatz — Übersicht Projekte & Kunden\n' +
      '/akquise [Branche] [Bezirk] — Kaltakquise-Nachrichten generieren\n' +
      '/client [Name, Branche, Stadt] — Kunde manuell anlegen\n\n' +
      '📖 *Wiki*\n' +
      '/wiki [Thema] — Wiki-Seite erstellen oder updaten\n' +
      '/lint — Brain Vault auf Probleme prüfen\n' +
      '/index — Index neu generieren\n\n' +
      '💡 *Ideen & Videos*\n' +
      '/idea [Idee] — Idee speichern\n' +
      '/ideas — alle Ideen\n' +
      '/video [Thema] — TikTok Script generieren\n' +
      '/videos — alle Videos\n' +
      '/videoidea — 5 virale Ideen\n\n' +
      '⚙️ *System*\n' +
      '/status — Agent-Status\n' +
      '/help — diese Hilfe\n\n' +
      'Oder schreib mir einfach was du brauchst.',
      chatId
    );
    return;
  }
}

// ── Freitext → Intent Dispatch ────────────────────────────────
async function handleFreetext(text, chatId) {
  let intentResult;
  try {
    intentResult = await detectIntent(text);
  } catch (err) {
    console.error('Intent detection failed:', err.message);
    intentResult = { intent: 'chat', felder: {} };
  }

  const { intent, felder } = intentResult;
  console.log(`INTENT: ${intent}`, felder);

  // Kunden-Infos sofort in Vault speichern wenn vorhanden
  if (felder.kundenname) {
    saveKundeVault(felder);
    // Bekannte Kunden-Infos in felder mergen damit sie nicht zweimal gefragt werden
    const existing = loadKundeVault(felder.kundenname);
    if (existing) {
      const telMatch = existing.match(/\*\*Telefon:\*\* (.+)/);
      const brandMatch = existing.match(/\*\*Branche:\*\* (.+)/);
      const stadtMatch = existing.match(/\*\*Stadt:\*\* (.+)/);
      if (!felder.telefon && telMatch) felder.telefon = telMatch[1].trim();
      if (!felder.branche && brandMatch) felder.branche = brandMatch[1].trim();
      if (!felder.stadt && stadtMatch) felder.stadt = stadtMatch[1].trim();
    }
  }

  // ── website_erstellen ──────────────────────────────────────
  if (intent === 'website_erstellen') {
    mem.logActivity(`website_erstellen: ${felder.kundenname || text.slice(0, 40)}`);
    await autoBuildWebsite({ ...felder, rawText: text }, chatId);
    return;
  }

  // ── preis_anfrage ──────────────────────────────────────────
  if (intent === 'preis_anfrage') {
    const msg = `Unsere Preise:\n\n` +
      `🌐 *Website* — ab 499 €\n` +
      `✏️ *Logo* — ab 149 €\n` +
      `📍 *Google Business* — 99 €\n` +
      `📱 *Social Media* — 199 €/Monat\n\n` +
      `*Pakete:*\n` +
      `⭐ Starter (Website+Logo+Google) — 799 €\n` +
      `💎 Komplett (alles+Updates) — 249 €/Monat\n\n` +
      `Zahlung per Überweisung oder PayPal. 10% Rabatt bei Empfehlung.\n` +
      `Soll ich dir ein konkretes Angebot machen?`;
    await sendTelegram(msg, chatId);
    return;
  }

  // ── logo_anfrage ───────────────────────────────────────────
  if (intent === 'logo_anfrage') {
    await sendTelegram(
      `Logo-Design ab *149 €*.\n\nDu bekommst: 3 Entwürfe, alle Formate (PNG, SVG, PDF), unbegrenzte Revisionen in der ersten Woche.\n\nMeistens fertig in 24h. Interesse?`,
      chatId
    );
    return;
  }

  // ── google_anfrage ─────────────────────────────────────────
  if (intent === 'google_anfrage') {
    await sendTelegram(
      `Google Business Setup für *99 €* — einmalig.\n\nIch richte deinen Eintrag komplett ein: Fotos, Beschreibung, Öffnungszeiten, Kategorien optimiert.\nErgebnis: Mehr Anrufe direkt aus der Google-Suche.\n\nLohnt sich besonders wenn du noch keinen Eintrag hast. Soll ich das machen?`,
      chatId
    );
    return;
  }

  // ── social_anfrage ─────────────────────────────────────────
  if (intent === 'social_anfrage') {
    await sendTelegram(
      `Social Media Paket für *199 €/Monat*.\n\nEnthalten: 12 Posts/Monat, Stories, einheitliches Branding, Texte auf Deutsch.\n\nDu lieferst kurz die Infos, wir machen den Rest. Monatlich kündbar.\n\nInteresse?`,
      chatId
    );
    return;
  }

  // ── termin_anfrage ─────────────────────────────────────────
  if (intent === 'termin_anfrage') {
    await sendTelegram(
      `Kein Problem! Schreib mir einfach wann es dir passt — ich melde mich dann direkt bei dir.\n\nOder gleich auf WhatsApp: Raoul ist Mo–Fr 9–19 Uhr und Sa 10–16 Uhr erreichbar.`,
      chatId
    );
    return;
  }

  // ── empfehlung_anfrage ─────────────────────────────────────
  if (intent === 'empfehlung_anfrage') {
    await sendTelegram(
      `Nice, danke für die Empfehlung! 🙏\n\nDu bekommst *10% Rabatt* auf deine nächste Bestellung — und die Person die du empfohlen hast auch.\n\nEinfach beim nächsten Auftrag Bescheid geben.`,
      chatId
    );
    return;
  }

  // ── rechnung_anfrage ──────────────────────────────────────
  if (intent === 'rechnung_anfrage') {
    await sendTelegram(
      `Zahlung läuft so:\n\n50% bei Auftragserteilung, 50% nach Fertigstellung.\n\nZahlung per *Überweisung* oder *PayPal*.\nRechnung bekommst du per E-Mail von hallo@030digital.de.\n\nBei Fragen einfach melden.`,
      chatId
    );
    return;
  }

  // ── video_script ───────────────────────────────────────────
  if (intent === 'video_script') {
    const thema = felder.thema || text;
    await sendTelegram(`🎬 Generiere Script für: *${thema}*...`, chatId);
    try {
      const script = await claude(`Du bist ein viraler TikTok-Skript-Autor für AI Storytelling / Dark Fantasy / Mystery.

Erstelle ein TikTok-Video-Skript zum Thema: "${thema}"

Regeln: HOOK in ersten 2 Sekunden, 30-60 Sekunden gesprochen (~80-150 Wörter), Untertitel-freundlich (kurze Sätze), Cliffhanger am Ende, Ton: geheimnisvoll, Sprache: Englisch.

Format:
TITEL: [catchy Titel]
HOOK: [erste 2 Sekunden]
SCRIPT:
[vollständiges Skript]
CLIFFHANGER: [letzter Satz]
HASHTAGS: [5-8 Hashtags]`, 800);
      mem.logActivity(`Video-Script: ${thema}`);
      await sendTelegram(`🎬 *Script: ${thema}*\n\n${script.slice(0, 3500)}`, chatId);
    } catch (err) {
      await sendTelegram(`❌ Script-Fehler: ${err.message}`, chatId);
    }
    return;
  }

  // ── task_speichern ─────────────────────────────────────────
  if (intent === 'task_speichern') {
    const taskText = felder.tasktext || text;
    const tasks = parseTasks();
    const nr = nextTaskNr(tasks);
    tasks.push({ done: false, nr, category: felder.branche || 'other', text: taskText, date: new Date().toLocaleDateString('de-DE') });
    saveTasks(tasks);
    mem.logActivity(`Task #${nr} angelegt: ${taskText}`);
    await sendTelegram(`✅ *Task #${nr} gespeichert:* ${taskText}`, chatId);
    return;
  }

  // ── idee_speichern ─────────────────────────────────────────
  if (intent === 'idee_speichern') {
    const ideaText = felder.thema || text;
    const nr = saveIdea(ideaText);
    await sendTelegram(`💡 *Idee #${nr} gespeichert:* ${ideaText}`, chatId);
    return;
  }

  // ── chat (default) — Kimi oder Claude je nach Intent ─────────
  try {
    const history = mem.getRecentConversations(6);
    mem.saveConversation('user', text);

    // Manuell gewähltes Modell hat Vorrang; sonst automatisches Routing
    const model = activeModel !== 'auto' ? activeModel : routeModel(intent);
    console.log(`MODEL: ${model} (intent: ${intent}, active: ${activeModel})`);

    let reply;
    if (model === 'kimi' && KIMI_API_KEY) {
      try {
        reply = await kimi(text, history);
      } catch (kimiErr) {
        console.warn('Kimi failed, fallback to Claude:', kimiErr.message);
        reply = await claude(text, 1200, history);
      }
    } else {
      reply = await claude(text, 1200, history);
    }

    // Sicherheitsnetz: HTML-Output blockieren
    if (/<(!DOCTYPE|html|head|body|div|style)[^>]*>/i.test(reply)) {
      console.warn('HTML in reply blocked, re-routing to build');
      const redetect = await detectIntent(text);
      await autoBuildWebsite({ ...redetect.felder, rawText: text }, chatId);
      return;
    }

    mem.saveConversation('alex', reply);
    mem.logActivity(`Chat [${model}]: ${text.slice(0, 60)}`);
    await sendTelegram(reply, chatId);
  } catch (err) {
    console.error('Freitext error:', err.message);
    await sendTelegram(`❌ Fehler: ${err.message}`, chatId);
  }
}

// ── Webhook ───────────────────────────────────────────────────
app.post('/webhook', async (req, res) => {
  res.status(200).json({ received: true });
  try {
    const analysis = await claude(
      `Analysiere dieses Event und gib eine Handlungsempfehlung.\n\nEvent: ${JSON.stringify(req.body, null, 2)}\n\nSTATUS: [OK/WARNUNG/FEHLER]\nPROBLEM: ...\nAKTION: ...`
    );
    mem.logActivity(`Webhook empfangen`);
    await sendTelegram(`🔔 *Webhook Alert*\n\n${analysis}\n\n⏰ ${new Date().toLocaleString('de-DE')}`);
  } catch (err) {
    await sendTelegram(`❌ Webhook-Fehler: ${err.message}`);
  }
});

// ── Health Check ──────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    agent: 'Alex v2',
    uptime: process.uptime(),
    tasks: parseTasks().filter(t => !t.done).length,
    clients: mem.getClients().length,
    projects: mem.getProjects().length,
  });
});

// ── Polling ───────────────────────────────────────────────────
const CMD_REGEX = /^\/(run|file|build|deploy|search|client|clients|log|task|tasks|done|idea|ideas|video|videos|videoidea|status|help|kunden|leads|umsatz|akquise|wiki|lint|index|claude|kimi|modell)/i;

async function startPolling() {
  let offset = 0;
  const poll = async () => {
    try {
      const { data } = await axios.get(
        `https://api.telegram.org/bot${TELEGRAM_TOKEN}/getUpdates?offset=${offset}&timeout=30`,
        { timeout: 35000 }
      );
      for (const update of data.result) {
        offset = update.update_id + 1;
        if (!update.message?.text) continue;
        const text = update.message.text;
        const chatId = update.message.chat.id.toString();
        if (chatId !== String(TELEGRAM_CHAT_ID).trim()) continue;
        console.log('MSG:', text.slice(0, 80));
        try {
          if (CMD_REGEX.test(text)) {
            await handleCommand(text, chatId);
          } else {
            await handleFreetext(text, chatId);
          }
        } catch (err) {
          console.error('Handler error:', err.message);
          await sendTelegram(`❌ Fehler: ${err.message}`, chatId);
        }
      }
    } catch (err) {
      if (!err.message.includes('409')) console.error('Polling error:', err.message);
    }
    poll();
  };
  poll();
}

// ── Start ─────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`Alex v2 läuft auf Port ${PORT}`);
  tools.createDir(tools.PROJECTS_DIR);

  // Vault beim Start laden und cachen (beide Modelle)
  const vaultCore = getVaultCore();
  console.log(`Brain Vault geladen: ${vaultCore.length} Zeichen`);
  console.log(`Modelle: Claude (${ANTHROPIC_API_KEY ? 'OK' : 'FEHLT'}) | Kimi (${KIMI_API_KEY ? 'OK' : 'FEHLT'})`);

  const open = parseTasks().filter(t => !t.done).length;
  mem.logActivity('Agent gestartet');
  await sendTelegram(`🤖 *Alex v2 online.*\n📋 ${open} offene Tasks. Schreib /help für alle Befehle.`);
  startPolling();
});
