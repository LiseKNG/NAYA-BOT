// index.js
// Point d'entrée du bot Naya : reçoit les messages Telegram,
// vérifie les droits (grand frère / autorisés / essai gratuit / accès payant),
// garde un petit historique par groupe, et délègue à naya.js.

import "dotenv/config";
import { Telegraf } from "telegraf";
import { handleMessage } from "./naya.js";
import { getWelcomeConfig, formatWelcome } from "./welcome-config.js";
import { renderWithPremiumEmojis } from "./premium-emojis.js";

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

const OWNER_ID = process.env.OWNER_USER_ID;
const AUTHORIZED_IDS = (process.env.AUTHORIZED_USER_IDS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

// Canaux/groupes obligatoires à rejoindre pour débloquer l'essai gratuit.
// Format : @nomducanal ou ID numérique (-100...), séparés par des virgules.
// Naya doit être admin dans ces canaux/groupes pour pouvoir vérifier l'adhésion.
const REQUIRED_CHANNELS = (process.env.REQUIRED_CHANNELS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const TRIAL_DURATION_MS = 3 * 24 * 60 * 60 * 1000; // 3 jours

// Stockage en mémoire des essais gratuits démarrés (userId -> timestamp de début).
// ⚠️ Remis à zéro si le bot redémarre — à remplacer par une vraie base de données
// si tu veux que les essais persistent entre les redéploiements.
const trialStarts = new Map();

// Historique court en mémoire, par chat.
const chatHistories = new Map();
const MAX_HISTORY = 10;

function isOwner(userId) {
  return String(userId) === String(OWNER_ID);
}

function isPaidAuthorized(userId) {
  return AUTHORIZED_IDS.includes(String(userId));
}

/** Vérifie que l'utilisateur a bien rejoint TOUS les canaux requis. */
async function hasJoinedAllChannels(telegram, userId) {
  if (REQUIRED_CHANNELS.length === 0) return true; // rien de requis = ok

  for (const channel of REQUIRED_CHANNELS) {
    try {
      const member = await telegram.getChatMember(channel, userId);
      const validStatuses = ["member", "administrator", "creator"];
      if (!validStatuses.includes(member.status)) return false;
    } catch (err) {
      // Naya n'est probablement pas admin du canal, ou l'utilisateur n'existe pas dedans
      console.error(`Erreur vérification adhésion ${channel}:`, err.message);
      return false;
    }
  }
  return true;
}

function joinChannelsMessage() {
  const links = REQUIRED_CHANNELS.map((c) => `- ${c}`).join("\n");
  return `Pour débloquer un essai gratuit de 3 jours avec moi, rejoins d'abord ${
    REQUIRED_CHANNELS.length > 1 ? "tous ces canaux" : "ce canal"
  } :\n${links}\n\nUne fois fait, réécris-moi ! 😊`;
}

function paymentMessage() {
  return "Ton essai gratuit de 3 jours est terminé ! Pour continuer à discuter avec moi et me donner des ordres, il faut un accès : 10 ⭐ ou 1 💎 par semaine. Demande à mon grand frère pour en savoir plus 💕";
}

/**
 * Détermine si l'utilisateur a accès à Naya en ce moment, et démarre
 * son essai gratuit si c'est la première fois qu'il remplit les conditions.
 * @returns {Promise<{access: boolean, reason?: string}>}
 */
async function resolveAccess(ctx) {
  const userId = ctx.from.id;

  if (isOwner(userId) || isPaidAuthorized(userId)) {
    return { access: true };
  }

  const joined = await hasJoinedAllChannels(ctx.telegram, userId);
  if (!joined) {
    return { access: false, reason: "needs-join" };
  }

  const trialStart = trialStarts.get(String(userId));
  if (!trialStart) {
    // Première fois qu'il remplit les conditions : on démarre son essai.
    trialStarts.set(String(userId), Date.now());
    return { access: true };
  }

  const elapsed = Date.now() - trialStart;
  if (elapsed < TRIAL_DURATION_MS) {
    return { access: true };
  }

  return { access: false, reason: "trial-expired" };
}

// Naya ne répond que si on l'appelle par son nom dans les groupes,
// ou toujours en message privé.
function shouldRespond(ctx, text) {
  if (ctx.chat.type === "private") return true;
  return /\bnaya\b/i.test(text);
}

bot.on("new_chat_members", async (ctx) => {
  const config = getWelcomeConfig(ctx.chat);

  for (const member of ctx.message.new_chat_members) {
    // On ignore le cas où c'est Naya elle-même qu'on vient d'ajouter au groupe
    if (member.id === ctx.botInfo.id) continue;

    const text = formatWelcome(config.welcomeText, {
      name: member.first_name || "toi",
      chatTitle: ctx.chat.title || "ce groupe",
    });

    const extra = {};
    if (config.buttons && config.buttons.length > 0) {
      extra.reply_markup = {
        inline_keyboard: config.buttons.map((b) => [{ text: b.text, url: b.url }]),
      };
    }

    await ctx.reply(text, extra);
  }
});

bot.on("text", async (ctx) => {
  const text = ctx.message.text;
  if (!shouldRespond(ctx, text)) return;

  const { access, reason } = await resolveAccess(ctx);
  if (!access) {
    if (reason === "needs-join") {
      await ctx.reply(joinChannelsMessage());
    } else {
      await ctx.reply(paymentMessage());
    }
    return;
  }

  const chatId = ctx.chat.id;
  const history = chatHistories.get(chatId) || [];
  const senderIsOwner = isOwner(ctx.from.id);

  try {
    const reply = await handleMessage(ctx, text, history, { isOwner: senderIsOwner });

    history.push({ role: "user", content: text });
    history.push({ role: "assistant", content: reply });
    chatHistories.set(chatId, history.slice(-MAX_HISTORY));

    const { text: renderedText, entities } = renderWithPremiumEmojis(reply);
    await ctx.telegram.sendMessage(chatId, renderedText, { entities });
  } catch (err) {
    console.error("Erreur Naya:", err);
    await ctx.reply("Oups, j'ai eu un petit souci... tu peux réessayer ? 😅");
  }
});

bot.launch();
console.log("Naya est en ligne 🌙");

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
