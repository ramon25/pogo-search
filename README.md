# PoGO Box-Cleanup – Suchstring-Generator

Ein statisches, mobil-freundliches Web-Tool, das aus an-/abwählbaren Kriterien einen
kopierbaren **Pokémon-GO-Suchstring** generiert, mit dem man die Pokémon-Box gefahrlos
aufräumt: Es findet Transfer-Kandidaten, ohne dass Wertvolles im Ergebnis landen kann.

## Prinzip: Ausschluss statt „Müll suchen"

Das Tool baut eine reine UND-Kette aus verneinten Schutz-Kriterien:

```
0*,1*,2*&!Schillernd&!Glücks&!Crypto&!erlöst&!kostümiert&!4*&!legendär&!mysteriös&!Favorit&!XXL&!XXS&!Dynamax&!Gigadynamax&!Entfernung100-&!Alter730-
```

Wichtige Spielmechanik, auf der die Logik basiert:

- **Lokalisierte Begriffe:** Im deutsch eingestellten Spiel funktionieren nur die
  deutschen Suchbegriffe, im englischen nur die englischen → Sprach-Umschalter DE/EN
  (Default DE). Stern-Notation (`0*`–`4*`) und Operatoren sind sprachunabhängig.
- **Präzedenz:** `&` = UND, `,` = ODER, `!` = NICHT. ODER wird **immer vor** UND
  ausgewertet: `0*,1*,2*&!Schillernd` = `(0* ODER 1* ODER 2*) UND !Schillernd`.
- **Distanz** misst ab dem aktuellen Standort → Hinweis im Tool, die Suche zuhause
  auszuführen.
- **200-Zeichen-Limit** der Suchleiste → Live-Zeichenzähler mit Warnung.

## Features

- Schutz-Toggles (Shiny, Glücks, Crypto, erlöst, kostümiert, 4★, legendär, mysteriös,
  Favorit, XXL, XXS, Dynamax, Gigadynamax, Spezialattacken `@spezial`) –
  standardmässig alle an
- Parametrisch: Distanz in km, Alter in Tagen **oder** Fangjahre (Multi-Select)
- Ziel-Stufen 0★–3★ (ODER-Gruppe), „Low WP", „Alle nicht-Geschützten"
- **Sicherer Modus:** pro Ziel-Stufe eine eigene reine UND-Zeile
- **Auto-Split:** überschreitet der String 200 Zeichen, werden die Ziele automatisch
  auf mehrere Teilsuchen verteilt – jede Teilsuche behält alle Ausschlüsse
- Vorschau-Chips der aktiven Ziele und Ausschlüsse
- Kopieren-Button (Clipboard API mit `execCommand`-Fallback), Zeichenzähler `n / 200`
- Konfiguration + eigene Presets in `localStorage`, eingebaute Vorlagen
  (Standard/Konservativ/Aggressiv/Alles Ungeschützte), „Reset auf Standard"
- **Teilbarer Link:** „Link teilen" kopiert eine URL mit der aktuellen Konfiguration
  (`?c=…`), die beim Öffnen automatisch übernommen wird
- Erklär-Sektion „So räumst du sicher auf" mit Sortier-Tipp
- **PWA:** auf dem Handy installierbar („Zum Home-Bildschirm hinzufügen"),
  funktioniert nach dem ersten Besuch auch offline
- Mobile-first, Dark Mode (System-Präferenz + manueller Toggle)

## Entwicklung

```bash
npm install
npm run dev      # Dev-Server auf http://localhost:5173/pogo-search/
npm test         # Vitest-Suite für die Generierungs-Logik (src/lib/buildQuery.ts)
npm run build    # Statisches Bundle nach dist/
npm run preview  # Gebautes Bundle lokal testen
```

## Deployment auf GitHub Pages (Schritt für Schritt)

1. **`base` in `vite.config.ts` prüfen/anpassen.** Der Wert muss
   `'/<REPO-NAME>/'` sein. Für dieses Repo (`pogo-search`) ist bereits
   `base: '/pogo-search/'` gesetzt – bei einem anderen Repo-Namen entsprechend ändern.
   (Ohne korrektes `base` findet die Seite unter dem Pages-Unterpfad ihre Assets nicht.)
2. **Pages-Quelle umstellen:** Im GitHub-Repo unter
   **Settings → Pages → Build and deployment → Source** die Option
   **„GitHub Actions"** auswählen.
3. **Auf `main` pushen.** Der Workflow `.github/workflows/deploy.yml` baut das Projekt
   (inkl. Tests) und deployt automatisch auf Pages.
4. Die Seite ist danach unter `https://<USER>.github.io/<REPO-NAME>/` erreichbar –
   die URL steht auch im Workflow-Run („deploy"-Job).

## Projektstruktur

```
├─ .github/workflows/deploy.yml   # Build + Deploy auf GitHub Pages
├─ src/
│  ├─ data/terms.ts               # Verifizierte Term-Map DE/EN
│  ├─ lib/buildQuery.ts           # Generierungs-Logik (unit-getestet)
│  ├─ lib/buildQuery.test.ts      # Vitest-Suite
│  ├─ lib/clipboard.ts            # Kopieren mit Fallback
│  ├─ hooks/useLocalStorage.ts    # Persistenz-Hook
│  ├─ components/                 # UI-Bausteine
│  ├─ App.tsx / main.tsx / index.css
├─ vite.config.ts                 # base: '/<REPO-NAME>/'
└─ index.html
```
