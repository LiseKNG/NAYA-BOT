// menu.js
// Menu principal de Naya : grille de boutons vers ses fonctionnalités
// (classement, jeu, musique, stickers, liens groupe/canal).

// Réutilise les mêmes liens que le welcome — pense à les mettre à jour
// aux deux endroits si tu changes d'URL.
const GROUP_URL = "https://t.me/NayaChat_bySEVEN";
const CHANNEL_URL = "https://t.me/AssistanceNaya";

export function buildMainMenu() {
  return {
    inline_keyboard: [
      [
        { text: "🏆 Classement", callback_data: "menu_leaderboard" },
        { text: "🔤 Jeu du mot", callback_data: "menu_game_info" },
      ],
      [
        { text: "🎵 Musique", callback_data: "menu_music" },
        { text: "😊 Stickers", callback_data: "menu_stickers" },
      ],
      [
        { text: "👥 Groupe", url: GROUP_URL },
        { text: "📢 Canal", url: CHANNEL_URL },
      ],
    ],
  };
}
