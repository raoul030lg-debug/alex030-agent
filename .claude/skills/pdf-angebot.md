# SKILL: pdf-angebot

## Name
Angebots-PDF Generator

## Description
Erstellt professionelle Angebots-PDFs für Handwerksbetriebe. Generiert zunächst ein HTML-Template, das per Puppeteer oder wkhtmltopdf zu PDF gerendert wird. Sauber, professionell, DIN-A4.

## Trigger-Keywords
- "erstelle ein Angebot"
- "generiere PDF"
- "Angebots-PDF"
- "Kostenvoranschlag"
- "pdf-angebot"

## Anweisungen

### Input sammeln (nur nachfragen wenn nicht angegeben)
- Absender: Firmenname, Adresse, Tel, E-Mail, ggf. Logo-URL
- Empfänger: Name, Adresse
- Angebotsnummer & Datum (sonst: auto-generieren)
- Positionen: Beschreibung, Menge, Einheit, Einzelpreis
- MwSt-Satz (Standard: 19%)
- Gültigkeitsdauer (Standard: 30 Tage)
- Zahlungsbedingungen (Standard: 14 Tage netto)
- Freitext / Bemerkungen (optional)

### Technische Umsetzung

#### Dependencies
```json
"puppeteer": "^21.0.0"
```

#### Struktur
1. `generateOfferHTML(data)` — baut den HTML-String
2. `renderPDF(html, outputPath)` — Puppeteer rendert zu PDF
3. `createOffer(data)` — Hauptfunktion, gibt Pfad zur PDF zurück

#### HTML-Template Aufbau
- Header: Logo links, Firmendaten rechts
- Empfänger-Block + Angebotsnummer/Datum
- Positionstabelle: Nr. | Beschreibung | Menge | Einheit | Einzelpreis | Gesamtpreis
- Summen-Block: Netto, MwSt, Brutto (fett)
- Footer: Gültigkeit, Zahlungsbedingungen, Bankverbindung-Placeholder
- DIN-A4 CSS: `@page { size: A4; margin: 20mm; }`

#### Berechnungen
- Gesamtpreis je Position: Menge × Einzelpreis
- Nettosumme: Summe aller Positionen
- MwSt-Betrag: Netto × MwSt-Satz
- Bruttosumme: Netto + MwSt

### Output
- `angebot-[Nummer].pdf` im aktuellen Verzeichnis
- Kurze Bestätigung mit Pfad und Gesamtbetrag (Brutto)
