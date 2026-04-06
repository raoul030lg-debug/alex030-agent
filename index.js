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

KRITISCHE REGEL — NIEMALS BRECHEN:
- Sende NIEMALS HTML, CSS oder JavaScript-Code als Text in dieser Konversation
- Wenn jemand eine Website will: Antworte NUR mit "🏗️ Baue Website..." — der Build startet automatisch
- Websites werden immer als Datei gespeichert und deployed, niemals als Text ausgegeben
- Output-Format nach Build: "✅ [Name] Website ist live: [URL]"
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

// ── Intent Detection (unified) ────────────────────────────────
async function detectIntent(text) {
  try {
    const response = await axios.post('https://api.anthropic.com/v1/messages', {
      model: 'claude-sonnet-4-20250514',
      max_tokens: 400,
      system: 'You are an intent classifier. Always respond with valid JSON only. No explanation, no markdown.',
      messages: [{
        role: 'user',
        content: `Classify this message and extract all available fields.

Intents:
- website_erstellen: user wants a website/landing page built for a business
- video_script: user wants a TikTok/video script
- task_speichern: user explicitly wants to save a task or todo item
- idee_speichern: user wants to save an idea
- chat: general conversation, question, or anything else

Branchen (if website_erstellen): klempner, barbershop, restaurant, kosmetik, elektriker, maler, other

Message: "${text}"

Respond with this exact JSON structure:
{
  "intent": "website_erstellen|video_script|task_speichern|idee_speichern|chat",
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

// ── Autonomes Bauen via Claude Code Subagent ─────────────────
// context: { kundenname, branche, telefon, stadt, rawText }
async function autoBuildWebsite(context, chatId) {
  const { kundenname, branche, telefon, stadt, rawText } = context;

  const slugBase = [branche, kundenname, stadt]
    .filter(Boolean).join(' ')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50);
  const slug = slugBase || rawText.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40);
  const displayName = [kundenname, branche, stadt].filter(Boolean).join(' · ') || rawText;

  await sendTelegram(`🏗️ Baue *${displayName}*...`, chatId);

  // Prompt zusammenbauen
  const promptLines = [
    branche    ? `Branche: ${branche}`          : null,
    kundenname ? `Kundenname: ${kundenname}`     : null,
    telefon    ? `Telefon: ${telefon}`           : null,
    `Stadt: ${stadt || 'Berlin'}`,
    '',
    `Baue Premium Website. Speichere unter ~/projects/${slug}/`,
    'Deploye zu Vercel. Gib am Ende NUR die fertige URL zurück, sonst nichts.',
  ].filter(l => l !== null).join('\n');

  // Prompt + Output als Temp-Dateien (vermeidet Shell-Escaping + Output-Truncation)
  const ts          = Date.now();
  const promptFile  = `/tmp/alex-prompt-${ts}.txt`;
  const outputFile  = `/tmp/alex-output-${ts}.txt`;
  tools.writeFile(promptFile, promptLines);

  try {
    // claude --print liest Prompt aus Datei, schreibt Output in Datei
    // 5-Minuten-Timeout für den vollen Build
    await tools.runCommand(
      `claude --print "$(cat '${promptFile}')" > '${outputFile}' 2>&1`,
      __dirname,
      300000
    );

    const fullOutput = tools.readFile(outputFile) || '';

    // URL aus Output extrahieren (letzte https-URL im Text)
    const urlMatches = fullOutput.match(/https?:\/\/[^\s\n"'<>]+/g);
    const url = urlMatches ? urlMatches[urlMatches.length - 1].replace(/[.,;)]+$/, '') : null;

    mem.saveProject({ name: slug, type: 'website', status: url ? 'deployed' : 'local', url: url || slug });
    mem.logActivity(`Website gebaut: ${slug}`);

    if (url) {
      await sendTelegram(`✅ *${displayName}* Website ist live:\n${url}`, chatId);
    } else {
      // Kein Vercel-Token oder Deploy fehlgeschlagen — lokalen Pfad zurückgeben
      await sendTelegram(
        `✅ *${displayName}* Website gespeichert:\n\`~/projects/${slug}/\`\n\n_Kein Vercel-Deploy — VERCEL\\_TOKEN fehlt._`,
        chatId
      );
    }
  } catch (err) {
    await sendTelegram(`❌ Build-Fehler: ${err.message}`, chatId);
  } finally {
    // Temp-Dateien aufräumen
    try { fs.unlinkSync(promptFile); } catch {}
    try { fs.unlinkSync(outputFile); } catch {}
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

  // ── website_erstellen ──────────────────────────────────────
  if (intent === 'website_erstellen') {
    mem.logActivity(`website_erstellen: ${felder.kundenname || text.slice(0, 40)}`);
    await autoBuildWebsite({ ...felder, rawText: text }, chatId);
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

  // ── chat (default) ─────────────────────────────────────────
  try {
    const history = mem.getRecentConversations(6);
    mem.saveConversation('user', text);

    const reply = await claude(text, 1200, history);

    // Sicherheitsnetz: HTML-Output blockieren
    if (/<(!DOCTYPE|html|head|body|div|style)[^>]*>/i.test(reply)) {
      console.warn('HTML in Claude reply blocked, re-routing to build');
      const redetect = await detectIntent(text);
      await autoBuildWebsite({ ...redetect.felder, rawText: text }, chatId);
      return;
    }

    mem.saveConversation('alex', reply);
    mem.logActivity(`Chat: ${text.slice(0, 60)}`);
    await sendTelegram(`🤖 *Alex:*\n\n${reply}`, chatId);
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
