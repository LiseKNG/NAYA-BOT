// dashboard-server.js
// Petit serveur web intégré au bot : sert la page du tableau de bord
// (Mini App Telegram) et l'API qui lui fournit les données d'un groupe.
// Tourne dans le même process que le bot Telegraf, sur le port fourni
// par Railway (process.env.PORT).

import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { getLeaderboard } from "./points-store.js";
import { getActiveRoundInfo } from "./word-game.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function startDashboardServer(bot) {
  const app = express();
  app.use(express.static(path.join(__dirname, "public")));

  app.get("/api/dashboard-data", async (req, res) => {
    const chatId = req.query.chat;
    if (!chatId) {
      res.status(400).json({ error: "chat manquant" });
      return;
    }

    let chatTitle = "ce groupe";
    let memberCount = null;
    try {
      const chat = await bot.telegram.getChat(chatId);
      chatTitle = chat.title || chatTitle;
      memberCount = await bot.telegram.getChatMembersCount(chatId).catch(() => null);
    } catch (err) {
      console.error("Erreur récupération infos chat pour dashboard:", err.message);
    }

    res.json({
      chatTitle,
      memberCount,
      leaderboardDaily: getLeaderboard(chatId, "daily").slice(0, 10),
      leaderboardTotal: getLeaderboard(chatId, "total").slice(0, 10),
      activeGame: getActiveRoundInfo(chatId),
    });
  });

  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Serveur du tableau de bord démarré sur le port ${port}.`);
  });
}
