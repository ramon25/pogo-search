/** Kurzanleitung: sicherer Aufräum-Workflow in drei Schritten. */
export function Explainer() {
  return (
    <details className="group rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between text-base font-semibold text-zinc-900 dark:text-zinc-100">
        So räumst du sicher auf
        <span className="text-zinc-400 transition-transform group-open:rotate-180">▾</span>
      </summary>
      <ol className="mt-2 list-decimal space-y-3 pl-5 text-sm text-zinc-700 dark:text-zinc-300">
        <li>
          <strong>Erst Schutz pflegen:</strong> Markiere alles, was dir persönlich wichtig
          ist, als <em>Favorit</em> (Herz-Symbol) – Favoriten sind hier standardmässig
          ausgeschlossen und lassen sich im Spiel ohnehin nicht verschicken.
        </li>
        <li>
          <strong>Suchstring einfügen:</strong> Kopiere den generierten String und füge
          ihn im Spiel in die Suchleiste der Pokémon-Box ein. Bei mehreren Teilsuchen
          (sicherer Modus / Auto-Aufteilung) eine nach der anderen abarbeiten.
        </li>
        <li>
          <strong>Prüfen &amp; transferieren:</strong> Sortiere das Ergebnis nach{' '}
          <em>Nummer</em>, um Dubletten leichter zu erkennen. Dann lange auf ein Pokémon
          tippen, weitere antippen (Mehrfachauswahl) und gesammelt verschicken.
        </li>
      </ol>
      <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
        Das Ergebnis enthält konstruktionsbedingt nur Pokémon, die KEIN aktives
        Schutz-Kriterium erfüllen – kontrollier trotzdem kurz, bevor du transferierst.
      </p>
    </details>
  )
}
