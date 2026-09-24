// word-game.js
// Jeu "devine le mot" déclenché automatiquement par Naya dans les groupes.
// Contrairement à l'ancien quiz à boutons, les gens répondent en tapant
// directement le mot dans le chat — beaucoup moins répétitif grâce au
// grand dictionnaire de word-dictionary.js.

import { wordDictionary } from "./word-dictionary.js";
import { getAllKnownGroupChats } from "./known-chats.js";
import { addPoints } from "./points-store.js";
import { generateWordHintImage } from "./word-hint-image.js";

const GAME_INTERVAL_HOURS = parseInt(process.env.GAME_INTERVAL_HOURS || "3", 10);
const GAME_FIRST_DELAY_MINUTES = parseInt(process.env.GAME_FIRST_DELAY_MINUTES || "10", 10);
const POINTS_FOR_CORRECT_GUESS = 5;
const ROUND_DURATION_MS = 10 * 60 * 1000; // 10 minutes avant de révéler le mot si personne ne trouve

// chatId -> { word, timeoutId }
const activeRounds = new Map();

/** Enlève les accents et met en minuscules, pour comparer sans piéger les gens sur un accent oublié. */
function normalize(text) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/** Construit un indice plus généreux : catégorie + première/dernière lettre + quelques lettres au hasard révélées. */
function buildHint(entry) {
  const { word, category } = entry;
  const letters = word.split("");
  const revealed = new Set([0, letters.length - 1]); // première et dernière lettre toujours visibles

  // Révèle environ 1 lettre sur 3 en plus, au hasard, pour laisser un vrai défi sans être injouable
  const extraReveals = Math.max(1, Math.floor(letters.length / 3));
  while (revealed.size < 2 + extraReveals && revealed.size < letters.length) {
    revealed.add(Math.floor(Math.random() * letters.length));
  }

  const masked = letters.map((l, i) => (revealed.has(i) ? l.toUpperCase() : "_")).join(" ");
  return `Catégorie : ${category}\n${masked}  (${word.length} lettres)`;
}

async function launchWordGame(bot, chatId) {
  if (activeRounds.has(chatId)) return; // une partie est déjà en cours dans ce groupe

  const entry = wordDictionary[Math.floor(Math.random() * wordDictionary.length)];
  const hintText = buildHint(entry);
  const roundMinutes = ROUND_DURATION_MS / 60000;

  const caption =
    `⚡ Soyez le premier à écrire le mot indiqué sur la photo pour grimper dans le classement du mini-jeu.\n\n` +
    `⏱ Temps restant : ${roundMinutes} minutes`;

  try {
    const imageBuffer = await generateWordHintImage(hintText);
    await bot.telegram.sendPhoto(chatId, { source: imageBuffer }, { caption });
  } catch (err) {
    console.error(`Erreur génération image indice pour ${chatId}:`, err.message);
    // Si l'image échoue, on retombe sur du texte simple pour ne pas bloquer le jeu
    await bot.telegram.sendMessage(chatId, `🔤 Devine le mot !\n\n${hintText}\n\n${caption}`);
  }

  const timeoutId = setTimeout(async () => {
    activeRounds.delete(chatId);
    try {
      await bot.telegram.sendMessage(chatId, `⏰ Personne n'a trouvé... le mot était "${entry.word}" !`);
    } catch (err) {
      console.error(`Erreur révélation mot pour ${chatId}:`, err.message);
    }
  }, ROUND_DURATION_MS);

  activeRounds.set(chatId, { word: entry.word, timeoutId });
}

/**
 * À appeler pour CHAQUE message texte reçu dans un groupe (avant tout autre traitement).
 * Renvoie true si le message était la bonne réponse à une partie en cours (et l'a créditée).
 */
export async function checkWordGuess(ctx) {
  const chatId = ctx.chat.id;
  const round = activeRounds.get(chatId);
  if (!round) return false;

  const guess = normalize(ctx.message.text || "");
  if (guess !== normalize(round.word)) return false;

  clearTimeout(round.timeoutId);
  activeRounds.delete(chatId);

  const name = ctx.from.first_name || ctx.from.username || "quelqu'un";
  addPoints(chatId, ctx.from.id, name, POINTS_FOR_CORRECT_GUESS);

  await ctx.reply(`🎉 Bravo ${name} ! Le mot était bien "${round.word}", tu gagnes ${POINTS_FOR_CORRECT_GUESS} ⭐ !`);
  return true;
}

/**
 * Génère un aperçu du jeu (indice + image) SANS démarrer de vraie partie —
 * utile pour que le grand frère teste le rendu en privé avant que ça parte en groupe.
 * @returns {Promise<{word: string, hintText: string, imageBuffer: Buffer}>}
 */
export async function previewWordGame() {
  const entry = wordDictionary[Math.floor(Math.random() * wordDictionary.length)];
  const hintText = buildHint(entry);
  const imageBuffer = await generateWordHintImage(hintText);
  return { word: entry.word, hintText, imageBuffer };
}

/** Pour le dashboard : dit si une partie est en cours dans ce groupe, sans révéler le mot. */
export function getActiveRoundInfo(chatId) {
  const round = activeRounds.get(chatId);
  return round ? { inProgress: true } : { inProgress: false };
}

/** Démarre la boucle de mini-jeux automatiques (à appeler une fois après bot.launch()). */
export function scheduleAutoWordGames(bot) {
  const intervalMs = GAME_INTERVAL_HOURS * 60 * 60 * 1000;
  const firstDelayMs = GAME_FIRST_DELAY_MINUTES * 60 * 1000;

  function runForAllGroups() {
    for (const chatId of getAllKnownGroupChats()) {
      launchWordGame(bot, chatId).catch((err) =>
        console.error(`Erreur lancement jeu de mot pour ${chatId}:`, err.message)
      );
    }
  }

  // Premier jeu peu après le démarrage (au lieu d'attendre le plein intervalle),
  // puis on reprend la cadence normale ensuite.
  setTimeout(() => {
    runForAllGroups();
    setInterval(runForAllGroups, intervalMs);
  }, firstDelayMs);

  console.log(
    `Jeu "devine le mot" : premier lancement dans ${GAME_FIRST_DELAY_MINUTES} min, puis toutes les ${GAME_INTERVAL_HOURS}h.`
  );
}
