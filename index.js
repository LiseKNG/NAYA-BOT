// index.js
// Point d'entrée du bot Naya : reçoit les messages Telegram,
// vérifie les droits, garde un petit historique par groupe,
// et délègue la compréhension + l'action à naya.js.

import "dotenv/config";
import { Telegraf } from "telegraf";
import { handleMessage } from "./naya.js";

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

const OWNER_ID = process.env.OWNER_USER_ID;
const AUTHORIZED_IDS = (process.env.AUTHORIZED_USER_IDS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

// Historique court en mémoire, par chat (à remplacer par une vraie DB si tu veux
// que Naya garde la mémoire après un redémarrage du bot).
const chatHistories = new Map();
const MAX_HISTORY = 10;

function isOwner(userId) {
  return String(userId) === String(OWNER_ID);
}

function isAuthorized(userId) {
  return isOwner(userId) || AUTHORIZED_IDS.includes(String(userId));
}

// Naya ne répond que si on l'appelle par son nom dans les groupes,
// ou toujours en message privé.
function shouldRespond(ctx, text) {
  if (ctx.chat.type === "private") return true;
  return /\bnaya\b/i.test(text);
}

bot.on("text", async (ctx) => {
  const text = ctx.message.text;
  if (!shouldRespond(ctx, text)) return;

  // Accès complet (conversation + actions) réservé au grand frère et aux
  // personnes autorisées. Les autres reçoivent le message d'accès payant.
  if (!isAuthorized(ctx.from.id)) {
    await ctx.reply(
      "Hey ! Pour discuter avec moi ou me donner des ordres ici, il faut un accès : 10 ⭐ ou 1 💎 par semaine. Demande à mon grand frère pour en savoir plus 😊"
    );
    return;
  }

  const chatId = ctx.chat.id;
  const history = chatHistories.get(chatId) || [];
  const senderIsOwner = isOwner(ctx.from.id);

  try {
    const reply = await handleMessage(ctx, text, history, { isOwner: senderIsOwner });

    // Met à jour l'historique (limité pour ne pas exploser le contexte)
    history.push({ role: "user", content: text });
    history.push({ role: "assistant", content: reply });
    chatHistories.set(chatId, history.slice(-MAX_HISTORY));

    await ctx.reply(reply);
  } catch (err) {
    console.error("Erreur Naya:", err);
    await ctx.reply("Oups, j'ai eu un petit souci... tu peux réessayer ? 😅");
  }
});

bot.launch();
console.log("Naya est en ligne 🌙");

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
