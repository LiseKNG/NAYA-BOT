// ephemeral.js
// Gestion des messages temporaires envoyés par Naya.
// Telegram ne signale pas de façon fiable au bot qu'un utilisateur a "quitté"
// une conversation privée. On utilise donc un délai configurable.

const DEFAULT_SECONDS = 60;
const timers = new Map();

export function getEphemeralDelayMs() {
  const seconds = Number.parseInt(process.env.NAYA_EPHEMERAL_SECONDS || String(DEFAULT_SECONDS), 10);
  const safeSeconds = Number.isFinite(seconds) && seconds >= 5 ? Math.min(seconds, 48 * 60 * 60) : DEFAULT_SECONDS;
  return safeSeconds * 1000;
}

export function scheduleDeletion(telegram, chatId, messageId, delayMs = getEphemeralDelayMs()) {
  const key = `${chatId}:${messageId}`;

  if (timers.has(key)) clearTimeout(timers.get(key));

  const timer = setTimeout(async () => {
    timers.delete(key);
    try {
      await telegram.deleteMessage(chatId, messageId);
    } catch (err) {
      // Le message peut déjà avoir été supprimé, ou Telegram peut refuser
      // la suppression (message trop ancien / droits insuffisants).
      console.warn(`Suppression temporaire impossible pour ${key}:`, err.message);
    }
  }, delayMs);

  timers.set(key, timer);
  return delayMs;
}

export function scheduleDeletionForMessages(telegram, chatId, messageIds, delayMs = getEphemeralDelayMs()) {
  for (const messageId of messageIds) {
    scheduleDeletion(telegram, chatId, messageId, delayMs);
  }
}
