---
name: barbershop
description: Use when building a website for a barbershop, Friseur, hair salon, Friseursalon, Herrenfriseur, or barber in Germany.
---

# Barbershop / Friseur Website Skill

## Design-Regeln

- **Stil:** Klassisch-Premium oder Modern-Urban — niemals beides mischen
- **Klassisch:** Dunkelgrün (#1a2e1a) oder Dunkelblau (#0d1b2a) + Gold (#c9a84c) + Creme (#f5f0e8)
- **Urban:** Schwarz (#080808) + Neonakzent (Weiß oder Electric Blue #4fc3f7)
- **Schrift:** Playfair Display für klassisch / Space Grotesk für urban + Inter
- **Atmosphäre:** Männlich, gepflegt, exklusiv — wie ein Private Members Club

## Must-Haves

- [ ] Online-Buchungsbutton prominent (Treatwell / Booksy / WhatsApp)
- [ ] Preisliste (alle Schnitte mit Preis, keine "auf Anfrage")
- [ ] Team-Sektion (Barber mit Spezialgebiet)
- [ ] Vorher/Nachher oder Galerie-Sektion (CSS Grid)
- [ ] Öffnungszeiten + Adresse + Google Maps Link
- [ ] Instagram-Feed-Teaser (Link zu Profil)
- [ ] Walk-in vs. Termin klar kommunizieren

## Preisliste (Standard-Set)

| Leistung | Preis |
|---|---|
| Herrenhaarschnitt | ab 35 € |
| Bart trimmen | ab 20 € |
| Haarschnitt + Bart | ab 50 € |
| Rasur (klassisch) | ab 35 € |
| Kinderhaarschnitt (bis 12) | ab 22 € |
| Damenhaarschnitt | ab 55 € |
| Coloration | ab 80 € |

## Anti-Patterns

- ❌ Pink oder pastellige Farben (außer bei reinem Damensalon)
- ❌ Stock-Fotos von fremden Friseuren (lieber CSS-Platzhalter)
- ❌ Preise verstecken oder "Preise auf Anfrage"
- ❌ Zu viele Services auf einmal — Fokus auf Kernleistungen

## Sektionen-Reihenfolge

1. Hero (Atmo-Headline, Buchungs-CTA + Galerie-Teaser)
2. Preisliste (clean, tabellarisch, kein Karten-Chaos)
3. Team / Barber-Vorstellung
4. Galerie / Styles
5. Bewertungen
6. Kontakt + Öffnungszeiten + Maps-Link
7. Footer

## Sonder-Feature

Galerie-Grid mit CSS Masonry (`grid-template-rows: masonry` oder JS-Fallback)
und Hover-Overlay mit Dienstleistungs-Tag.
