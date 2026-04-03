const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const BIGMOTION_API_KEY = process.env.BIGMOTION_API_KEY;

const TASKS_FILE = process.env.TASKS_FILE || '/tmp/tasks.md';
const IDEAS_FILE = process.env.IDEAS_FILE || '/tmp/ideas.md';
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
  const lines = fs.readFileSync(TASKS_FILE, 'utf8').split('\n');
  const tasks = [];
  for (const line of lines) {
    const match = line.match(/^- \[([ x])\] #(\d+) \[(\w+)\] (.+?) \((.+?)\)$/);
    if (match) {
      tasks.push({
        done: match[1] === 'x',
        nr: parseInt(match[2]),
        category: match[3],
        text: match[4],
        date: match[5],
      });
    }
  }
  return tasks;
}

function saveTasks(tasks) {
  ensureFile(TASKS_FILE, '# Tasks\n\n');
  const lines = ['# Tasks', '', '<!-- - [ ] #Nr [Kategorie] Aufgabe (Datum) -->', ''];
  for (const t of tasks) {
    lines.push(`- [${t.done ? 'x' : ' '}] #${t.nr} [${t.category}] ${t.text} (${t.date})`);
  }
  fs.writeFileSync(TASKS_FILE, lines.join('\n') + '\n');
}

function nextTaskNr(tasks) {
  return tasks.length === 0 ? 1 : Math.max(...tasks.map(t => t.nr)) + 1;
}

// ── Ideen ────────────────────────────────────────────────────
function parseIdeas() {
  ensureFile(IDEAS_FILE, '# Ideen\n\n');
  const lines = fs.readFileSync(IDEAS_FILE, 'utf8').split('\n');
  const ideas = [];
  for (const line of lines) {
    const match = line.match(/^- #(\d+) (.+?) \((.+?)\)$/);
    if (match) ideas.push({ nr: parseInt(match[1]), text: match[2], date: match[3] });
  }
  return ideas;
}

function saveIdea(text) {
  ensureFile(IDEAS_FILE, '# Ideen\n\n');
  const ideas = parseIdeas();
  const nr = ideas.length === 0 ? 1 : Math.max(...ideas.map(i => i.nr)) + 1;
  const date = new Date().toLocaleDateString('de-DE');
  fs.appendFileSync(IDEAS_FILE, `- #${nr} ${text} (${date})\n`);
  return nr;
}

// ── Telegram ─────────────────────────────────────────────────
async function sendTelegram(message, chatId) {
  try {
    await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      chat_id: chatId || TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: 'Markdown',
    });
  } catch (err) {
    console.error('Telegram error:', err.response?.data?.description || err.message);
  }
}

// ── Claude System Prompt ─────────────────────────────────────
const SYSTEM_PROMPT = `Du bist Alex, Leons persönlicher KI-Agent. Du hilfst Leon bei allen Projekten und Aufgaben.
Deine Fähigkeiten: Websites bauen, Code schreiben, Recherche, Texte schreiben, Ideen umsetzen, Probleme lösen.
Du sprichst Deutsch, bist direkt und effizient wie ein Kumpel.
Wenn dir Infos fehlen, frag nach.
Kategorisiere jede Aufgabe: website, code, content, research, design, other.`;

// ── Claude API ───────────────────────────────────────────────
async function claude(userMessage, maxTokens = 1000) {
  const response = await axios.post('https://api.anthropic.com/v1/messages', {
    model: 'claude-sonnet-4-20250514',
    max_tokens: maxTokens,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userMessage }],
  }, {
    headers: {
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    timeout: 25000,
  });
  return response.data.content[0].text;
}

async function categorizeTask(taskText) {
  try {
    const cat = await claude(
      `Kategorisiere diese Aufgabe in EINE Kategorie: website, code, content, research, design, other\nAufgabe: "${taskText}"\nAntworte NUR mit dem Kategorienamen.`,
      50
    );
    const valid = ['website', 'code', 'content', 'research', 'design', 'other'];
    const result = cat.trim().toLowerCase();
    return valid.includes(result) ? result : 'other';
  } catch {
    return 'other';
  }
}

// ── Video Logs ────────────────────────────────────────────────
function parseVideos() {
  ensureFile(VIDEOS_FILE, '# Videos\n\n');
  const lines = fs.readFileSync(VIDEOS_FILE, 'utf8').split('\n');
  const videos = [];
  for (const line of lines) {
    const match = line.match(/^- #(\d+) \[(.+?)\] (.+?) \| Status: (.+?) \| (.+?)$/);
    if (match) videos.push({ nr: parseInt(match[1]), topic: match[2], title: match[3], status: match[4], date: match[5] });
  }
  return videos;
}

function saveVideoLog(entry) {
  ensureFile(VIDEOS_FILE, '# Videos\n\n');
  const videos = parseVideos();
  const nr = videos.length === 0 ? 1 : Math.max(...videos.map(v => v.nr)) + 1;
  const line = `- #${nr} [${entry.topic}] ${entry.title} | Status: ${entry.status} | ${entry.date}\n`;
  fs.appendFileSync(VIDEOS_FILE, line);
  return nr;
}

// ── TikTok Script generieren ──────────────────────────────────
async function generateVideoScript(topic) {
  const script = await claude(`Du bist ein viraler TikTok-Skript-Autor für die Nische AI Storytelling / Dark Fantasy / Mystery.

Erstelle ein TikTok-Video-Skript zum Thema: "${topic}"

Regeln:
- HOOK in den ersten 2 Sekunden (Frage, Schock-Statement oder mysteriöser Fakt)
- Gesamtlänge: 30-60 Sekunden gesprochen (ca. 80-150 Wörter)
- Untertitel-freundlich: kurze, klare Sätze
- Cliffhanger am Ende der immer mehr will
- Ton: geheimnisvoll, packend, leicht bedrohlich
- Sprache: Englisch (TikTok-Zielgruppe)

Format:
TITEL: [catchy Titel für das Video]
HOOK: [erste 2 Sekunden]
SCRIPT:
[vollständiges Skript]
CLIFFHANGER: [letzter Satz]
HASHTAGS: [5-8 relevante Hashtags]`, 800);
  return script;
}

// ── BigMotion API ─────────────────────────────────────────────
async function submitToBigMotion(script, topic) {
  if (!BIGMOTION_API_KEY || BIGMOTION_API_KEY === 'PLACEHOLDER') {
    return { success: false, message: 'BigMotion API Key nicht gesetzt', videoId: null };
  }
  try {
    const response = await axios.post('https://api.bigmotion.ai/v1/videos', {
      script,
      topic,
      style: 'dark_fantasy',
      format: 'tiktok',
      auto_post: true,
    }, {
      headers: {
        'Authorization': `Bearer ${BIGMOTION_API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
    return { success: true, videoId: response.data.id, message: 'Video wird generiert' };
  } catch (err) {
    return { success: false, message: err.response?.data?.message || err.message, videoId: null };
  }
}

async function isTaskSuggestion(text) {
  try {
    const result = await claude(
      `Erkennt der folgende Text eine konkrete Aufgabe oder einen Auftrag, der als Task gespeichert werden sollte? Antworte nur mit "ja" oder "nein".\nText: "${text}"`,
      10
    );
    return result.trim().toLowerCase().startsWith('ja');
  } catch {
    return false;
  }
}

// ── Befehle ───────────────────────────────────────────────────
async function handleCommand(text, chatId) {
  // /task [Aufgabe]
  const taskMatch = text.match(/^\/task\s+(.+)$/i);
  if (taskMatch) {
    const taskText = taskMatch[1].trim();
    const tasks = parseTasks();
    const category = await categorizeTask(taskText);
    const nr = nextTaskNr(tasks);
    tasks.push({ done: false, nr, category, text: taskText, date: new Date().toLocaleDateString('de-DE') });
    saveTasks(tasks);
    await sendTelegram(`✅ *Task #${nr} gespeichert*\n📂 \`${category}\` — ${taskText}`, chatId);
    return;
  }

  // /tasks
  if (/^\/tasks$/i.test(text)) {
    const tasks = parseTasks();
    const open = tasks.filter(t => !t.done);
    const done = tasks.filter(t => t.done);
    if (tasks.length === 0) {
      await sendTelegram('📋 Keine Tasks vorhanden. Mit /task [Aufgabe] hinzufügen.', chatId);
      return;
    }
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
    await sendTelegram(`✅ *Task #${nr} erledigt!*\n_${task.text}_`, chatId);
    return;
  }

  // /idea [Idee]
  const ideaMatch = text.match(/^\/idea\s+(.+)$/i);
  if (ideaMatch) {
    const ideaText = ideaMatch[1].trim();
    const nr = saveIdea(ideaText);
    await sendTelegram(`💡 *Idee #${nr} gespeichert:* ${ideaText}`, chatId);
    return;
  }

  // /ideas
  if (/^\/ideas$/i.test(text)) {
    const ideas = parseIdeas();
    if (ideas.length === 0) {
      await sendTelegram('💡 Keine Ideen vorhanden. Mit /idea [Idee] hinzufügen.', chatId);
      return;
    }
    let msg = `💡 *Ideen (${ideas.length})*\n\n`;
    for (const i of ideas) msg += `#${i.nr} ${i.text} _(${i.date})_\n`;
    await sendTelegram(msg, chatId);
    return;
  }

  // /status
  if (/^\/status$/i.test(text)) {
    const open = parseTasks().filter(t => !t.done).length;
    const ideas = parseIdeas().length;
    await sendTelegram(
      `✅ *Alex online*\n\n📋 Offene Tasks: ${open}\n💡 Ideen: ${ideas}\n⏱ Uptime: ${Math.floor(process.uptime() / 60)} Min`,
      chatId
    );
    return;
  }

  // /video [Thema]
  const videoMatch = text.match(/^\/video\s+(.+)$/i);
  if (videoMatch) {
    const topic = videoMatch[1].trim();
    await sendTelegram(`🎬 Generiere Script für: *${topic}*...`, chatId);
    try {
      const script = await generateVideoScript(topic);
      const titleMatch = script.match(/TITEL:\s*(.+)/);
      const title = titleMatch ? titleMatch[1].trim() : topic;

      const result = await submitToBigMotion(script, topic);
      const status = result.success ? 'generiert' : 'script_only';
      const date = new Date().toLocaleDateString('de-DE');
      const nr = saveVideoLog({ topic, title, status, date });

      let msg = `🎬 *Video #${nr} — ${title}*\n\n${script}\n\n`;
      if (result.success) {
        msg += `✅ An BigMotion gesendet (ID: ${result.videoId})`;
      } else {
        msg += `⚠️ BigMotion: ${result.message}\n_Script gespeichert, manuell hochladen._`;
      }
      await sendTelegram(msg, chatId);
    } catch (err) {
      await sendTelegram(`❌ Video-Fehler: ${err.message}`, chatId);
    }
    return;
  }

  // /videos
  if (/^\/videos$/i.test(text)) {
    const videos = parseVideos();
    if (videos.length === 0) {
      await sendTelegram('🎬 Noch keine Videos. Mit /video [Thema] starten.', chatId);
      return;
    }
    let msg = `🎬 *Videos (${videos.length})*\n\n`;
    for (const v of videos.slice(-10)) {
      const icon = v.status === 'generiert' ? '✅' : '📝';
      msg += `${icon} #${v.nr} [${v.topic}] ${v.title} _(${v.date})_\n`;
    }
    await sendTelegram(msg, chatId);
    return;
  }

  // /videoidea
  if (/^\/videoidea$/i.test(text)) {
    await sendTelegram('💡 Generiere 5 virale Video-Ideen...', chatId);
    try {
      const ideas = await claude(`Generiere 5 virale TikTok-Video-Ideen für die Nische: AI Storytelling / Dark Fantasy / Mystery.

Jede Idee soll:
- Einen packenden Titel haben
- In 30-60 Sekunden erzählbar sein
- Viral-Potenzial haben (Schock, Mysterium, AI-Twist)
- Mit einem Cliffhanger enden

Format:
1. [Titel] — [1-Satz Beschreibung]
2. ...`, 500);
      await sendTelegram(`💡 *5 Video-Ideen:*\n\n${ideas}\n\nMit /video [Thema] Script generieren.`, chatId);
    } catch (err) {
      await sendTelegram(`❌ Fehler: ${err.message}`, chatId);
    }
    return;
  }

  // /help
  if (/^\/help$/i.test(text)) {
    await sendTelegram(
      '*Alex — Befehle:*\n\n' +
      '📋 *Tasks*\n' +
      '/task [Aufgabe] — Task speichern\n' +
      '/tasks — alle offenen Tasks\n' +
      '/done [Nr] — Task abhaken\n\n' +
      '💡 *Ideen*\n' +
      '/idea [Idee] — Idee speichern\n' +
      '/ideas — alle Ideen\n\n' +
      '🎬 *TikTok Videos*\n' +
      '/video [Thema] — Script generieren & posten\n' +
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
    const [reply, isTask] = await Promise.all([
      claude(text),
      isTaskSuggestion(text),
    ]);
    await sendTelegram(`🤖 *Alex:*\n\n${reply}`, chatId);
    if (isTask) {
      await sendTelegram(`💾 Soll ich das als Task anlegen? Dann schreib:\n/task ${text.slice(0, 80)}`, chatId);
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
      `Analysiere dieses Event und gib eine Handlungsempfehlung.\n\nEvent: ${JSON.stringify(req.body, null, 2)}\n\nFormat:\nSTATUS: [OK/WARNUNG/FEHLER]\nPROBLEM: ...\nAKTION: ...`
    );
    await sendTelegram(`🔔 *Webhook Alert*\n\n${analysis}\n\n⏰ ${new Date().toLocaleString('de-DE')}`);
  } catch (err) {
    await sendTelegram(`❌ Webhook-Fehler: ${err.message}`);
  }
});

// ── Health Check ──────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ status: 'online', agent: 'Alex v2', uptime: process.uptime(), tasks: parseTasks().filter(t => !t.done).length });
});

// ── Polling ───────────────────────────────────────────────────
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
        console.log('MSG:', text);
        try {
          if (/^\/(task|tasks|done|idea|ideas|video|videos|videoidea|status|help)/i.test(text)) {
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
  const open = parseTasks().filter(t => !t.done).length;
  await sendTelegram(`🤖 *Alex v2 online.*\n📋 ${open} offene Tasks.\n\nWas kann ich für dich tun?`);
  startPolling();
});
