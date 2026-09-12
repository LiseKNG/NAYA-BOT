// tools.js
// Définit les "outils" que Naya peut utiliser (function calling)
// et leur exécution réelle via l'API Telegram (Telegraf).

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
      const sent = await ctx.telegram.sendMessage(chatId, `📢 ${input.message}`);
      if (input.pin ?? true) {
        await ctx.telegram.pinChatMessage(chatId, sent.message_id);
      }
      return `Annonce envoyée${input.pin ?? true ? " et épinglée" : ""}.`;
    }

    default:
      throw new Error(`Outil inconnu : ${toolName}`);
  }
}
