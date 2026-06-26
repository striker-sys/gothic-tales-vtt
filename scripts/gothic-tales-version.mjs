/**
 * Synchronisiert die interne Gothic-Tales-Systemversion mit dem Foundry-Manifest.
 *
 * Das Hauptskript bleibt dadurch stabil, während Manifest, Paketversion und
 * versionsgesteuerter Auto-Import denselben Versionswert verwenden.
 */
Hooks.once("setup", () => {
  if (!game?.gothicTales) return;
  game.gothicTales.SYSTEM_VERSION = game.system?.version ?? "0.6.22";
});
