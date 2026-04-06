---
name: restaurant
description: Use when building a website for a restaurant, café, bistro, Gaststätte, Imbiss, or food business in Germany.
---

# Restaurant / Café Website Skill

## Design-Regeln

- **Fine Dining:** Schwarz (#080808) + Gold (#c9a84c) + Creme (#f0ebe0) — Playfair Display
- **Casual / Bistro:** Dunkeloliv (#1a1f0f) oder Weinrot (#1a0a0a) + warme Töne — Space Grotesk
- **Fast Casual / Imbiss:** Energetisch: Dunkel + Orange (#e85d04) oder Rot (#c1121f)
- **Atmosphäre:** Warm, einladend, Hunger machen — durch Typografie, nicht Bilder

## Must-Haves

- [ ] Speisekarte (mind. Top 5 Gerichte mit Preis, Link zur Vollkarte)
- [ ] Reservierungs-CTA (OpenTable / Resy / Telefon / WhatsApp)
- [ ] Öffnungszeiten prominent (mit Küchenschluss)
- [ ] Adresse + Google Maps Link
- [ ] Mittagsangebot / Tagesmenü falls vorhanden
- [ ] Lieferdienst-Links (Lieferando, Uber Eats) falls relevant
- [ ] Allergen-Hinweis im Footer
- [ ] Atmosphäre-Sektion ("Unsere Geschichte" in 2–3 Sätzen)

## Speisekarte (Design-Regel)

Karte als elegante Liste, nicht als Karten-Grid:
```
Gericht Name ........................ 18 €
Kurze Beschreibung in einer Zeile
```
Punkte-Leader zwischen Name und Preis (CSS `leader dots`).

## Anti-Patterns

- ❌ PDF-Menü als einzige Option (muss inline lesbar sein)
- ❌ Lebensmittel-Stock-Fotos von Shutterstock
- ❌ Automatisch abspielende Musik oder Videos
- ❌ Flash-Animationen oder zu viel Bewegung (Hunger ≠ Motion Sickness)
- ❌ Preise ohne Mehrwertsteuer-Hinweis

## Sektionen-Reihenfolge

1. Hero (Atmo-Headline, Reservierung-CTA, Öffnungszeiten-Teaser)
2. Highlight-Speisen (3–5 Signature Dishes)
3. Über das Restaurant / Geschichte
4. Vollständige Speisekarte (aufklappbar per Kategorie)
5. Bewertungen (Google + TripAdvisor)
6. Reservierung + Kontakt + Adresse
7. Footer mit Allergen-Hinweis

## Sonder-Feature

Animiertes Speisekarten-Akkordeon: Kategorien (Vorspeisen, Hauptgerichte, Desserts, Getränke) öffnen smooth per GSAP.
