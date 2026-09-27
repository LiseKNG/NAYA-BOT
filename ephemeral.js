// ephemeral.js
// Envoie des messages qui se suppriment automatiquement après un délai,
// façon message éphémère (uniquement utilisable en conversation privée).

/** Programme la suppression d'un message envoyé, après ttlMs millisecondes. */
function scheduleDeletion(telegram, chatId, messageId, ttlMs) {
  setTimeout(async () => {
    try {
      await telegram.deleteMessage(chatId, messageId);
    } catch (err) {
      console.error(`Erreur suppression message éphémère ${messageId} dans ${chatId}:`, err.message);
    }
  }, ttlMs);
}

/**
 * Envoie un message qui se supprime tout seul après ttlSeconds.
 * @param {import('telegraf').Telegram} telegram
 * @param {number|string} chatId
 * @param {string} text
 * @param {number} ttlSeconds - durée avant suppression (par défaut 30s)
 */
export async function sendEphemeralMessage(telegram, chatId, text, ttlSeconds = 30) {
  const sent = await telegram.sendMessage(chatId, text);
  scheduleDeletion(telegram, chatId, sent.message_id, ttlSeconds * 1000);
  return sent;
}
