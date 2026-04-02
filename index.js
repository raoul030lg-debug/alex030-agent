const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

const TASKS_FILE = path.join(__dirname, '.claude/memory/tasks.md');

// ── Task-Datei lesen/schreiben ───────────────────────────────
function readTasks() {
  if (!fs.existsSync(TASKS_FILE)) {
    fs.mkdirSync(path.dirname(TASKS_FILE), { recursive: true });
    fs.writeFileSync(TASKS_FILE, '# Tasks\n\n<!-- Format: - [ ] #Nr [Kategorie] Aufgabe (Datum) -->\n');
  }
  return fs.readFileSync(TASKS_FILE, 'utf8');
}

function parseTasks() {
  const content = readTasks();
  const lines = content.split('\n');
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
  const lines = ['# Tasks', '', '<!-- Format: - [ ] #Nr [Kategorie] Aufgabe (Datum) -->', ''];
  for (const t of tasks) {
    const check = t.done ? 'x' : ' ';
    lines.push(`- [${check}] #${t.nr} [${t.category}] ${t.text} (${t.date})`);
  }
  fs.writeFileSync(TASKS_FILE, lines.join('\n') + '\n');
}

function nextTaskNr(tasks) {
  if (tasks.length === 0) return 1;
  return Math.max(...tasks.map(t => t.nr)) + 1;
}

// ── Telegram senden ──────────────────────────────────────────
async function sendTelegram(message, chatId) {
  try {
    await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      chat_id: chatId || TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: 'Markdown',
    });
  } catch (err) {
    console.error('Telegram error:', err.message);
  }
}

// ── Claude: Task kategorisieren ──────────────────────────────
async function categorizeTask(taskText) {
  try {
    const response = await axios.post('https://api.anthropic.com/v1/messages', {
      model: 'claude-sonnet-4-20250514',
      max_tokens: 50,
      messages: [{
        role: 'user',
        content: `Kategorisiere diese Aufgabe in EINE der folgenden Kategorien: website, logo, gbp, lead, seo, content, other

Aufgabe: "${taskText}"

Antworte NUR mit dem Kategorienamen, ohne Erklärung.`,
      }],
    }, {
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
    });
    const cat = response.data.content[0].text.trim().toLowerCase();
    const valid = ['website', 'logo', 'gbp', 'lead', 'seo', 'content', 'other'];
    return valid.includes(cat) ? cat : 'other';
  } catch (err) {
    console.error('Claude categorize error:', err.message);
    return 'other';
  }
}

// ── Claude: freier Chat ──────────────────────────────────────
async function analyzeWithClaude(eventData) {
  try {
    const response = await axios.post('https://api.anthropic.com/v1/messages', {
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: `Du bist ein Automatisierungs-Agent. Analysiere dieses Event und gib eine klare Handlungsempfehlung auf Deutsch.

Event-Daten: ${JSON.stringify(eventData, null, 2)}

Antworte im Format:
STATUS: [OK/WARNUNG/FEHLER]
PROBLEM: [kurze Beschreibung]
AKTION: [was zu tun ist]`,
      }],
    }, {
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
    });
    return response.data.content[0].text;
  } catch (err) {
    console.error('Claude error:', err.message);
    return 'Fehler bei Claude-Analyse.';
  }
}

// ── Task-Befehle handler ─────────────────────────────────────
async function handleTaskCommand(text, chatId) {
  // /task [Aufgabe]
  const taskMatch = text.match(/^\/task\s+(.+)$/i);
  if (taskMatch) {
    const taskText = taskMatch[1].trim();
    const tasks = parseTasks();
    const category = await categorizeTask(taskText);
    const nr = nextTaskNr(tasks);
    const date = new Date().toLocaleDateString('de-DE');
    tasks.push({ done: false, nr, category, text: taskText, date });
    saveTasks(tasks);
    await sendTelegram(
      `✅ *Task gespeichert:* ${taskText}\n📂 Kategorie: \`${category}\`\n🔢 Task #${nr}`,
      chatId
    );
    return;
  }

  // /tasks
  if (text.match(/^\/tasks$/i)) {
    const tasks = parseTasks();
    if (tasks.length === 0) {
      await sendTelegram('📋 *Keine Tasks vorhanden.*\n\nMit /task [Aufgabe] neue Task hinzufügen.', chatId);
      return;
    }
    const open = tasks.filter(t => !t.done);
    const done = tasks.filter(t => t.done);
    let msg = `📋 *Tasks (${open.length} offen, ${done.length} erledigt)*\n\n`;
    if (open.length > 0) {
      msg += '*Offen:*\n';
      for (const t of open) {
        msg += `◻️ #${t.nr} \`[${t.category}]\` ${t.text}\n`;
      }
    }
    if (done.length > 0) {
      msg += '\n*Erledigt:*\n';
      for (const t of done) {
        msg += `✅ #${t.nr} ~~${t.text}~~\n`;
      }
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
    if (!task) {
      await sendTelegram(`❌ Task #${nr} nicht gefunden.`, chatId);
      return;
    }
    if (task.done) {
      await sendTelegram(`ℹ️ Task #${nr} war bereits erledigt.`, chatId);
      return;
    }
    task.done = true;
    saveTasks(tasks);
    await sendTelegram(`✅ *Task #${nr} erledigt!*\n_${task.text}_`, chatId);
    return;
  }
}

// ── Webhook Endpoint ─────────────────────────────────────────
app.post('/webhook', async (req, res) => {
  const eventData = req.body;
  console.log('Event empfangen:', JSON.stringify(eventData));
  res.status(200).json({ received: true });
  const analysis = await analyzeWithClaude(eventData);
  const message = `🤖 *Agent Alert*\n\n${analysis}\n\n⏰ ${new Date().toLocaleString('de-DE')}`;
  await sendTelegram(message);
});

// ── Telegram Bot Polling ─────────────────────────────────────
async function startTelegramPolling() {
  let offset = 0;

  setInterval(async () => {
    try {
      const response = await axios.get(
        `https://api.telegram.org/bot${TELEGRAM_TOKEN}/getUpdates?offset=${offset}&timeout=10`
      );

      const updates = response.data.result;

      for (const update of updates) {
        offset = update.update_id + 1;

        if (!update.message?.text) continue;

        const text = update.message.text;
        const chatId = update.message.chat.id.toString();

        if (chatId !== TELEGRAM_CHAT_ID) continue;

        console.log('Telegram Nachricht:', text);

        if (text.match(/^\/(task|tasks|done)/i)) {
          await handleTaskCommand(text, chatId);
        } else if (text === '/status') {
          const tasks = parseTasks();
          const open = tasks.filter(t => !t.done).length;
          await sendTelegram(`✅ *Agent läuft*\n\nAlle Systeme online.\n📋 Offene Tasks: ${open}`, chatId);
        } else if (text === '/help') {
          await sendTelegram(
            '📋 *Befehle:*\n\n' +
            '/task [Aufgabe] — neue Task\n' +
            '/tasks — alle Tasks anzeigen\n' +
            '/done [Nr] — Task abhaken\n' +
            '/status — Agent Status\n' +
            '/help — Diese Hilfe\n\n' +
            'Oder schreib mir direkt was du brauchst!',
            chatId
          );
        } else {
          const analysis = await analyzeWithClaude({ userMessage: text, type: 'manual_command' });
          await sendTelegram(`🤖 *Agent:*\n\n${analysis}`, chatId);
        }
      }
    } catch (err) {
      console.error('Polling error:', err.message);
    }
  }, 3000);
}

// ── Health Check ─────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    agent: 'Alex030 Ober-Agent',
    uptime: process.uptime(),
    tasks: parseTasks().length,
  });
});

// ── Start ─────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`Agent läuft auf Port ${PORT}`);
  await sendTelegram(
    '🚀 *Ober-Agent gestartet!*\n\n' +
    'Neue Befehle:\n' +
    '/task [Aufgabe] — Task erfassen\n' +
    '/tasks — alle Tasks\n' +
    '/done [Nr] — abhaken\n\n' +
    'Schreib /help für alle Befehle.'
  );
  startTelegramPolling();
});
