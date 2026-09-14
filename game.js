// game.js
// Mini-jeu quiz déclenché automatiquement par Naya dans les groupes.
// Gère l'état des parties en cours et l'attribution des points.

import { getRandomQuestion } from "./game-questions.js";
import { getAllKnownGroupChats } from "./known-chats.js";
import { addPoints } from "./points-store.js";

// Toutes les X heures, Naya lance un quiz dans chaque groupe connu.
const GAME_INTERVAL_HOURS = parseInt(process.env.GAME_INTERVAL_HOURS || "3", 10);
const POINTS_FOR_CORRECT_ANSWER = 5;

// chatId -> { question, messageId, answeredUsers: Set }
const activeGames = new Map();

function buildQuizKeyboard(chatId, options) {
  return {
    inline_keyboard: options.map((opt, i) => [
      { text: opt, callback_data: `quiz:${chatId}:${i}` },
    ]),
  };
}

async function launchQuiz(bot, chatId) {
  const q = getRandomQuestion();
  const sent = await bot.telegram.sendMessage(
    chatId,
    `🎮 Petit quiz du moment !\n\n${q.question}`,
    { reply_markup: buildQuizKeyboard(chatId, q.options) }
  );

  activeGames.set(chatId, {
    correctIndex: q.correctIndex,
    correctText: q.options[q.correctIndex],
    messageId: sent.message_id,
    answeredUsers: new Set(),
  });
}

/** À appeler depuis le handler bot.action() sur les callback_data "quiz:...". */
export async function handleQuizAnswer(ctx) {
  const [, chatIdStr, indexStr] = ctx.callbackQuery.data.split(":");
  const chatId = Number(chatIdStr);
  const chosenIndex = Number(indexStr);
  const game = activeGames.get(chatId);

  if (!game) {
    await ctx.answerCbQuery("Ce quiz est déjà terminé !");
    return;
  }

  if (game.answeredUsers.has(ctx.from.id)) {
    await ctx.answerCbQuery("Tu as déjà répondu à ce quiz !");
    return;
  }
  game.answeredUsers.add(ctx.from.id);

  if (chosenIndex === game.correctIndex) {
    await ctx.answerCbQuery("Bonne réponse ! 🎉");
    const name = ctx.from.first_name || ctx.from.username || "quelqu'un";
    addPoints(chatId, ctx.from.id, name, POINTS_FOR_CORRECT_ANSWER);
    await ctx.telegram.sendMessage(
      chatId,
      `🏆 ${name} a trouvé la bonne réponse (${game.correctText}) et gagne ${POINTS_FOR_CORRECT_ANSWER} points !`
    );
    activeGames.delete(chatId); // le quiz se termine dès la première bonne réponse
  } else {
    await ctx.answerCbQuery("Raté, essaie encore !");
  }
}

/** Démarre la boucle de mini-jeux automatiques (à appeler une fois après bot.launch()). */
export function scheduleAutoGames(bot) {
  const intervalMs = GAME_INTERVAL_HOURS * 60 * 60 * 1000;
  setInterval(() => {
    for (const chatId of getAllKnownGroupChats()) {
      launchQuiz(bot, chatId).catch((err) =>
        console.error(`Erreur lancement quiz pour ${chatId}:`, err.message)
      );
    }
  }, intervalMs);
  console.log(`Mini-jeux automatiques programmés toutes les ${GAME_INTERVAL_HOURS}h.`);
}
