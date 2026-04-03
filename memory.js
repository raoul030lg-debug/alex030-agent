const fs = require('fs');
const path = require('path');

const MEM_DIR = path.join(__dirname, '.claude/memory');

function ensureMem(file, header = '') {
  if (!fs.existsSync(MEM_DIR)) fs.mkdirSync(MEM_DIR, { recursive: true });
  if (!fs.existsSync(file)) fs.writeFileSync(file, header);
}

const CLIENTS_FILE  = path.join(MEM_DIR, 'clients.md');
const PROJECTS_FILE = path.join(MEM_DIR, 'projects.md');
const CONV_FILE     = path.join(MEM_DIR, 'conversations.md');
const ACTIVITY_FILE = path.join(MEM_DIR, 'activity.md');

// ── Aktivitätslog ────────────────────────────────────────────
function logActivity(action) {
  ensureMem(ACTIVITY_FILE, '# Aktivitäten\n\n');
  fs.appendFileSync(ACTIVITY_FILE, `- ${new Date().toLocaleString('de-DE')}: ${action}\n`);
}

function getActivityLog(n = 15) {
  ensureMem(ACTIVITY_FILE, '# Aktivitäten\n\n');
  const lines = fs.readFileSync(ACTIVITY_FILE, 'utf8').split('\n').filter(l => l.startsWith('- '));
  return lines.slice(-n);
}

// ── Konversationen ───────────────────────────────────────────
function saveConversation(role, text) {
  ensureMem(CONV_FILE, '# Konversationen\n\n');
  fs.appendFileSync(CONV_FILE, `[${role.toUpperCase()} ${new Date().toLocaleTimeString('de-DE')}] ${text.slice(0, 300)}\n`);
}

function getRecentConversations(n = 8) {
  ensureMem(CONV_FILE, '# Konversationen\n\n');
  const lines = fs.readFileSync(CONV_FILE, 'utf8').split('\n').filter(l => /^\[(USER|ALEX)/.test(l));
  return lines.slice(-n).map(l => {
    const role = l.startsWith('[USER') ? 'user' : 'assistant';
    const text = l.replace(/^\[.*?\] /, '');
    return { role, content: text };
  });
}

// ── Kunden ───────────────────────────────────────────────────
function saveClient(name, industry, city) {
  ensureMem(CLIENTS_FILE, '# Kunden\n\n');
  const date = new Date().toLocaleDateString('de-DE');
  fs.appendFileSync(CLIENTS_FILE, `- **${name}** | ${industry} | ${city} | ${date}\n`);
}

function getClients() {
  ensureMem(CLIENTS_FILE, '# Kunden\n\n');
  return fs.readFileSync(CLIENTS_FILE, 'utf8').split('\n').filter(l => l.startsWith('- '));
}

// ── Projekte ─────────────────────────────────────────────────
function saveProject(entry) {
  ensureMem(PROJECTS_FILE, '# Projekte\n\n');
  const date = new Date().toLocaleDateString('de-DE');
  fs.appendFileSync(PROJECTS_FILE,
    `- **${entry.name}** | ${entry.type} | ${entry.status} | ${entry.url || '-'} | ${date}\n`
  );
}

function getProjects() {
  ensureMem(PROJECTS_FILE, '# Projekte\n\n');
  return fs.readFileSync(PROJECTS_FILE, 'utf8').split('\n').filter(l => l.startsWith('- '));
}

module.exports = {
  logActivity, getActivityLog,
  saveConversation, getRecentConversations,
  saveClient, getClients,
  saveProject, getProjects,
};
