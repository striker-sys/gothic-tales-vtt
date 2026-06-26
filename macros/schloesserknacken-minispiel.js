// Gothic Tales – Schlösserknacken-Minispiel
// Dieses Makro öffnet das SL-Fenster bereits mit Beispielwerten.
// Passe difficulty, hideCount und switches nach Bedarf an.
// switches: "left" = Links, "right" = Rechts

game.gothicTales.professions.lockpicking.open({
  difficulty: 15,
  hideCount: false,
  switches: ["left", "right", "left", "right"],
  userId: ""
});
