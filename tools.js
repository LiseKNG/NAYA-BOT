// tools.js
// Définit les "outils" que Naya peut utiliser (function calling)
// et leur exécution réelle via l'API Telegram (Telegraf).

import { renderWithPremiumEmojis } from "./premium-emojis.js";
import { getLeaderboard } from "./points-store.js";

// Format OpenAI-compatible (utilisé par Groq) : { type: "function", function: {...} }
export const toolDefinitions = [
  {
    type: "function",
    function: {
      name: "mute_group",
      description:
        "Met le groupe/canal en mode silencieux : seuls les admins peuvent écrire. Utilisé pour des ordres comme 'mets le groupe en veille', 'silence', 'fais dodo le groupe'.",
      parameters: {
        type: "object",
        properties: {
          duration_minutes: {
            type: ["number", "null"],
            description: "Durée du mute en minutes. 0, null ou absent = indéfini (jusqu'à démute manuel).",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "unmute_group",
      description: "Réactive l'écriture pour tous les membres du groupe (annule un mute précédent).",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "create_poll",
      description:
        "Crée un sondage dans le groupe/canal actuel. À utiliser dès que l'utilisateur demande un sondage/vote sur un sujet.",
      parameters: {
        type: "object",
        properties: {
          question: { type: "string", description: "La question du sondage" },
          options: {
            type: "array",
            items: { type: "string" },
            description: "Les choix de réponse (2 à 10)",
          },
          is_anonymous: {
            type: "boolean",
            description: "Sondage anonyme ou non (par défaut: true)",
          },
        },
        required: ["question", "options"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "send_announcement",
      description:
        "Envoie une annonce dans le groupe/canal, éventuellement épinglée. Utilisé pour 'annonce que...', 'préviens tout le monde que...'.",
      parameters: {
        type: "object",
        properties: {
          message: { type: "string", description: "Le texte de l'annonce" },
          pin: { type: "boolean", description: "Épingler le message après envoi (par défaut: true)" },
        },
        required: ["message"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "send_buttons_message",
      description:
        "Envoie un message avec des boutons cliquables (liens) sous le texte. Utilisé quand on demande d'envoyer un message avec des boutons/liens, par exemple 'envoie le lien du règlement avec un bouton'.",
      parameters: {
        type: "object",
        properties: {
          message: { type: "string", description: "Le texte du message" },
          buttons: {
            type: "array",
            description: "Liste des boutons à afficher (max 5)",
            items: {
              type: "object",
              properties: {
                text: { type: "string", description: "Texte affiché sur le bouton" },
                url: { type: "string", description: "Lien vers lequel le bouton pointe" },
              },
              required: ["text", "url"],
            },
          },
        },
        required: ["message", "buttons"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_leaderboard",
      description:
        "Récupère le classement des membres les plus actifs du groupe, basé sur leurs points d'activité. Utilisé pour 'classement', 'qui est le plus actif', 'top membres', 'points'.",
      parameters: {
        type: "object",
        properties: {
          period: {
            type: "string",
            enum: ["today", "alltime"],
            description: "'today' = classement du jour, 'alltime' = classement total depuis le début",
          },
        },
        required: ["period"],
      },
    },
  },
];

/**
 * Exécute réellement l'action Telegram correspondant à l'appel d'outil décidé par Naya.
 * @param {import('telegraf').Context} ctx - Contexte Telegraf du message d'origine
 * @param {string} toolName
 * @param {object} input
 * @returns {Promise<string>} - Résultat en texte brut, utilisé pour que Naya formule sa réponse
 */
export async function executeTool(ctx, toolName, input) {
  const chatId = ctx.chat.id;

  switch (toolName) {
    case "mute_group": {
      const permissions = {
        can_send_messages: false,
        can_send_media_messages: false,
        can_send_polls: false,
        can_send_other_messages: false,
      };
      await ctx.telegram.setChatPermissions(chatId, permissions);
      return input.duration_minutes
        ? `Groupe mis en silence pour ${input.duration_minutes} minutes.`
        : "Groupe mis en silence jusqu'à nouvel ordre.";
    }

    case "unmute_group": {
      const permissions = {
        can_send_messages: true,
        can_send_media_messages: true,
        can_send_polls: true,
        can_send_other_messages: true,
      };
      await ctx.telegram.setChatPermissions(chatId, permissions);
      return "Groupe réactivé, tout le monde peut écrire à nouveau.";
    }

    case "create_poll": {
      await ctx.telegram.sendPoll(chatId, input.question, input.options, {
        is_anonymous: input.is_anonymous ?? true,
      });
      return `Sondage envoyé : "${input.question}".`;
    }

    case "send_announcement": {
      const { text: renderedText, entities } = renderWithPremiumEmojis(`📢 ${input.message}`);
      const sent = await ctx.telegram.sendMessage(chatId, renderedText, { entities });
      if (input.pin ?? true) {
        await ctx.telegram.pinChatMessage(chatId, sent.message_id);
      }
      return `Annonce envoyée${input.pin ?? true ? " et épinglée" : ""}.`;
    }

    case "send_buttons_message": {
      const inlineKeyboard = input.buttons
        .slice(0, 5)
        .map((b) => [{ text: b.text, url: b.url }]);
      await ctx.telegram.sendMessage(chatId, input.message, {
        reply_markup: { inline_keyboard: inlineKeyboard },
      });
      return "Message avec boutons envoyé.";
    }

    case "get_leaderboard": {
      const type = input.period === "today" ? "daily" : "total";
      const board = getLeaderboard(chatId, type).slice(0, 10);
      if (board.length === 0) {
        return "Aucune activité enregistrée pour l'instant dans ce groupe.";
      }
      return board.map((e, i) => `${i + 1}. ${e.name} — ${e.points} points`).join("\n");
    }

    default:
      throw new Error(`Outil inconnu : ${toolName}`);
  }
}
