const express = require(‘express’);
const axios = require(‘axios’);

const app = express();
app.use(express.json());

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// ── Telegram senden ──────────────────────────────────────────
async function sendTelegram(message) {
try {
await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
chat_id: TELEGRAM_CHAT_ID,
text: message,
parse_mode: ‘Markdown’
});
} catch (err) {
console.error(‘Telegram error:’, err.message);
}
}

// ── Claude analysiert den Fehler ─────────────────────────────
async function analyzeWithClaude(eventData) {
try {
const response = await axios.post(‘https://api.anthropic.com/v1/messages’, {
model: ‘claude-sonnet-4-20250514’,
max_tokens: 1000,
messages: [{
role: ‘user’,
content: `Du bist ein Automatisierungs-Agent. Analysiere dieses Event und gib eine klare Handlungsempfehlung auf Deutsch.

Event-Daten: ${JSON.stringify(eventData, null, 2)}

Antworte im Format:
STATUS: [OK/WARNUNG/FEHLER]
PROBLEM: [kurze Beschreibung]
AKTION: [was zu tun ist]`
}]
}, {
headers: {
‘x-api-key’: ANTHROPIC_API_KEY,
‘anthropic-version’: ‘2023-06-01’,
‘content-type’: ‘application/json’
}
});

return response.data.content[0].text;

} catch (err) {
console.error(‘Claude error:’, err.message);
return ‘Fehler bei Claude-Analyse.’;
}
}

// ── Webhook Endpoint (Make.com oder andere Trigger) ──────────
app.post(’/webhook’, async (req, res) => {
const eventData = req.body;
console.log(‘Event empfangen:’, JSON.stringify(eventData));

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

    if (update.message?.text) {
      const text = update.message.text;
      const chatId = update.message.chat.id;

      if (chatId.toString() !== TELEGRAM_CHAT_ID) continue;

      console.log('Telegram Nachricht:', text);

      // Claude antwortet auf Befehle
      if (text === '/status') {
        await sendTelegram('✅ *Agent läuft*\n\nAlle Systeme online.\nWartet auf Webhooks...');
      } else if (text === '/help') {
        await sendTelegram('📋 *Befehle:*\n\n/status - Agent Status\n/help - Diese Hilfe\n\nOder schreib mir direkt was du brauchst!');
      } else {
        // Freier Chat mit Claude
        const analysis = await analyzeWithClaude({ userMessage: text, type: 'manual_command' });
        await sendTelegram(`🤖 *Agent:*\n\n${analysis}`);
      }
    }
  }
} catch (err) {
  console.error('Polling error:', err.message);
}

}, 3000);
}

// ── Health Check ─────────────────────────────────────────────
app.get(’/’, (req, res) => {
res.json({
status: ‘online’,
agent: ‘Alex030 Automation Agent’,
uptime: process.uptime()
});
});

// ── Start ─────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
console.log(`Agent läuft auf Port ${PORT}`);
await sendTelegram(‘🚀 *Agent gestartet!*\n\nIch bin online und überwache deine Automationen.\nSchreib /help für Befehle.’);
startTelegramPolling();
});
