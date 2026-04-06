---
name: website-erstellen
description: Use when building any premium website for a local business (Handwerker, Dienstleister, Gastronomie). Core workflow and design standards for Leon Agentur.
---

# Website Erstellen – Core Skill

## Design-Standards (Pflicht bei jeder Website)

- **Hintergrund:** Dark Mode (#080808, #0f0f0f, #161616) — kein weißer Hintergrund
- **Akzentfarbe:** Gold (#c9a84c) oder branchenspezifische Brand-Farbe
- **Schriften:** Playfair Display (Headlines) + Inter (Fließtext) via Google Fonts CDN
- **Animationen:** GSAP ScrollTrigger + CSS Micro-Animationen
- **Effekte:** Glassmorphism, Parallax Hero, 3D Card Tilt
- **Zielwert:** 1.500–3.000 € — Kunde sagt beim ersten Blick "WOW"

## Must-Haves (jede Website)

- [ ] Sticky Nav mit Scroll-Effekt (transparent → blur/dark)
- [ ] Hero mit Parallax-Hintergrund und Entrance-Animation
- [ ] Trust-Badges (Jahre Erfahrung, Bewertungen, Zertifikate)
- [ ] 3 Leistungskarten mit echten Preisen und Hover-Tilt
- [ ] Testimonials (min. 3, mit Initialen-Avatar und Google-Quelle)
- [ ] Kontaktsektion mit Öffnungszeiten
- [ ] Sticky WhatsApp Button (unten rechts, immer sichtbar)
- [ ] CTA: Telefon (`tel:`) + WhatsApp (`https://wa.me/`)
- [ ] Mobile-first, pixel-perfect (480px, 768px, 1024px Breakpoints)
- [ ] GSAP von cdnjs CDN einbinden (kein npm)

## Anti-Patterns

- ❌ Weißer Hintergrund
- ❌ Generic Stock-Texte ("Willkommen bei uns", "Qualität seit Jahren")
- ❌ Platzhalter statt echter Daten (Preise, Telefon, Adresse)
- ❌ Bootstrap oder andere CSS-Frameworks
- ❌ jQuery
- ❌ HTML als Text in Telegram ausgeben
- ❌ Mehr als 3 externe CDN-Abhängigkeiten
- ❌ Bilder ohne alt-Tag

## Workflow

1. Branchenspezifischen Skill laden (klempner/barbershop/restaurant etc.)
2. Echte Daten vom Kunden verwenden (Name, Telefon, Adresse, Preise)
3. Google Fonts + GSAP über CDN einbinden
4. Website bauen unter `~/projects/[kundenname-slug]/`
5. Dateien: `index.html`, `style.css`, `script.js`
6. Mit `open ~/projects/[slug]/index.html` lokal öffnen
7. Auf Wunsch: zu GitHub Pages oder Vercel deployen
8. URL zurückgeben

## Slug-Regel

`[branche]-[name]-[stadt]` → alles lowercase, Sonderzeichen zu `-`
Beispiel: "Klempner Novak Berlin" → `klempner-novak-berlin`

## Output

NIEMALS HTML-Code als Text im Chat ausgeben.
Immer nur: `✅ Website fertig: ~/projects/[slug]/index.html`
Bei Deployment: `✅ Live: https://[url]`
