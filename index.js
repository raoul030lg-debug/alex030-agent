require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const mem    = require('./memory');
const skills = require('./skills');
const tools  = require('./tools');

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

// ── System Prompt ─────────────────────────────────────────────
function buildSystemPrompt() {
  return `Du bist Alex, Leons persönlicher KI-Agent. Du hilfst Leon bei allen Projekten und Aufgaben.
Deine Fähigkeiten: Websites bauen, Code schreiben, Recherche, Texte schreiben, Ideen umsetzen, Probleme lösen.
Du sprichst Deutsch, bist direkt und effizient wie ein Kumpel.
Wenn dir Infos fehlen, frag nach.
Kategorisiere jede Aufgabe: website, code, content, research, design, other.
${skills.loadSkills()}`;
}

// ── Claude API ────────────────────────────────────────────────
async function claude(userMessage, maxTokens = 1200, history = []) {
  const response = await axios.post('https://api.anthropic.com/v1/messages', {
    model: 'claude-sonnet-4-20250514',
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

async function categorizeTask(taskText) {
  try {
    const cat = await claude(
      `Kategorisiere in EINE Kategorie: website, code, content, research, design, other\nAufgabe: "${taskText}"\nNur das Wort.`,
      20
    );
    const valid = ['website', 'code', 'content', 'research', 'design', 'other'];
    const result = cat.trim().toLowerCase().split(/\s/)[0];
    return valid.includes(result) ? result : 'other';
  } catch { return 'other'; }
}

async function isTaskSuggestion(text) {
  try {
    const r = await claude(
      `Enthält folgender Text eine konkrete Aufgabe die als Task gespeichert werden soll? Nur "ja" oder "nein".\nText: "${text}"`,
      10
    );
    return r.trim().toLowerCase().startsWith('ja');
  } catch { return false; }
}

// ── Autonomes Bauen ───────────────────────────────────────────
async function autoBuildWebsite(taskText, chatId) {
  const slug = taskText.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40);
  const projectDir = path.join(tools.PROJECTS_DIR, slug);
  await sendTelegram(`🏗️ Baue Projekt: *${taskText}*\nOrdner: \`${projectDir}\``, chatId);

  try {
    // Website generieren
    const prompt = `Du bist ein Premium-Webdesigner. Erstelle eine hochwertige Landing Page für: "${taskText}"

DESIGN-VORGABEN (strikt einhalten):
- Farbschema: dunkler Hintergrund (#0a0a0a, #111, #1a1a1a), goldene Akzente (#c9a84c, #e0b84d, #f0d080)
- Schriften: Google Fonts — Playfair Display (Überschriften) + Inter (Fließtext), via CDN einbinden
- Animationen: fade-in beim Scrollen (IntersectionObserver), hover-Effekte auf Buttons und Karten
- Mobile-first, vollständig responsive (Breakpoints bei 768px und 480px)
- Kein weißer Hintergrund, keine hellen Flächen außer Text

INHALT (realistisch und konkret, KEINE Platzhalter):
- Erfinde plausible echte Daten passend zum Unternehmen: Adresse (Berlin), Telefon, WhatsApp-Nummer
- Konkrete Preise (z.B. "Herrenhaarschnitt ab 35€"), konkrete Öffnungszeiten
- 3 echte Leistungen mit kurzen, präzisen Beschreibungen
- Kein generisches Copy wie "Willkommen bei uns", "Qualität seit Jahren", "Ihr Partner für..." oder "Wir bieten..."
- Stattdessen: direkt, selbstbewusst, modern — wie eine Premium-Marke

STRUKTUR:
1. Navigation (sticky, transparent → dunkel beim Scrollen, Logo + 3 Links)
2. Hero (Vollbild, großer Claim, Subtext, 2 CTAs: "Jetzt anrufen" + "WhatsApp")
3. Leistungen (3 Karten mit Icon, Titel, kurzer Text, Preis)
4. Über uns (kurzer, ehrlicher Text — kein Marketingblabla)
5. Kontakt (Telefon, WhatsApp-Button, Öffnungszeiten, Google Maps Placeholder)
6. Footer

CTAs:
- WhatsApp-Button: https://wa.me/49[Nummer] (öffnet WhatsApp direkt)
- Anruf-Button: tel:+49[Nummer]
- Sticky WhatsApp-Button unten rechts (immer sichtbar)

Liefere die Dateien in GENAU diesem Format:
===FILE: index.html===
[kompletter HTML-Code mit eingebetteten Google Fonts Links]
===END===
===FILE: style.css===
[kompletter CSS-Code]
===END===
===FILE: script.js===
[JavaScript: IntersectionObserver für Animationen, sticky Nav, smooth scroll]
===END===`;

    const output = await claude(prompt, 8000);
    const files = tools.parseProjectFiles(output);

    if (files.length === 0) {
      await sendTelegram('❌ Konnte keine Projektdateien aus Claude-Output parsen.', chatId);
      return;
    }

    // Dateien schreiben
    tools.createDir(projectDir);
    for (const f of files) {
      tools.writeFile(path.join(projectDir, f.path), f.content);
    }
    await sendTelegram(`✅ ${files.length} Dateien erstellt: ${files.map(f => f.path).join(', ')}`, chatId);

    // GitHub Push
    if (GITHUB_TOKEN && GITHUB_USER && GITHUB_TOKEN !== 'PLACEHOLDER') {
      const repoResult = await tools.createGithubRepo(slug, GITHUB_TOKEN, GITHUB_USER);
      if (repoResult.success) {
        const pushResult = await tools.pushToGithub(projectDir, slug, GITHUB_TOKEN, GITHUB_USER);
        if (pushResult.success) {
          const pagesUrl = await tools.enableGithubPages(slug, GITHUB_TOKEN, GITHUB_USER);
          const githubUrl = `https://github.com/${GITHUB_USER}/${slug}`;
          mem.saveProject({ name: slug, type: 'website', status: 'deployed', url: pagesUrl || githubUrl });
          mem.logActivity(`Website gebaut und gepusht: ${slug}`);
          await sendTelegram(
            `✅ *Build fertig: ${taskText}*\n\n` +
            `📦 GitHub: ${githubUrl}\n` +
            `🌐 Live: ${pagesUrl || 'GitHub Pages wird aktiviert...'}\n\n` +
            `_Pages ist in 1-2 Minuten erreichbar._`,
            chatId
          );
        } else {
          await sendTelegram(`⚠️ Push fehlgeschlagen: ${pushResult.error}`, chatId);
        }
      } else {
        await sendTelegram(`⚠️ GitHub Repo konnte nicht erstellt werden: ${repoResult.error}`, chatId);
      }
    } else {
      mem.saveProject({ name: slug, type: 'website', status: 'local', url: projectDir });
      await sendTelegram(`📁 Projekt lokal gespeichert: \`${projectDir}\`\n\nFür GitHub: GITHUB_TOKEN und GITHUB_USER in .env setzen.`, chatId);
    }
  } catch (err) {
    await sendTelegram(`❌ Build-Fehler: ${err.message}`, chatId);
  }
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
    await autoBuildWebsite(desc, chatId);
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
    const category = await categorizeTask(taskText);
    const nr = nextTaskNr(tasks);
    tasks.push({ done: false, nr, category, text: taskText, date: new Date().toLocaleDateString('de-DE') });
    saveTasks(tasks);
    mem.logActivity(`Task #${nr} angelegt: ${taskText}`);
    await sendTelegram(`✅ *Task #${nr} gespeichert*\n📂 \`${category}\` — ${taskText}`, chatId);

    // Autonomer Modus
    if (category === 'website') {
      await sendTelegram(`🤖 Website-Aufgabe erkannt! Soll ich direkt loslegen?\n→ /build ${taskText}`, chatId);
    } else if (category === 'content') {
      await sendTelegram(`📝 Content-Aufgabe erkannt!\n→ /build ${taskText} zum automatischen Erstellen`, chatId);
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

  // /status
  if (/^\/status$/i.test(text)) {
    const open = parseTasks().filter(t => !t.done).length;
    const ideas = parseIdeas().length;
    const clients = mem.getClients().length;
    const projects = mem.getProjects().length;
    await sendTelegram(
      `✅ *Alex online*\n\n📋 Offene Tasks: ${open}\n💡 Ideen: ${ideas}\n👥 Kunden: ${clients}\n📦 Projekte: ${projects}\n⏱ Uptime: ${Math.floor(process.uptime() / 60)} Min`,
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
      '👥 *Kunden*\n' +
      '/client [Name, Branche, Stadt] — Kunde anlegen\n' +
      '/clients — Kundenliste\n\n' +
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

// ── Freitext ──────────────────────────────────────────────────
async function handleFreetext(text, chatId) {
  try {
    const history = mem.getRecentConversations(6);
    mem.saveConversation('user', text);

    const [reply, isTask] = await Promise.all([
      claude(text, 1200, history),
      isTaskSuggestion(text),
    ]);

    mem.saveConversation('alex', reply);
    mem.logActivity(`Chat: ${text.slice(0, 60)}`);
    await sendTelegram(`🤖 *Alex:*\n\n${reply}`, chatId);

    if (isTask) {
      await sendTelegram(`💾 Aufgabe erkannt — speichern?\n→ /task ${text.slice(0, 80)}`, chatId);
    }
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
const CMD_REGEX = /^\/(run|file|build|deploy|search|client|clients|log|task|tasks|done|idea|ideas|video|videos|videoidea|status|help)/i;

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
  const open = parseTasks().filter(t => !t.done).length;
  mem.logActivity('Agent gestartet');
  await sendTelegram(`🤖 *Alex v2 online.*\n📋 ${open} offene Tasks. Schreib /help für alle Befehle.`);
  startPolling();
});
