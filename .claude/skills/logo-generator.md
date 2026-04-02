# SKILL: logo-generator

## Name
Logo Generator via Ideogram API

## Description
Erstellt professionelle Logo-Prompts für Handwerksbetriebe und generiert sie über die Ideogram API. Liefert mehrere Varianten (hell/dunkel, mit/ohne Slogan) und speichert die Ergebnisse lokal.

## Trigger-Keywords
- "erstelle ein Logo"
- "generiere ein Logo"
- "Logo für [Firma/Gewerk]"
- "logo-generator"
- "Ideogram"

## Anweisungen

### Input sammeln (nur nachfragen wenn nicht angegeben)
- Firmenname
- Gewerk
- Gewünschter Stil (modern, klassisch, minimalistisch, handgezeichnet)
- Farbwunsch (sonst: gewerktypisch)
- Slogan vorhanden? (optional)

### Prompt-Erstellung
Baue den Ideogram-Prompt nach diesem Schema:
```
Professional logo for "[Firmenname]", [Gewerk] company.
Style: [Stil], clean, vector-like.
Colors: [Farben].
Include: relevant trade icon/tool symbol.
Text: "[Firmenname]"[, "[Slogan""].
White background, no gradients, suitable for print.
```

### API-Aufruf (Ideogram v2)
```js
POST https://api.ideogram.ai/generate
Headers: { "Api-Key": process.env.IDEOGRAM_API_KEY }
Body: {
  "image_request": {
    "prompt": "<prompt>",
    "aspect_ratio": "ASPECT_1_1",
    "model": "V_2",
    "magic_prompt_option": "OFF"
  }
}
```

### Varianten generieren
1. Primär-Logo (farbig, quadratisch)
2. Monochrom-Variante (schwarzer Hintergrund)
3. Horizontale Version (16:9 Aspect Ratio) wenn Slogan vorhanden

### Output
- URLs der generierten Bilder ausgeben
- Prompt dokumentieren (für spätere Anpassungen)
- Hinweis: Bilder herunterladen und lokal speichern, da URLs ablaufen
