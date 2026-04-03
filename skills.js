const fs = require('fs');
const path = require('path');

const SKILLS_DIR = path.join(__dirname, '.claude/skills');

function loadSkills() {
  if (!fs.existsSync(SKILLS_DIR)) return '';
  try {
    const files = fs.readdirSync(SKILLS_DIR).filter(f => f.endsWith('.md'));
    if (files.length === 0) return '';
    const content = files.map(f => {
      const raw = fs.readFileSync(path.join(SKILLS_DIR, f), 'utf8');
      return `### Skill: ${f.replace('.md', '')}\n${raw.slice(0, 600)}`;
    }).join('\n\n');
    return `\n\n# Verfügbare Skills:\n${content}`;
  } catch {
    return '';
  }
}

module.exports = { loadSkills };
