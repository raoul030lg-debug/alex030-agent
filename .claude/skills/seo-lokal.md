# SKILL: seo-lokal

## Name
Lokale SEO für Handwerker

## Description
Erstellt vollständige lokale SEO-Strategien und Inhalte für Handwerksbetriebe. Fokus auf Google Maps Ranking, lokale Keywords, On-Page Optimierung und strukturierte Daten.

## Trigger-Keywords
- "lokale SEO"
- "Google Rankings"
- "SEO für Handwerker"
- "seo-lokal"
- "gefunden werden bei Google"
- "Keywords für [Gewerk]"

## Anweisungen

### Input sammeln
- Firmenname, Gewerk, Ort
- Aktuelle Website vorhanden? (URL)
- Ziel: mehr Anrufe, mehr Website-Traffic, besseres Maps-Ranking?
- Budget für Ads? (beeinflusst Empfehlungen)

### Deliverables

#### 1. Keyword-Recherche
Kategorien:
- **Primary:** "[Gewerk] [Ort]" (höchste Priorität)
- **Secondary:** "[Gewerk] [Stadtteil]", "[Gewerk] [Nachbarort]"
- **Long-tail:** "günstig[er] [Gewerk] [Ort]", "[Gewerk] Notdienst [Ort]"
- **Problem-Keywords:** "Rohr gebrochen [Ort]", "Strom ausgefallen [Ort]"

Für jeden Keyword: Suchintention + empfohlener Content-Typ

#### 2. On-Page Checkliste
- Title Tag: `[Gewerk] [Ort] | [Firmenname]` (max. 60 Zeichen)
- Meta Description: Primary Keyword + USP + CTA (max. 155 Zeichen)
- H1: Exaktes Primary Keyword
- H2/H3: Secondary Keywords
- NAP-Konsistenz: Name, Adresse, Telefon identisch überall

#### 3. Structured Data (JSON-LD)
Schema.org `LocalBusiness` Block generieren:
```json
{
  "@context": "https://schema.org",
  "@type": "[Gewerk-Schema-Typ]",
  "name": "",
  "address": { "@type": "PostalAddress", ... },
  "telephone": "",
  "areaServed": ["Ort", "Nachbarorte"],
  "priceRange": "€€"
}
```

#### 4. Content-Plan (3 Monate)
- 4 Blog-Posts/Monat mit Long-tail Keywords
- Themen aus häufigen Kundenfragen
- Jeder Post: 600–800 Wörter, 1 Primary Keyword

#### 5. Google Business Profile Empfehlungen
- Posting-Frequenz: 1× pro Woche
- Foto-Upload: 2× pro Monat (Vorher/Nachher)
- Review-Strategie: wann und wie nach Bewertungen fragen

### Output
Vollständiger SEO-Fahrplan als Markdown mit priorisierten Quick Wins oben
