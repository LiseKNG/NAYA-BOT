// scheduler.js
// Programme l'annonce quotidienne du membre le plus actif de chaque groupe,
// puis remet les compteurs du jour à zéro.

import { getLeaderboard, resetDaily, getAllChatIds } from "./points-store.js";
import { renderWithPremiumEmojis } from "./premium-emojis.js";

// Heure de l'annonce quotidienne (0-23, heure du serveur Railway = UTC par défaut).
// Configurable via la variable d'environnement DAILY_ANNOUNCEMENT_HOUR.
const ANNOUNCEMENT_HOUR = parseInt(process.env.DAILY_ANNOUNCEMENT_HOUR || "20", 10);

function msUntilNextHour(hour) {
  const now = new Date();
  const next = new Date(now);
  next.setHours(hour, 0, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  return next - now;
}

async function runAnnouncement(bot) {
  for (const chatId of getAllChatIds()) {
    const board = getLeaderboard(chatId, "daily");
    if (board.length === 0) {
      resetDaily(chatId);
      continue;
    }

    const top = board[0];
    const message = `🏆 Le membre le plus actif aujourd'hui, c'est ${top.name} avec ${top.points} points ! Bravo à toi :sparkle:`;
    const { text, entities } = renderWithPremiumEmojis(message);

    try {
      await bot.telegram.sendMessage(chatId, text, { entities });
    } catch (err) {
      console.error(`Erreur envoi annonce quotidienne pour ${chatId}:`, err.message);
    }

    resetDaily(chatId);
  }
}

/** Démarre la boucle d'annonce quotidienne (à appeler une fois après bot.launch()). */
export function scheduleDailyAnnouncement(bot) {
  const delay = msUntilNextHour(ANNOUNCEMENT_HOUR);
  console.log(`Prochaine annonce du classement dans ${Math.round(delay / 60000)} minutes.`);

  setTimeout(() => {
    runAnnouncement(bot);
    setInterval(() => runAnnouncement(bot), 24 * 60 * 60 * 1000);
  }, delay);
}
