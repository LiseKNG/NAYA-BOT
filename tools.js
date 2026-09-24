// tools.js
// Définit les "outils" que Naya peut utiliser (function calling)
// et leur exécution réelle via l'API Telegram (Telegraf).

import { renderWithPremiumEmojis } from "./premium-emojis.js";
import { getLeaderboard } from "./points-store.js";
import { generateLeaderboardImage } from "./leaderboard-image.js";
import { getAllKnownChats } from "./known-chats.js";
import { stickers } from "./sticker-library.js";
import { searchTrack } from "./spotify.js";
import { previewWordGame } from "./word-game.js";
import { scheduleDeletion, getEphemeralDelayMs } from "./ephemeral.js";

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
        "Récupère le classement des membres les plus actifs du groupe, basé sur leurs étoiles d'activité. Utilisé pour 'classement', 'qui est le plus actif', 'top membres', 'étoiles'.",
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
  {
    type: "function",
    function: {
      name: "broadcast_announcement",
      description:
        "Envoie une annonce générale à TOUT LE MONDE qui a déjà parlé à Naya, en privé et dans les groupes. Réservé au grand frère. Utilisé pour 'annonce à tout le monde que...', 'préviens tous ceux qui m'ont déjà parlé'.",
      parameters: {
        type: "object",
        properties: {
          message: { type: "string", description: "Le texte de l'annonce générale" },
        },
        required: ["message"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "send_sticker",
      description:
        "Envoie un sticker qui correspond à ton humeur du moment, en complément de ta réponse texte. Utilise-le quand ta réponse porte une émotion forte (joie, tristesse, surprise, rire, tendresse, timidité, agacement...), pas à chaque message.",
      parameters: {
        type: "object",
        properties: {
          mood: {
            type: "string",
            enum: ["happy", "love", "sad", "laugh", "surprised", "wave", "shy", "angry"],
            description: "L'humeur qui correspond le mieux à ta réponse",
          },
        },
        required: ["mood"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "send_temporary_sticker",
      description:
        "Envoie un sticker non explicite comme contenu temporaire, puis le supprime automatiquement après un délai configuré. À utiliser uniquement pour les stickers de la bibliothèque Naya.",
      parameters: {
        type: "object",
        properties: {
          mood: {
            type: "string",
            enum: ["happy", "love", "sad", "laugh", "surprised", "wave", "shy", "angry"],
            description: "L'humeur du sticker à envoyer.",
          },
          delay_seconds: {
            type: "number",
            description: "Délai avant suppression. Si absent, utilise NAYA_EPHEMERAL_SECONDS.",
          },
        },
        required: ["mood"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_song",
      description:
        "Cherche une chanson sur Spotify et envoie un extrait de 30 secondes (quand disponible) accompagné d'un lien pour l'écouter en entier sur Spotify. Utilisé pour 'joue-moi...', 'trouve la chanson...', 'mets de la musique...', 'écoute...'.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Titre et/ou artiste de la chanson recherchée" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "preview_word_game",
      description:
        "Génère un aperçu du mini-jeu 'devine le mot' (indice + image) en privé, SANS lancer de vraie partie dans un groupe. Réservé au grand frère, pour tester le rendu avant que ça parte en vrai.",
      parameters: { type: "object", properties: {} },
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

      const title = type === "daily" ? "Classement du jour" : "Classement général";
      const textList = board.map((e, i) => `${i + 1}. ${e.name} — ${e.points} ⭐`).join("\n");

      try {
        const imageBuffer = await generateLeaderboardImage(board, title);
        await ctx.telegram.sendPhoto(
          chatId,
          { source: imageBuffer },
          { caption: `${title} :\n${textList}` }
        );
        return "Classement envoyé avec l'image et le texte.";
      } catch (err) {
        console.error("Erreur génération image classement:", err.message);
        // Si l'image échoue pour une raison ou une autre, on retombe sur du texte simple
        return `${title} :\n${textList}`;
      }
    }

    case "broadcast_announcement": {
      const { text: renderedText, entities } = renderWithPremiumEmojis(`📢 ${input.message}`);
      const chats = getAllKnownChats();
      let sentCount = 0;

      for (const chat of chats) {
        try {
          await ctx.telegram.sendMessage(chat.id, renderedText, { entities });
          sentCount++;
        } catch (err) {
          // On ignore les chats où l'envoi échoue (bot bloqué, quitté, etc.)
          console.error(`Erreur diffusion vers ${chat.id}:`, err.message);
        }
      }

      return `Annonce diffusée à ${sentCount} conversation(s).`;
    }

    case "send_temporary_sticker": {
      const fileId = stickers[input.mood];
      if (!fileId || fileId === "REMPLACE_PAR_LE_FILE_ID") {
        return "Sticker pas encore configuré pour cette humeur.";
      }

      const sent = await ctx.telegram.sendSticker(chatId, fileId);
      const requestedSeconds = Number(input.delay_seconds);
      const delayMs = Number.isFinite(requestedSeconds) && requestedSeconds >= 5
        ? Math.min(requestedSeconds, 48 * 60 * 60) * 1000
        : getEphemeralDelayMs();

      scheduleDeletion(ctx.telegram, chatId, sent.message_id, delayMs);
      return `Sticker temporaire envoyé. Il sera supprimé automatiquement dans ${Math.round(delayMs / 1000)} seconde(s).`;
    }

    case "send_sticker": {
      const fileId = stickers[input.mood];
      if (!fileId || fileId === "REMPLACE_PAR_LE_FILE_ID") {
        return "Sticker pas encore configuré pour cette humeur, pas grave.";
      }
      await ctx.telegram.sendSticker(chatId, fileId);
      return "Sticker envoyé.";
    }

    case "search_song": {
      const track = await searchTrack(input.query);
      if (!track) {
        return "Aucune chanson trouvée pour cette recherche.";
      }

      const caption = `🎵 <b>${track.name}</b>\n${track.artist}`;
      const keyboard = {
        inline_keyboard: [[{ text: "▶️ Écouter en entier sur Spotify", url: track.spotifyUrl }]],
      };

      if (track.previewUrl) {
        await ctx.telegram.sendAudio(chatId, track.previewUrl, {
          caption,
          parse_mode: "HTML",
          reply_markup: keyboard,
          title: track.name,
          performer: track.artist,
        });
        return "Extrait de 30 secondes envoyé avec le lien Spotify.";
      }

      if (track.albumArt) {
        await ctx.telegram.sendPhoto(chatId, track.albumArt, {
          caption: `${caption}\n\n(pas d'extrait audio disponible pour ce titre)`,
          parse_mode: "HTML",
          reply_markup: keyboard,
        });
      } else {
        await ctx.telegram.sendMessage(chatId, caption, { parse_mode: "HTML", reply_markup: keyboard });
      }
      return "Pas d'extrait audio disponible pour ce titre, lien Spotify envoyé.";
    }

    case "preview_word_game": {
      const { word, hintText, imageBuffer } = await previewWordGame();
      await ctx.telegram.sendPhoto(
        chatId,
        { source: imageBuffer },
        {
          caption:
            `👀 Aperçu (pas une vraie partie) :\n\n${hintText}\n\n` +
            `Le mot était : "${word}"`,
        }
      );
      return "Aperçu envoyé.";
    }

    default:
      throw new Error(`Outil inconnu : ${toolName}`);
  }
}
