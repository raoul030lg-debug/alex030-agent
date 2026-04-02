# SKILL: lead-scraper

## Name
Lead Scraper für Handwerker (Google Maps)

## Description
Findet Handwerksbetriebe über die Google Maps / Places API und exportiert strukturierte Lead-Listen als CSV. Für die eigene Akquise oder als Dienstleistung für Agenturen.

## Trigger-Keywords
- "finde Handwerker"
- "scrape Leads"
- "Lead Scraper"
- "Google Maps Leads"
- "lead-scraper"
- "Handwerker in [Ort]"

## Anweisungen

### Input sammeln (nur nachfragen wenn nicht angegeben)
- Gewerk / Suchbegriff (z. B. "Elektriker", "Sanitär", "Maler")
- Ort / PLZ / Region
- Radius in km (Standard: 10 km)
- Maximale Anzahl Ergebnisse (Standard: 50)
- Gewünschte Felder im Export

### Technische Umsetzung

#### API: Google Places (New)
```
GET https://maps.googleapis.com/maps/api/place/textsearch/json
  ?query=[Gewerk]+in+[Ort]
  &radius=[Radius in Meter]
  &type=establishment
  &key=process.env.GOOGLE_MAPS_API_KEY
```

Für Details (Telefon, Website):
```
GET https://maps.googleapis.com/maps/api/place/details/json
  ?place_id=[place_id]
  &fields=name,formatted_phone_number,website,formatted_address,rating,user_ratings_total
  &key=process.env.GOOGLE_MAPS_API_KEY
```

#### Pagination
- Bis zu 3 Seiten à 20 Ergebnisse (next_page_token)
- 2 Sekunden Pause zwischen Seiten (API-Limit)

#### CSV-Export Felder
| Feld               | Quelle            |
|--------------------|-------------------|
| Firmenname         | name              |
| Adresse            | formatted_address |
| Telefon            | formatted_phone_number |
| Website            | website           |
| Google-Rating      | rating            |
| Anzahl Bewertungen | user_ratings_total |
| Place ID           | place_id          |

### Lead-Qualifizierung
Leads markieren:
- `HOT` — kein Website-Eintrag (braucht Website)
- `WARM` — Website vorhanden, < 10 Bewertungen (braucht Reviews/SEO)
- `COLD` — Website + viele Bewertungen

### Output
- `leads-[Gewerk]-[Ort]-[Datum].csv` im aktuellen Verzeichnis
- Zusammenfassung: Anzahl Leads gesamt, davon HOT/WARM/COLD
